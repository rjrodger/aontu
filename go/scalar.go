/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"math"
	"strconv"
	"strings"
)

// Kind enumerates the scalar kinds (type constraints).
//
// The numeric kinds form a small lattice (docs/design/number-tower.md):
//
//	number                pure supertype: the set of all numeric values
//	|- integer            int64-window exact
//	|- float              IEEE-754 binary64
//
// KindNumber is a SUPERTYPE only: it names no representation and is
// carried by a ScalarKindVal (the `number` keyword) alone — a concrete
// ScalarVal always carries a numeric LEAF kind. The leaves are pairwise
// disjoint; the tower's two further leaves (biginteger, bigdecimal) join
// them below, and the only places that need to learn about them are
// numericLeafKinds and the Kind.String switch.
type Kind int

const (
	KindTop Kind = iota
	KindNil
	KindString
	// KindNumber is the numeric supertype; it is never a ScalarVal kind.
	KindNumber
	// Numeric leaves. Keep contiguous, and extend numericLeafKinds when
	// adding one.
	KindInteger
	KindFloat
	KindBoolean
	KindNull
)

func (k Kind) String() string {
	switch k {
	case KindString:
		return "string"
	case KindNumber:
		return "number"
	case KindInteger:
		return "integer"
	case KindFloat:
		return "float"
	case KindBoolean:
		return "boolean"
	case KindNull:
		return "null"
	case KindNil:
		return "nil"
	}
	return "top"
}

// numericLeafKinds is the set of concrete numeric kinds sitting directly
// under `number`. Every leaf here is a set of values disjoint from every
// other leaf, so two distinct leaves have no common lower bound and
// cannot unify (`float & integer` is an error). The tower adds
// biginteger and bigdecimal to this set.
var numericLeafKinds = map[Kind]bool{
	KindInteger: true,
	KindFloat:   true,
}

// kindSubsumes reports whether kind sup is a strict supertype of kind
// sub, i.e. every value of sub is a value of sup. Today the only such
// relation is `number` over its numeric leaves.
func kindSubsumes(sup, sub Kind) bool {
	return sup == KindNumber && numericLeafKinds[sub]
}

// kindParent returns the immediate lattice parent of a kind, and whether
// there is one. A numeric leaf lifts to `number`; `number` itself, and
// every non-numeric kind, has no parent and therefore lifts to top.
// This is the ladder super() climbs (R6, extended by the tower).
//
// It is deliberately NOT ScalarKindVal.superior(): superior() is also
// the narrowing gate PrefVal uses (`*integer & "hello"` must admit the
// string), so a kind's superior stays top there. See ScalarKindVal.
func kindParent(k Kind) (Kind, bool) {
	if numericLeafKinds[k] {
		return KindNumber, true
	}
	return KindTop, false
}

// kindFamily returns the root of a kind's family: its highest ancestor
// below top. Every numeric leaf answers `number`; a kind with no parent
// (string, boolean, null — and `number` itself) is its own family root.
//
// Used by PrefVal, which gates an override on the preferred value's
// FAMILY rather than its leaf, so that a float default can still be
// overridden by an integer (`*2.2 & 3`). Mirrors TS kindFamily.
func kindFamily(k Kind) Kind {
	for {
		p, ok := kindParent(k)
		if !ok {
			return k
		}
		k = p
	}
}

// ScalarVal is a concrete scalar literal: a native value tagged with
// its Kind. peg holds string | int64 | float64 | bool | nil.
type ScalarVal struct {
	base
	kind Kind
	peg  any
}

func newString(s string) *ScalarVal { v := &ScalarVal{kind: KindString, peg: s}; v.dc = DONE; return v }
func newInteger(i int64) *ScalarVal {
	v := &ScalarVal{kind: KindInteger, peg: i}
	v.dc = DONE
	return v
}
func newFloat(f float64) *ScalarVal {
	v := &ScalarVal{kind: KindFloat, peg: f}
	v.dc = DONE
	return v
}
func newBoolean(b bool) *ScalarVal { v := &ScalarVal{kind: KindBoolean, peg: b}; v.dc = DONE; return v }
func newNull() *ScalarVal          { v := &ScalarVal{kind: KindNull, peg: nil}; v.dc = DONE; return v }

func (s *ScalarVal) superior() Val { return newScalarKind(s.kind) }

func (s *ScalarVal) Canon() string {
	switch s.kind {
	case KindString:
		return jsonString(s.peg.(string))
	case KindInteger:
		return strconv.FormatInt(s.peg.(int64), 10)
	case KindFloat:
		return canonNumber(s.peg.(float64))
	case KindBoolean:
		if s.peg.(bool) {
			return "true"
		}
		return "false"
	case KindNull:
		return "null"
	}
	return ""
}

func (s *ScalarVal) Gen(ctx *Ctx) (any, error) {
	// Negative zero never reaches generated output. (Unary minus already
	// normalises it away, but `+` and the NewNumber API can still build
	// one, so the generate path normalises too.)
	if s.kind == KindFloat {
		if f, ok := s.peg.(float64); ok && f == 0 {
			return float64(0), nil
		}
	}
	return s.peg, nil
}

func (s *ScalarVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil || isTop(peer) {
		return s
	}
	if sk, ok := peer.(*ScalarKindVal); ok {
		return sk.Unify(s, ctx)
	}
	if ps, ok := peer.(*ScalarVal); ok {
		if ps.kind == s.kind && ps.peg == s.peg {
			// Marks ratchet true across a unify (TS propagateMarks): a
			// hide()/type() spread clone marks the destination value
			// (`K:true &:hide($flag)` hides K).
			if ps.mtype {
				s.mtype = true
			}
			if ps.mhide {
				s.mhide = true
			}
			return s
		}
		code := "scalar_kind"
		if ps.kind == s.kind {
			code = "scalar_value"
		}
		return makeNilErr(ctx, code, s, peer)
	}
	return makeNilErr(ctx, "scalar", s, peer)
}

