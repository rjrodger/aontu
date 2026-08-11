/* Copyright (c) 2025 Richard Rodger, MIT License */

// Package aontu is a Go port of the Aontu JSON structure unifier.
//
// Aontu unifies JSON-like structures using a CUE-inspired value
// lattice. The canonical implementation is the TypeScript code under
// ../ts/src; this package mirrors its core unification semantics and
// is validated against the shared test specs in ../test/spec (run by
// both implementations).
//
// Coverage note: this port has full parity with the TypeScript language
// — scalars, scalar kinds, maps (nesting, merge, spreads &:, optional
// keys, close/open), lists (incl. &: spreads), conjunction (&),
// disjunction (|), preference (*), references ($.a.b / .x.a / $KEY),
// $name variables, the + operator, all twelve built-in functions
// (upper/lower/copy/key/pref/super/type/hide/close/open/move/path),
// type/hide marks and @"file" source loading.
package aontu

import "strings"

// DONE marks a Val whose unification has fully converged.
const DONE = -1

// Val is the interface implemented by every value in the lattice.
type Val interface {
	// Canon returns the canonical, source-like representation.
	Canon() string

	// Gen produces the native Go value for output (JSON generation).
	// A non-nil error means the value could not be generated (e.g. an
	// unresolved type, conjunct or nil).
	Gen(ctx *Ctx) (any, error)

	// Unify combines this Val with peer, returning the result. The
	// result is a NilVal (Nil() == true) when they cannot unify.
	Unify(peer Val, ctx *Ctx) Val

	// Dc reports the done-counter; DONE means fully resolved.
	Dc() int

	// Nil reports whether this Val is a Nil (unification failure).
	Nil() bool

	setDc(dc int)
	pos() int
	setPos(p int)
	cjo() int
	superior() Val

	// vpath is the path from the root to this Val, used by references.
	vpath() []string
	setvpath(p []string)

	// Marks: type values are constraints, hidden values are excluded
	// from generation. Both are skipped when generating a containing map.
	markedType() bool
	markedHide() bool
	setMarkType(v bool)
	setMarkHide(v bool)
}

// base provides the shared, defaulted Val state. Concrete Val types
// embed it and override Canon/Gen/Unify/superior (and cjo/Nil where
// they differ).
type base struct {
	dc    int
	sp    int      // source position (byte offset), used to order error operands
	path  []string // path from root (for reference resolution)
	mtype bool     // type mark
	mhide bool     // hide mark
	// spr records the identity of the spread constraint already merged
	// into this value (the `_spr` stamp in TS MapVal.unify): the spread
	// applies ONCE per child, and later passes only self-unify.
	spr Val
	// pdep caches the hasPathFunc classification (0 unknown, 1 yes,
	// 2 no), mirroring the memoized `_isPathDependent` getter in TS
	// Val: in-place refinement can resolve a key()/ref after first
	// classification, and the cached answer must survive that, so the
	// spread clone-vs-share decision stays stable across passes.
	// Clones start unclassified, as in TS (clonePath builds fresh
	// structs for every composite kind).
	pdep int8
}

func (b *base) setVpath(p []string) { b.path = p }

func (b *base) getSpr() Val  { return b.spr }
func (b *base) setSpr(s Val) { b.spr = s }

func (b *base) getPdep() int8  { return b.pdep }
func (b *base) setPdep(p int8) { b.pdep = p }

// pdepVal is implemented by every Val via the embedded base.
type pdepVal interface {
	getPdep() int8
	setPdep(int8)
}

// sprVal is implemented by every Val via the embedded base.
type sprVal interface {
	getSpr() Val
	setSpr(Val)
}

func sprOf(v Val) Val {
	if s, ok := v.(sprVal); ok {
		return s.getSpr()
	}
	return nil
}

// forceRootPath replaces a Val's own path (root only — children keep
// their clone-time paths). Used by the copy() resolution, whose root
// path is fully truncated to the destination in TS.
func forceRootPath(v Val, p []string) {
	if b, ok := v.(interface{ setVpath([]string) }); ok {
		b.setVpath(p)
	}
}

