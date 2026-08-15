/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// ConstraintVal is the constraint algebra's residual value (G1 phase
// 1: bounds and neq), the exact port of ts/src/val/ConstraintVal.ts —
// see that file and docs/reference-language.md ("The constraint
// algebra") for the rules. In brief: an interval with open/closed
// endpoints and an exclusion set over one domain, with an optional
// numeric-leaf narrowing; bounds compare exactly across all leaves
// (numcmp.go); endpoints keep their written leaf (lazy endpoints);
// neq excludes by scalar identity; emptiness is decided eagerly where
// exact (empty interval, integral gap, point deletion under a
// narrowed leaf, domain mixing). Violations raise the registered
// `constraint` code with the admissible set in the error details.

import (
	"math"
	"regexp"
	"sort"
	"strings"
)

type constraintBound struct {
	v    *ScalarVal
	open bool
}

type constraintRe struct {
	v   *ScalarVal     // the stored pattern scalar (Canon renders the literal)
	src string         // the pattern text
	re  *regexp.Regexp // compiled by the host engine
}

// THE PORTABLE PATTERN SUBSET (G1 phase 2).
//
// The exact port of nonPortableRe in ts/src/val/ConstraintVal.ts -- read
// the rationale there. In brief: `re(p)` must mean the same thing in
// both engines AND cost about the same to evaluate, and neither is free.
// TypeScript compiles with JavaScript's backtracking RegExp, Go with
// RE2: a different language in a different complexity class. So the
// pattern is checked against one shared syntactic subset before either
// host engine sees it.
//
// Everything here is a WHITELIST. The first draft blacklisted the
// constructs known to differ and handed the rest to the host engines,
// and review found two escapes that silently diverge -- `\A` and `\z`
// are anchors here and identity escapes matching a literal "A"/"z" in
// JavaScript. A blacklist admits the next divergence by construction.
//
// The three rules:
//
//  1. GROUPS. `(?` opens only the non-capturing group `(?:`, which
//     refuses lookaround, atomic groups, conditionals, inline flags and
//     named groups (`(?P<n>` here, `(?<n>` in JavaScript) in one line.
//  2. ESCAPES. Only escapes with identical meaning in both engines pass.
//     Notably ABSENT: `\s`/`\S`, whose whitespace set is ASCII-only here
//     and Unicode in JavaScript.
//  3. QUANTIFIER NESTING. A quantifier may not be applied to a group
//     containing a quantifier or an alternation. This one is about TIME,
//     not meaning: `(a+)+$` is linear under RE2 and exponential in
//     JavaScript (45 seconds at 29 characters), and a regex match is
//     counted by no evaluator budget, so the shape is refused in both
//     ports to keep docs/trust.md clause 2 true in the port that has the
//     problem.
//
// Deliberately smaller than the true intersection: sound, not complete.

// reEscapeLetters are the escape letters whose meaning is identical in
// JavaScript (no flags) and RE2. Each was verified by probing both.
const reEscapeLetters = "dDwWtnrfvbB"

// reEscapePunct are the metacharacters that may be escaped to mean
// themselves. Other punctuation is left out because RE2 rejects some
// identity escapes JavaScript allows.
//
// `-` is NOT here: it is legal escaped only INSIDE a character class.
// Outside one, RE2 accepts `a\-b` and JavaScript's unicode mode (which
// the TypeScript port must use for code-point parity) makes it a syntax
// error, so admitting it either way is a divergence.
const reEscapePunct = `\.+*?()[]{}|^$/`

func isHexDigit(c rune) bool {
	return ('0' <= c && c <= '9') || ('a' <= c && c <= 'f') || ('A' <= c && c <= 'F')
}