// ScalarKindVal is a type constraint (e.g. string, number) — a scalar
// kind without a concrete value.
type ScalarKindVal struct {
	base
	kind Kind
}

func newScalarKind(k Kind) *ScalarKindVal {
	v := &ScalarKindVal{kind: k}
	v.dc = DONE
	return v
}

// superior of a kind is TOP (TS ScalarKindVal inherits FeatureVal's
// superior): a pref whose peg is a kind (`*integer & "hello"`) lets any
// concrete peer narrow it rather than clashing with the kind.
//
// This is NOT the kind lattice's parent relation — `super(integer)` is
// `number`, not top. That ladder is kindParent, consulted directly by
// the super() function; superior() has the separate PrefVal job above
// and must keep answering top for every kind.
func (k *ScalarKindVal) superior() Val { return top() }
func (k *ScalarKindVal) Canon() string { return k.kind.String() }

func (k *ScalarKindVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: " + k.kind.String()}
}

func (k *ScalarKindVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil || isTop(peer) {
		return k
	}
	if ps, ok := peer.(*ScalarVal); ok {
		// A kind admits a concrete value of that kind, and a supertype
		// admits a value of any kind below it (`number & 1.5` is 1.5).
		if ps.kind == k.kind || kindSubsumes(k.kind, ps.kind) {
			return ps
		}
		return makeNilErr(ctx, "no_scalar_unify", k, peer)
	}
	if pk, ok := peer.(*ScalarKindVal); ok {
		// Meet of two kinds: the same kind, or the lower of a
		// supertype/subtype pair (`number & float` is `float`). Two
		// distinct leaves describe disjoint value sets, so they have no
		// common lower bound and cannot unify.
		if k.kind == pk.kind {
			return k
		}
		if kindSubsumes(k.kind, pk.kind) {
			return pk
		}
		if kindSubsumes(pk.kind, k.kind) {
			return k
		}
		return makeNilErr(ctx, "scalar-type", k, peer)
	}
	return makeNilErr(ctx, "not-scalar-type", k, peer)
}

// jsonString renders a Go string as a JSON string literal, matching
// JavaScript's JSON.stringify for the cases used by the spec.
func jsonString(s string) string {
	var b strings.Builder
	b.WriteByte('"')
	for _, r := range s {
		switch r {
		case '"':
			b.WriteString(`\"`)
		case '\\':
			b.WriteString(`\\`)
		case '\b':
			b.WriteString(`\b`)
		case '\f':
			b.WriteString(`\f`)
		case '\n':
			b.WriteString(`\n`)
		case '\r':
			b.WriteString(`\r`)
		case '\t':
			b.WriteString(`\t`)
		default:
			// Other control characters become \u00XX, matching
			// JavaScript's JSON.stringify.
			if r < 0x20 {
				const hexd = "0123456789abcdef"
				b.WriteString(`\u00`)
				b.WriteByte(hexd[(r>>4)&0xf])
				b.WriteByte(hexd[r&0xf])
			} else {
				b.WriteRune(r)
			}
		}
	}
	b.WriteByte('"')
	return b.String()
}

// formatNumber renders a float64 exactly the way JavaScript's
// Number.toString does: fixed decimal notation for exponents in
// [-6, 20], otherwise exponential with an unpadded, always-signed
// exponent ("1e+21", "1e-7" — not Go's "1e+21"/"1e-07"). This keeps
// numeric canon output identical to the TS implementation at every
// magnitude.
func formatNumber(f float64) string {
	// Both zeros render as "0" — negative zero never survives into
	// output. (JS agrees: String(-0) is "0".)
	if f == 0 {
		return "0"
	}
	// Non-finite values render as JS Number.toString does; they cannot
	// arrive via the parser (an overflowing literal becomes not_number)
	// but are reachable through the exported NewNumber constructor.
	if math.IsNaN(f) {
		return "NaN"
	}
	if math.IsInf(f, 1) {
		return "Infinity"
	}
	if math.IsInf(f, -1) {
		return "-Infinity"
	}
	mant := strconv.FormatFloat(f, 'e', -1, 64)
	i := strings.IndexByte(mant, 'e')
	digits := mant[:i]
	exp, _ := strconv.Atoi(mant[i+1:])
	if exp >= -6 && exp <= 20 {
		return strconv.FormatFloat(f, 'f', -1, 64)
	}
	sign := "+"
	if exp < 0 {
		sign = "-"
		exp = -exp
	}
	return digits + "e" + sign + strconv.Itoa(exp)
}

// canonNumber renders a number-kind scalar for CANON, where the output
// must reparse to a value of the same kind. formatNumber alone would
// render 1.0 as "1", which reparses as an integer, so a rendering that
// carries neither a fraction nor an exponent gains a ".0" suffix:
//
//	1.0 -> "1.0"   0.0 -> "0.0"   1e20 -> "100000000000000000000.0"
//	1e21 -> "1e+21"   0.000001 -> "0.000001"   NaN/Infinity -> unchanged
//
// This is the canon path ONLY. String coercion inside `+` keeps plain
// JS parity ("a"+1.0 is "a1") and so goes through formatNumber, which
// must not pick up the suffix.
func canonNumber(f float64) string {
	s := formatNumber(f)
	// '.' fraction, 'e'/'E' exponent, 'N' NaN, 'I' Infinity.
	if strings.ContainsAny(s, ".eENI") {
		return s
	}
	return s + ".0"
}
