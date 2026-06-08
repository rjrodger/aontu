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

var theTop = newTop()

func top() *TopVal { return theTop }

func (t *TopVal) Canon() string { return "top" }
func (t *TopVal) superior() Val { return t }

func (t *TopVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: top"}
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

func (n *NilVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: n.Message()}
}

// Message renders the human-readable failure message. The phrasing of
// the "Cannot <attempt> value: ..." line is kept compatible with the
// canonical TypeScript implementation (ts/src/err.ts).
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
}

func (e *AontuError) Error() string { return e.Msg }
