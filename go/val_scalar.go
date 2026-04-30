/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"math"
	"strconv"
)

// ScalarVal is the base for all scalar (primitive) values.
type ScalarVal struct {
	ValBase
	kind ScalarKind
	src  string
}

func NewScalarVal(spec *ValSpec, kind ScalarKind) *ScalarVal {
	sv := &ScalarVal{
		ValBase: NewValBase(spec),
		kind:    kind,
	}
	sv.dc = DONE
	if spec != nil {
		sv.src = spec.Src
	}
	return sv
}

func (v *ScalarVal) IsScalar() bool  { return true }
func (v *ScalarVal) IsGenable() bool { return true }
func (v *ScalarVal) Done() bool      { return true }
func (v *ScalarVal) CJO() int        { return 20000 }

func (v *ScalarVal) Kind() ScalarKind { return v.kind }

func (v *ScalarVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil || peer.IsTop() {
		return v
	}
	if peer.IsScalarKind() {
		return peer.Unify(v, ctx)
	}
	if peer.IsScalar() {
		ps, ok := peer.(*ScalarVal)
		if !ok {
			// Try concrete types
			switch p := peer.(type) {
			case *StringVal:
				ps = &p.ScalarVal
			case *NumberVal:
				ps = &p.ScalarVal
			case *IntegerVal:
				ps = &p.ScalarVal
			case *BooleanVal:
				ps = &p.ScalarVal
			case *NullVal:
				ps = &p.ScalarVal
			}
		}
		if ps != nil && v.kind == ps.kind && v.peg == ps.peg {
			return v
		}
		// Number and Integer with same numeric value
		if ps != nil && (v.kind == KindNumber || v.kind == KindInteger) &&
			(ps.kind == KindNumber || ps.kind == KindInteger) {
			vn := toFloat64(v.peg)
			pn := toFloat64(ps.peg)
			if vn == pn {
				// Prefer NumberVal over IntegerVal
				if v.kind == KindNumber {
					return v
				}
				return peer
			}
		}
		return makeNilErr(ctx, "scalar_value", v, peer)
	}
	return makeNilErr(ctx, "scalar_value", v, peer)
}

func (v *ScalarVal) Gen(_ *AontuContext) (interface{}, error) {
	return v.peg, nil
}

func (v *ScalarVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	ns := &ValSpec{Peg: v.peg, Src: v.src}
	if spec != nil {
		if spec.Peg != nil {
			ns.Peg = spec.Peg
		}
		if spec.Path != nil {
			ns.Path = spec.Path
		}
		if spec.Mark != nil {
			ns.Mark = spec.Mark
		}
	}
	if ns.Path == nil && ctx != nil {
		ns.Path = ctx.path
	}
	out := NewScalarVal(ns, v.kind)
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *ScalarVal) Superior() Val {
	return NewScalarKindVal(&ValSpec{}, v.kind)
}

func (v *ScalarVal) Canon() string {
	return fmt.Sprintf("%v", v.peg)
}

// --- StringVal ---

type StringVal struct {
	ScalarVal
}

func NewStringVal(spec *ValSpec) *StringVal {
	sv := &StringVal{
		ScalarVal: *NewScalarVal(spec, KindString),
	}
	return sv
}

func (v *StringVal) IsString() bool { return true }

func (v *StringVal) Canon() string {
	s, ok := v.peg.(string)
	if !ok {
		return "''"
	}
	return "'" + s + "'"
}

func (v *StringVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	ns := &ValSpec{Peg: v.peg, Src: v.src}
	if spec != nil {
		if spec.Peg != nil {
			ns.Peg = spec.Peg
		}
		if spec.Path != nil {
			ns.Path = spec.Path
		}
		if spec.Mark != nil {
			ns.Mark = spec.Mark
		}
	}
	if ns.Path == nil && ctx != nil {
		ns.Path = ctx.path
	}
	out := NewStringVal(ns)
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *StringVal) Superior() Val {
	return NewScalarKindVal(&ValSpec{}, KindString)
}

// --- NumberVal ---

type NumberVal struct {
	ScalarVal
}

func NewNumberVal(spec *ValSpec) *NumberVal {
	nv := &NumberVal{
		ScalarVal: *NewScalarVal(spec, KindNumber),
	}
	return nv
}

func (v *NumberVal) IsNumber() bool { return true }

func (v *NumberVal) Canon() string {
	f := toFloat64(v.peg)
	if f == math.Trunc(f) && !math.IsInf(f, 0) {
		return strconv.FormatInt(int64(f), 10)
	}
	return strconv.FormatFloat(f, 'f', -1, 64)
}

func (v *NumberVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	ns := &ValSpec{Peg: v.peg, Src: v.src}
	if spec != nil {
		if spec.Peg != nil {
			ns.Peg = spec.Peg
		}
		if spec.Path != nil {
			ns.Path = spec.Path
		}
		if spec.Mark != nil {
			ns.Mark = spec.Mark
		}
	}
	if ns.Path == nil && ctx != nil {
		ns.Path = ctx.path
	}
	out := NewNumberVal(ns)
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *NumberVal) Superior() Val {
	return NewScalarKindVal(&ValSpec{}, KindNumber)
}

// --- IntegerVal ---

type IntegerVal struct {
	ScalarVal
}

func NewIntegerVal(spec *ValSpec) *IntegerVal {
	iv := &IntegerVal{
		ScalarVal: *NewScalarVal(spec, KindInteger),
	}
	return iv
}

func (v *IntegerVal) IsInteger() bool { return true }

func (v *IntegerVal) Canon() string {
	return fmt.Sprintf("%v", v.peg)
}