// portableEscape reports why `\<n>` is not in the subset, or "" when it
// is, together with the number of EXTRA characters consumed beyond the
// backslash and n (for `\xHH`).
func portableEscape(n rune, at func(int) rune, i int, inClass bool) (string, int) {
	if 0 == n {
		return "a trailing backslash", 0
	}
	if '1' <= n && n <= '9' {
		return "a backreference (\\" + string(n) + "), which RE2 has no equivalent for", 0
	}
	if 'k' == n {
		return "a named backreference (\\k), which RE2 has no equivalent for", 0
	}
	if 'u' == n {
		return "a \\u escape, which RE2 spells \\x{...}", 0
	}
	if 'p' == n || 'P' == n {
		return "a Unicode class (\\" + string(n) + "), which JavaScript reads as a literal here", 0
	}
	if 's' == n || 'S' == n {
		return "\\" + string(n) + ", whose whitespace set differs between the engines" +
			" (write [ \\t\\n\\r\\f\\v])", 0
	}
	if 'A' == n || 'z' == n || 'Z' == n {
		return "\\" + string(n) + ", an anchor in RE2 but a literal \"" + string(n) +
			"\" in JavaScript", 0
	}
	if 'x' == n {
		if '{' == at(i+2) {
			return "a \\x{...} escape, which JavaScript spells \\u", 0
		}
		if !isHexDigit(at(i+2)) || !isHexDigit(at(i+3)) {
			return "an \\x escape without two hex digits", 0
		}
		return "", 2
	}
	if '-' == n {
		if inClass {
			return "", 0
		}
		return "\\-, which is a range separator inside a class and a syntax" +
			" error outside one (write a bare -)", 0
	}
	if strings.ContainsRune(reEscapeLetters, n) || strings.ContainsRune(reEscapePunct, n) {
		return "", 0
	}
	return "\\" + string(n) + ", an escape whose meaning the two engines do not share", 0
}

type reGroup struct {
	q, alt bool
}

func nonPortableRe(src string) string {
	inClass := false
	r := []rune(src)

	at := func(i int) rune {
		if i >= 0 && i < len(r) {
			return r[i]
		}
		return 0
	}

	// One frame per open group, recording whether the group contains a
	// quantifier or an alternation. A group carrying either may not
	// itself be quantified (rule 3); containment is transitive, so a
	// frame hands its flags up to its parent when it closes.
	groups := []reGroup{}
	mark := func(q bool) {
		if 0 < len(groups) {
			if q {
				groups[len(groups)-1].q = true
			} else {
				groups[len(groups)-1].alt = true
			}
		}
	}

	for i := 0; i < len(r); i++ {
		c := r[i]

		if '\\' == c {
			why, extra := portableEscape(at(i+1), at, i, inClass)
			if "" != why {
				return why
			}
			i += 1 + extra
			continue
		}

		// A POSIX class opener, anywhere. Checked BEFORE the in-class
		// branch because the POSIX form lives inside an ordinary class
		// (`[[:alpha:]]`), and refused everywhere rather than only
		// there: one rule is easier to mirror exactly than two, and a
		// literal `[:` costs an author nothing to rewrite.
		if '[' == c && ':' == at(i+1) {
			return "a POSIX class ([:...:]), which JavaScript does not have"
		}

		if inClass {
			if ']' == c {
				inClass = false
			}
			continue
		}

		if '[' == c {
			// An empty class: `[]` in JavaScript is a class that never
			// matches, in RE2 it does not compile. `[^]` is the same
			// disagreement one character along.
			first := at(i + 1)
			if '^' == first {
				first = at(i + 2)
			}
			if ']' == first {
				return "an empty character class, which RE2 refuses"
			}
			inClass = true
			continue
		}

		if '(' == c {
			if '?' == at(i+1) {
				if ':' != at(i+2) {
					return "a (?...) group other than the non-capturing (?:"
				}
				i += 2
			}
			groups = append(groups, reGroup{})
			continue
		}

		if ')' == c {
			if 0 == len(groups) {
				return "an unbalanced group"
			}
			g := groups[len(groups)-1]
			groups = groups[:len(groups)-1]
			nx := at(i + 1)
			quantified := '*' == nx || '+' == nx || '?' == nx || '{' == nx
			if quantified && (g.q || g.alt) {
				which := "an alternation"
				if g.q {
					which = "another quantifier"
				}
				return "a quantifier applied to a group containing " + which +
					", which backtracks exponentially in JavaScript"
			}
			// Containment is transitive: the parent inherits.
			if g.q {
				mark(true)
			}
			if g.alt {
				mark(false)
			}
			continue
		}

		if '|' == c {
			mark(false)
			continue
		}

		if '*' == c || '+' == c || '?' == c || '{' == c {
			mark(true)
			continue
		}
	}

	if inClass {
		return "an unterminated character class"
	}
	if 0 < len(groups) {
		return "an unclosed group"
	}

	return ""
}

