/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"strconv"
	"strings"
)

// Kind enumerates the scalar kinds (type constraints).
type Kind int

const (
	KindTop Kind = iota
	KindNil
	KindString
	KindNumber
	KindInteger
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
	case KindBoolean:
		return "boolean"
	case KindNull:
		return "null"
	case KindNil:
		return "nil"
	}
	return "top"
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
func newNumber(f float64) *ScalarVal {
	v := &ScalarVal{kind: KindNumber, peg: f}
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
	case KindNumber:
		return formatNumber(s.peg.(float64))
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

func (k *ScalarKindVal) superior() Val { return k }
func (k *ScalarKindVal) Canon() string { return k.kind.String() }

func (k *ScalarKindVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: " + k.kind.String()}
}

func (k *ScalarKindVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil || isTop(peer) {
		return k
	}
	if ps, ok := peer.(*ScalarVal); ok {
		if ps.kind == k.kind {
			return ps
		}
		// Integer is a subtype of Number.
		if k.kind == KindNumber && ps.kind == KindInteger {
			return ps
		}
		return makeNilErr(ctx, "no_scalar_unify", k, peer)
	}
	if pk, ok := peer.(*ScalarKindVal); ok {
		if k.kind == KindNumber && pk.kind == KindInteger {
			return pk
		}
		if pk.kind == KindNumber && k.kind == KindInteger {
			return k
		}
		if k.kind == pk.kind {
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

// formatNumber renders a float64 the way JavaScript's Number.toString
// does for the simple cases in the spec (e.g. 1.5, -2.5, integral
// floats collapse to "1").
func formatNumber(f float64) string {
	return strconv.FormatFloat(f, 'g', -1, 64)
}