func (v *IntegerVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	ns := &ValSpec{Peg: v.peg, Src: v.src}
	if spec != nil {
		if spec.Peg != nil {
			ns.Peg = spec.Peg
		}
		if spec.Path != nil {
			ns.Path = spec.Path
		}
		if spec.Mark != nil {
			ns.Mark = spec.Mark
		}
	}
	if ns.Path == nil && ctx != nil {
		ns.Path = ctx.path
	}
	out := NewIntegerVal(ns)
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *IntegerVal) Superior() Val {
	return NewScalarKindVal(&ValSpec{}, KindInteger)
}

// --- BooleanVal ---

type BooleanVal struct {
	ScalarVal
}

func NewBooleanVal(spec *ValSpec) *BooleanVal {
	return &BooleanVal{
		ScalarVal: *NewScalarVal(spec, KindBoolean),
	}
}

func (v *BooleanVal) IsBoolean() bool { return true }

func (v *BooleanVal) Canon() string {
	b, ok := v.peg.(bool)
	if !ok {
		return "false"
	}
	if b {
		return "true"
	}
	return "false"
}

func (v *BooleanVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	ns := &ValSpec{Peg: v.peg, Src: v.src}
	if spec != nil {
		if spec.Peg != nil {
			ns.Peg = spec.Peg
		}
		if spec.Path != nil {
			ns.Path = spec.Path
		}
		if spec.Mark != nil {
			ns.Mark = spec.Mark
		}
	}
	if ns.Path == nil && ctx != nil {
		ns.Path = ctx.path
	}
	out := NewBooleanVal(ns)
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *BooleanVal) Superior() Val {
	return NewScalarKindVal(&ValSpec{}, KindBoolean)
}

// --- NullVal ---

type NullVal struct {
	ScalarVal
}

func NewNullVal(spec *ValSpec) *NullVal {
	nv := &NullVal{
		ScalarVal: *NewScalarVal(spec, KindNull),
	}
	nv.peg = nil
	return nv
}

func (v *NullVal) Canon() string { return "null" }

func (v *NullVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	ns := &ValSpec{Peg: nil}
	if spec != nil {
		if spec.Path != nil {
			ns.Path = spec.Path
		}
		if spec.Mark != nil {
			ns.Mark = spec.Mark
		}
	}
	if ns.Path == nil && ctx != nil {
		ns.Path = ctx.path
	}
	out := NewNullVal(ns)
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *NullVal) Superior() Val {
	return NewScalarKindVal(&ValSpec{}, KindNull)
}

// --- ScalarKindVal: type constraint ---

type ScalarKindVal struct {
	ValBase
	kind ScalarKind
}

func NewScalarKindVal(spec *ValSpec, kind ScalarKind) *ScalarKindVal {
	sk := &ScalarKindVal{
		ValBase: NewValBase(spec),
		kind:    kind,
	}
	sk.dc = DONE
	return sk
}

func (v *ScalarKindVal) IsScalarKind() bool { return true }
func (v *ScalarKindVal) IsFeature() bool    { return true }
func (v *ScalarKindVal) Done() bool         { return true }
func (v *ScalarKindVal) CJO() int           { return 25000 }
func (v *ScalarKindVal) Kind() ScalarKind   { return v.kind }

func (v *ScalarKindVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil || peer.IsTop() {
		return v
	}
	if peer.IsScalarKind() {
		pk := peer.(*ScalarKindVal)
		if v.kind == pk.kind {
			return v
		}
		// Integer is a subtype of Number
		if v.kind == KindNumber && pk.kind == KindInteger {
			return v
		}
		if v.kind == KindInteger && pk.kind == KindNumber {
			return peer
		}
		return makeNilErr(ctx, "scalar_kind", v, peer)
	}
	if peer.IsScalar() {
		sv := scalarValOf(peer)
		if sv == nil {
			return makeNilErr(ctx, "scalar_kind", v, peer)
		}
		if v.kind == sv.kind {
			return peer
		}
		// Integer scalar matches Number kind
		if v.kind == KindNumber && sv.kind == KindInteger {
			return peer
		}
		return makeNilErr(ctx, "scalar_kind", v, peer)
	}
	return makeNilErr(ctx, "scalar_kind", v, peer)
}

func (v *ScalarKindVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, fmt.Errorf("cannot generate ScalarKindVal")
}

func (v *ScalarKindVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewScalarKindVal(spec, v.kind)
	if ctx != nil && spec == nil {
		out.path = ctx.path
	}
	out.dc = DONE
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *ScalarKindVal) Canon() string {
	return v.kind.String()
}

func (v *ScalarKindVal) Superior() Val {
	return top()
}

// --- Helpers ---

func toFloat64(v interface{}) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case float32:
		return float64(n)
	case int:
		return float64(n)
	case int64:
		return float64(n)
	case int32:
		return float64(n)
	default:
		return 0
	}
}

func scalarValOf(v Val) *ScalarVal {
	switch sv := v.(type) {
	case *ScalarVal:
		return sv
	case *StringVal:
		return &sv.ScalarVal
	case *NumberVal:
		return &sv.ScalarVal
	case *IntegerVal:
		return &sv.ScalarVal
	case *BooleanVal:
		return &sv.ScalarVal
	case *NullVal:
		return &sv.ScalarVal
	default:
		return nil
	}
}

func copySite(src, dst *ValBase) {
	ss := src.GetSite()
	ds := dst.GetSite()
	ds.Row = ss.Row
	ds.Col = ss.Col
	ds.URL = ss.URL
}