// ConstraintVal is immutable after construction: meets build NEW
// residuals, so clones may share one (clonePath copies the struct
// shallowly, like a ScalarKindVal).
type ConstraintVal struct {
	base
	domain  string // "number", "string", or ""
	kind    Kind   // KindTop when unnarrowed; a numeric leaf otherwise
	lo, hi  *constraintBound
	neqs    []*ScalarVal
	res     []constraintRe // accumulated patterns, sorted by source
	invalid string         // why-code when the atom's arguments were unusable
	// invalidWhy is the human half of a constraint_pattern refusal: which
	// construct put the pattern outside the portable subset. Injected
	// into the hint as {reason}; the TS twin carries the same string.
	invalidWhy string
}

func (c *ConstraintVal) cjo() int      { return 50000 }
func (c *ConstraintVal) superior() Val { return top() }

// constraintAtoms are the funcSet members routed to newConstraint by
// the func-paren handler in lang.go.
var constraintAtoms = map[string]bool{
	"min": true, "max": true, "above": true, "below": true, "neq": true,
	"re": true,
}

// orderableScalar reports the algebra domain of a scalar: numeric
// leaves and strings have an order; booleans and null do not. NaN can
// never be constructed from source but is refused defensively.
func orderableScalar(v Val) (sv *ScalarVal, domain string) {
	s, ok := v.(*ScalarVal)
	if !ok {
		return nil, ""
	}
	switch s.kind {
	case KindInteger, KindBigInteger, KindBigDecimal:
		return s, "number"
	case KindFloat:
		if math.IsNaN(s.peg.(float64)) {
			return nil, ""
		}
		return s, "number"
	case KindString:
		return s, "string"
	}
	return nil, ""
}

// sameConstraintScalar is scalar identity — leaf AND value — with the
// value half decided exactly for numeric leaves.
func sameConstraintScalar(a, b *ScalarVal) bool {
	an := a.kind != KindString
	bn := b.kind != KindString
	if an && bn {
		return a.kind == b.kind && 0 == cmpNumeric(a, b)
	}
	if !an && !bn {
		return a.peg.(string) == b.peg.(string)
	}
	return false
}

// cmpConstraintVal is the domain-aware value comparison. Go string
// comparison is byte-wise UTF-8, which IS code-point order — the
// shared lexical rule (the TS side adapts; numcmp.ts cmpCodePoints).
func cmpConstraintVal(domain string, a, b *ScalarVal) int {
	if "number" == domain {
		return cmpNumeric(a, b)
	}
	return strings.Compare(a.peg.(string), b.peg.(string))
}

// newConstraint normalises one atom call into a residual. Arguments
// must be concrete orderable scalars in phase 1; reference-valued
// arguments are phase 4 (residuation).
func newConstraint(atom string, args []Val, sp int) *ConstraintVal {
	c := &ConstraintVal{kind: KindTop}
	c.dc = DONE
	c.sp = sp

	bad := func(why string) *ConstraintVal {
		c.invalid = why
		return c
	}

	if "neq" == atom {
		// Multiple arguments arrive from the func-paren grammar as one
		// entry holding the comma group (a ListVal); `neq([3,1,2])`
		// means the same thing (mirrors the TS raw-array unwrap).
		if 1 == len(args) {
			if lv, ok := args[0].(*ListVal); ok {
				args = lv.peg
			}
		}
		if 0 == len(args) {
			return bad("arg")
		}
		neqs := make([]*ScalarVal, 0, len(args))
		for _, a := range args {
			sv, d := orderableScalar(a)
			if nil == sv || ("" != c.domain && d != c.domain) {
				return bad("invalid-arg")
			}
			c.domain = d
			neqs = append(neqs, sv)
		}
		c.neqs = dedupSortedNeqs(c.domain, neqs)
		return c
	}

	if 1 != len(args) {
		return bad("arg")
	}

	// `re` is the one atom whose argument is not an ORDER point: a
	// pattern is a membership test, so it takes the string domain
	// outright rather than inferring a domain from the argument's leaf.
	if "re" == atom {
		psv, pd := orderableScalar(args[0])
		if nil == psv || "string" != pd {
			return bad("invalid-arg")
		}
		src := psv.peg.(string)
		if why := nonPortableRe(src); "" != why {
			c.invalidWhy = why
			return bad("constraint_pattern")
		}
		re, err := regexp.Compile(src)
		if nil != err {
			// The host engine refuses what the subset scanner passed --
			// a malformed quantifier, an unbalanced group. Same refusal
			// under the same code: the author gets one rule, not two.
			// The message is the host's, so it is NOT pinned by a shared
			// row; the code and the located frame are.
			c.invalidWhy = "not a valid pattern"
			return bad("constraint_pattern")
		}
		c.domain = "string"
		c.res = []constraintRe{{v: psv, src: src, re: re}}
		return c
	}

	sv, d := orderableScalar(args[0])
	if nil == sv {
		return bad("invalid-arg")
	}
	c.domain = d

	open := "above" == atom || "below" == atom
	b := &constraintBound{v: sv, open: open}
	if "min" == atom || "above" == atom {
		c.lo = b
	} else {
		c.hi = b
	}
	return c
}

