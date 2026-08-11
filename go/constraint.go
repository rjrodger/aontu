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
	"sort"
	"strings"
)

type constraintBound struct {
	v    *ScalarVal
	open bool
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
	invalid string // why-code when the atom's arguments were unusable
}

func (c *ConstraintVal) cjo() int      { return 50000 }
func (c *ConstraintVal) superior() Val { return top() }

// constraintAtoms are the funcSet members routed to newConstraint by
// the func-paren handler in lang.go.
var constraintAtoms = map[string]bool{
	"min": true, "max": true, "above": true, "below": true, "neq": true,
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
		return makeNilErrFull(ctx, c.invalid, c, nil, "constrain", nil)
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
		return makeNilErrFull(ctx, peer.invalid, peer, nil, "constrain", nil)
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
		invalid: c.invalid,
	}
	out.dc = DONE
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
	if 0 == len(parts) {
		// Raw invalid atom: render the call so the error frame shows it.
		return "constraint()"
	}
	return strings.Join(parts, "&")
}

func (c *ConstraintVal) Gen(ctx *Ctx) (any, error) {
	// A residual constraint is not a concrete value (mirrors the TS
	// FeatureVal no_gen family; the bag level reports mapval_no_gen).
	return nil, &AontuError{Msg: "Cannot generate value: " + c.Canon(), Code: "no_gen"}
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