func setSprOn(v Val, s Val) {
	if h, ok := v.(sprVal); ok {
		h.setSpr(s)
	}
}

func (b *base) Dc() int             { return b.dc }
func (b *base) Nil() bool           { return false }
func (b *base) setDc(dc int)        { b.dc = dc }
func (b *base) pos() int            { return b.sp }
func (b *base) setPos(p int)        { b.sp = p }
func (b *base) cjo() int            { return 99999 }
func (b *base) vpath() []string     { return b.path }
func (b *base) setvpath(p []string) { b.path = p }

func (b *base) markedType() bool   { return b.mtype }
func (b *base) markedHide() bool   { return b.mhide }
func (b *base) setMarkType(v bool) { b.mtype = v }
func (b *base) setMarkHide(v bool) { b.mhide = v }

// notdone advances the done-counter without marking DONE.
func (b *base) notdone() {
	if b.dc != DONE {
		b.dc++
	}
}

// --- type predicate helpers (mirror the TS isX flags) ---

func isTop(v Val) bool      { _, ok := v.(*TopVal); return ok }
func isConjunct(v Val) bool { _, ok := v.(*ConjunctVal); return ok }
func isDisjunct(v Val) bool { _, ok := v.(*DisjunctVal); return ok }
func isPref(v Val) bool     { _, ok := v.(*PrefVal); return ok }
func isRef(v Val) bool      { _, ok := v.(*RefVal); return ok }
func isVar(v Val) bool      { _, ok := v.(*VarVal); return ok }
func isFunc(v Val) bool     { _, ok := v.(*FuncVal); return ok }

// TopVal is the unit of the lattice: unifying with TOP yields the
// other operand. There is conceptually only one TOP.
type TopVal struct{ base }

func newTop() *TopVal {
	t := &TopVal{}
	t.dc = DONE
	return t
}

// A fresh instance per call (mirrors ts/src/val/top.ts): unify mutates
// Vals in place — setPaths writes paths, move() hide-walks set marks —
// so a shared TOP singleton could be corrupted by one parse and change
// the behaviour of every later parse in the same process.
func top() *TopVal { return newTop() }

func (t *TopVal) Canon() string { return "top" }
func (t *TopVal) superior() Val { return t }

func (t *TopVal) Gen(ctx *Ctx) (any, error) {
	// Silent (mirrors TopVal.gen returning undefined in TS): the
	// enclosing bag decides whether an unresolved top is an error
	// (direct child) or dropped (under a pref / optional subtree).
	return nil, nil
}

func (t *TopVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil || isTop(peer) {
		return t
	}
	return peer.Unify(t, ctx)
}

// NilVal represents a unification failure (bottom). It carries enough
// context to render the "Cannot unify value: X with value: Y" message
// that the shared error specs assert on.
type NilVal struct {
	base
	why       string
	msg       string
	fullmsg   string
	primary   Val
	secondary Val
}

func newNil(why string) *NilVal {
	n := &NilVal{why: why}
	n.dc = DONE
	return n
}

func (n *NilVal) Nil() bool     { return true }
func (n *NilVal) Canon() string { return "nil" }
func (n *NilVal) superior() Val { return n }

func (n *NilVal) Unify(peer Val, ctx *Ctx) Val { return n }

// Class is the code's class from the shared registry
// (test/spec/errcodes.tsv): conflict | incomplete | reference | parse |
// budget | internal. Mirrors the NilVal.class getter in TS.
func (n *NilVal) Class() string { return codeClass(n.why) }

func (n *NilVal) Gen(ctx *Ctx) (any, error) {
	// A why-less nil takes the gen-time code, mirroring the
	// `this.why = this.why ?? 'nil_gen'` default in TS NilVal.gen.
	if n.why == "" {
		n.why = "nil_gen"
	}
	return nil, &AontuError{Msg: n.FullMessage(), Code: n.why}
}