func (c *ConstraintVal) Unify(peer Val, ctx *Ctx) Val {
	if "" != c.invalid {
		return makeNilErrFull(ctx, c.invalid, c, nil, "constrain", c.reasonDetails())
	}
	if nil == peer || isTop(peer) {
		return c
	}
	if peer.Nil() {
		return peer
	}
	if pc, ok := peer.(*ConstraintVal); ok {
		return c.meetConstraint(pc, ctx)
	}
	if pk, ok := peer.(*ScalarKindVal); ok {
		return c.meetKind(pk, ctx)
	}
	if ps, ok := peer.(*ScalarVal); ok {
		return c.admit(ps, ctx)
	}
	// Maps, lists, and every other non-scalar shape: no order, no
	// membership — a conflict of the constraint family.
	return c.fail(ctx, peer)
}

// admit checks membership: the peer scalar passes every part of the
// residual, or the meet is a located conflict.
func (c *ConstraintVal) admit(peer *ScalarVal, ctx *Ctx) Val {
	sv, d := orderableScalar(peer)
	if nil == sv || d != c.domain {
		return c.fail(ctx, peer)
	}
	if KindTop != c.kind && peer.kind != c.kind {
		return c.fail(ctx, peer)
	}
	if nil != c.lo {
		cv := cmpConstraintVal(c.domain, peer, c.lo.v)
		if cv < 0 || (0 == cv && c.lo.open) {
			return c.fail(ctx, peer)
		}
	}
	if nil != c.hi {
		cv := cmpConstraintVal(c.domain, peer, c.hi.v)
		if cv > 0 || (0 == cv && c.hi.open) {
			return c.fail(ctx, peer)
		}
	}
	for _, n := range c.neqs {
		if sameConstraintScalar(peer, n) {
			return c.fail(ctx, peer)
		}
	}
	// Every accumulated pattern must match: the meet of two `re` atoms
	// is conjunction, and matching is UNANCHORED in both engines
	// (Go MatchString, JS RegExp.test), so `re("el")` admits "hello".
	// Anchor with ^ and $ to mean the whole string.
	for _, r := range c.res {
		if !r.re.MatchString(peer.peg.(string)) {
			return c.fail(ctx, peer)
		}
	}
	return peer
}

// meetKind: `number` (or `string` on the string domain) is already
// implied; a numeric LEAF narrows the residual; anything else has an
// empty intersection with the constraint's domain.
func (c *ConstraintVal) meetKind(peer *ScalarKindVal, ctx *Ctx) Val {
	switch peer.kind {
	case KindNumber:
		if "number" == c.domain {
			return c
		}
		return c.fail(ctx, peer)
	case KindString:
		if "string" == c.domain {
			return c
		}
		return c.fail(ctx, peer)
	case KindInteger, KindFloat, KindBigInteger, KindBigDecimal:
		if "number" != c.domain {
			return c.fail(ctx, peer)
		}
		if KindTop != c.kind && c.kind != peer.kind {
			return c.fail(ctx, peer)
		}
		merged := c.cloneState()
		merged.kind = peer.kind
		return c.finish(merged, ctx, peer)
	}
	return c.fail(ctx, peer)
}

// meetConstraint: interval intersection, exclusion union, kind union —
// then the eager emptiness rules.
func (c *ConstraintVal) meetConstraint(peer *ConstraintVal, ctx *Ctx) Val {
	if "" != peer.invalid {
		return makeNilErrFull(ctx, peer.invalid, peer, nil, "constrain", peer.reasonDetails())
	}
	if "" != c.domain && "" != peer.domain && c.domain != peer.domain {
		return c.fail(ctx, peer)
	}
	if KindTop != c.kind && KindTop != peer.kind && c.kind != peer.kind {
		return c.fail(ctx, peer)
	}

	merged := c.cloneState()
	if "" == merged.domain {
		merged.domain = peer.domain
	}
	if KindTop == merged.kind {
		merged.kind = peer.kind
	}
	merged.lo = tighterBound(merged.domain, c.lo, peer.lo, true)
	merged.hi = tighterBound(merged.domain, c.hi, peer.hi, false)
	merged.neqs = dedupSortedNeqs(merged.domain, append(append([]*ScalarVal{}, c.neqs...), peer.neqs...))
	merged.res = dedupSortedRes(append(append([]constraintRe{}, c.res...), peer.res...))

	return c.finish(merged, ctx, peer)
}

// finish applies the eager emptiness rules and builds the merged
// residual (a NEW value; residuals are immutable).
func (c *ConstraintVal) finish(state *ConstraintVal, ctx *Ctx, peer Val) Val {
	d := state.domain

	if nil != state.lo && nil != state.hi {
		cv := cmpConstraintVal(d, state.hi.v, state.lo.v)
		if cv < 0 || (0 == cv && (state.lo.open || state.hi.open)) {
			return c.fail(ctx, peer)
		}
	}

	integral := KindInteger == state.kind || KindBigInteger == state.kind

	// Integral gap: an integer-narrowed interval containing no whole
	// number is empty (integer & above(1) & below(2)). The
	// representability holes of the int64-window integer leaf are
	// deliberately NOT modelled — sound, incomplete (see the TS twin).
	if integral && nil != state.lo && nil != state.hi {
		lo := scaledOfNumeric(state.lo.v)
		hi := scaledOfNumeric(state.hi.v)
		if 0 == lo.inf && 0 == hi.inf {
			n := scaledFloorBig(lo)
			if !scaledIsIntegral(lo) || state.lo.open {
				n.Add(n, oneBig)
			}
			m := scaledFloorBig(hi)
			if state.hi.open && scaledIsIntegral(hi) {
				m.Sub(m, oneBig)
			}
			if m.Cmp(n) < 0 {
				return c.fail(ctx, peer)
			}
		}
	}

	// Point deletion under a narrowed leaf: a closed point interval
	// whose single value of the narrowed leaf is excluded is empty
	// (integer & min(3) & max(3) & neq(3)). Without a narrowing the
	// point survives in the other leaves.
	if KindTop != state.kind && nil != state.lo && nil != state.hi &&
		!state.lo.open && !state.hi.open &&
		0 == cmpConstraintVal(d, state.lo.v, state.hi.v) {
		for _, n := range state.neqs {
			if n.kind == state.kind && 0 == cmpNumeric(n, state.lo.v) {
				return c.fail(ctx, peer)
			}
		}
	}

	state.dc = DONE
	state.path = cp(c.path)
	state.sp = c.sp
	return state
}

func (c *ConstraintVal) fail(ctx *Ctx, peer Val) Val {
	pcanon := ""
	if nil != peer {
		pcanon = peer.Canon()
	}
	return makeNilErrFull(ctx, "constraint", c, peer, "", map[string]string{
		"expected": c.Canon(),
		"actual":   pcanon,
	})
}

// cloneState is a fresh residual carrying this one's fields (bounds
// and exclusions share pointers; they are immutable).
func (c *ConstraintVal) cloneState() *ConstraintVal {
	out := &ConstraintVal{
		domain:  c.domain,
		kind:    c.kind,
		lo:      c.lo,
		hi:      c.hi,
		neqs:    append([]*ScalarVal{}, c.neqs...),
		res:     append([]constraintRe{}, c.res...),
		invalid: c.invalid,
	}
	out.invalidWhy = c.invalidWhy
	out.dc = DONE
	return out
}