// FullMessage renders the failure the way the canonical TypeScript
// implementation renders a THROWN error (descErr, ts/src/err.ts):
// the `[aontu/<code>]` marker, the "Cannot <attempt> value(s) at path
// <path>" headline, the hint, and the value line. Used by the
// AontuError paths (unify/generate); the LSP/Problem surface keeps the
// short Message below, mirroring TS's own split (descErr vs the LSP's
// nilMessage). Source frames are not rendered yet — the remaining #29
// work (Go tracks a byte offset, not row/col).
func (n *NilVal) FullMessage() string {
	if n.fullmsg != "" {
		return n.fullmsg
	}
	attempt := "unify"
	plural := "s"
	if n.secondary == nil {
		attempt = "resolve"
		plural = ""
	}
	// The path comes from the primary operand, as TS NilVal.make copies
	// av.path onto the nil.
	path := "$"
	if n.primary != nil {
		if p := n.primary.vpath(); len(p) > 0 {
			path = "$." + strings.Join(p, ".")
		}
	}
	var b strings.Builder
	b.WriteString("[aontu/")
	b.WriteString(n.why)
	b.WriteString("]: Cannot ")
	b.WriteString(attempt)
	b.WriteString(" value")
	b.WriteString(plural)
	b.WriteString(" at path ")
	b.WriteString(path)
	if hint := hints[n.why]; hint != "" {
		b.WriteString("\n\n")
		b.WriteString(hint)
	}
	if n.primary != nil {
		b.WriteString("\n\nCannot ")
		b.WriteString(attempt)
		b.WriteString(" value: ")
		b.WriteString(n.primary.Canon())
		if n.secondary != nil {
			b.WriteString(" with value: ")
			b.WriteString(n.secondary.Canon())
		}
	}
	n.fullmsg = b.String()
	return n.fullmsg
}

// Message renders the human-readable failure message. The phrasing of
// the "Cannot <attempt> value: ..." line is kept compatible with the
// canonical TypeScript LSP diagnostic text (nilMessage, ts/src/lsp.ts);
// the thrown-error surface uses FullMessage above.
func (n *NilVal) Message() string {
	if n.msg != "" {
		return n.msg
	}
	attempt := "unify"
	if n.secondary == nil {
		attempt = "resolve"
	}
	var b strings.Builder
	b.WriteString("Cannot ")
	b.WriteString(attempt)
	b.WriteString(" value")
	if n.primary != nil {
		b.WriteString(": ")
		b.WriteString(n.primary.Canon())
		if n.secondary != nil {
			b.WriteString(" with value: ")
			b.WriteString(n.secondary.Canon())
		}
	}
	if hint := hints[n.why]; hint != "" {
		b.WriteString("\n")
		b.WriteString(hint)
	}
	n.msg = b.String()
	return n.msg
}

// makeNilErr builds a NilVal error and records it on ctx. The operand
// later in the source (greater position) becomes the primary, matching
// the TypeScript NilVal.make ordering so error messages agree.
func makeNilErr(ctx *Ctx, why string, a, b Val) *NilVal {
	n := newNil(why)
	if a != nil {
		n.primary = a
		n.sp = a.pos()
		if b != nil {
			n.secondary = b
			if b.pos() > a.pos() {
				n.primary = b
				n.secondary = a
				n.sp = b.pos()
			}
		}
	}
	if ctx != nil {
		ctx.adderr(n)
	}
	return n
}

// AontuError is the error type returned by Unify/Generate.
type AontuError struct {
	Msg string

	// Code is the error code of the FIRST underlying failure (the
	// NilVal `why`, e.g. "scalar_value", "no_path", "mapval_no_gen"),
	// mirroring errs()[0].why on the TypeScript AontuError. Empty when
	// no code is known (e.g. wrapped parse errors). Codes -- unlike
	// message text -- are in cross-implementation parity, registered in
	// test/spec/errcodes.tsv and pinned by `errc` spec rows.
	Code string
}

func (e *AontuError) Error() string { return e.Msg }