// reasonDetails carries the portable-subset refusal reason into the
// hint as {reason}; every other invalid code has no detail to inject.
func (c *ConstraintVal) reasonDetails() map[string]string {
	if "" == c.invalidWhy {
		return nil
	}
	return map[string]string{"reason": c.invalidWhy}
}

// dedupSortedRes sorts accumulated patterns by source in code-point
// order and drops exact duplicates. Patterns are NEVER simplified or
// compared for containment: deciding `re("a")` subsumes `re("a|b")` is
// regex containment, which the algebra deliberately does not do
// (emptiness stays approximate -- sound, incomplete). Two spellings of
// one language therefore both survive, and both are tested.
func dedupSortedRes(res []constraintRe) []constraintRe {
	sorted := append([]constraintRe{}, res...)
	sort.SliceStable(sorted, func(i, j int) bool {
		return sorted[i].src < sorted[j].src
	})
	out := []constraintRe{}
	for _, r := range sorted {
		if 0 == len(out) || out[len(out)-1].src != r.src {
			out = append(out, r)
		}
	}
	return out
}

// Canon renders the fixed canonical atom order: kind, lower bound,
// upper bound, neq (arguments sorted). Reparses to a conjunct of atoms
// that normalises back to this exact residual.
func (c *ConstraintVal) Canon() string {
	parts := []string{}
	if KindTop != c.kind {
		parts = append(parts, c.kind.String())
	}
	if nil != c.lo {
		a := "min("
		if c.lo.open {
			a = "above("
		}
		parts = append(parts, a+c.lo.v.Canon()+")")
	}
	if nil != c.hi {
		a := "max("
		if c.hi.open {
			a = "below("
		}
		parts = append(parts, a+c.hi.v.Canon()+")")
	}
	if 0 < len(c.neqs) {
		ns := make([]string, len(c.neqs))
		for i, n := range c.neqs {
			ns[i] = n.Canon()
		}
		parts = append(parts, "neq("+strings.Join(ns, ",")+")")
	}
	for _, r := range c.res {
		parts = append(parts, "re("+r.v.Canon()+")")
	}
	if 0 == len(parts) {
		// Raw invalid atom: render the call so the error frame shows it.
		return "constraint()"
	}
	return strings.Join(parts, "&")
}

func (c *ConstraintVal) Gen(ctx *Ctx) (any, error) {
	// A residual constraint is not a concrete value (mirrors the TS
	// FeatureVal no_gen family; the bag level reports mapval_no_gen).
	return nil, residueErr(ctx, c, "no_gen")
}

// tighterBound picks the tighter of two like-direction bounds: the
// higher lower bound (or lower upper bound); on the same point the
// OPEN bound wins, and on a full tie the tower-lowest endpoint
// spelling survives.
func tighterBound(domain string, a, b *constraintBound, lower bool) *constraintBound {
	if nil == a {
		return b
	}
	if nil == b {
		return a
	}
	cv := cmpConstraintVal(domain, a.v, b.v)
	if 0 != cv {
		if (lower && 0 < cv) || (!lower && cv < 0) {
			return a
		}
		return b
	}
	if a.open != b.open {
		if a.open {
			return a
		}
		return b
	}
	if "number" == domain && towerRank(b.v) < towerRank(a.v) {
		return b
	}
	return a
}

// dedupSortedNeqs sorts excluded scalars for canon (numeric: by point
// then tower rank; string: code-point order) and drops identity
// duplicates.
func dedupSortedNeqs(domain string, neqs []*ScalarVal) []*ScalarVal {
	sorted := append([]*ScalarVal{}, neqs...)
	sort.SliceStable(sorted, func(i, j int) bool {
		cv := cmpConstraintVal(domain, sorted[i], sorted[j])
		if 0 != cv {
			return cv < 0
		}
		return "number" == domain && towerRank(sorted[i]) < towerRank(sorted[j])
	})
	out := []*ScalarVal{}
	for _, n := range sorted {
		if 0 == len(out) || !sameConstraintScalar(out[len(out)-1], n) {
			out = append(out, n)
		}
	}
	return out
}
