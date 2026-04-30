/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"strings"
)

// FuncResolver is the interface for function resolution logic.
type FuncResolver interface {
	Resolve(ctx *AontuContext, args []Val) Val
}

// --- FuncBaseVal ---

type FuncBaseVal struct {
	ValBase
	funcName string
}

func NewFuncBaseVal(spec *ValSpec, name string) *FuncBaseVal {
	fv := &FuncBaseVal{
		ValBase:  NewValBase(spec),
		funcName: name,
	}
	return fv
}

func (v *FuncBaseVal) IsFunc() bool    { return true }
func (v *FuncBaseVal) IsGenable() bool { return true }
func (v *FuncBaseVal) IsFeature() bool { return true }
func (v *FuncBaseVal) CJO() int        { return 60000 }

func (v *FuncBaseVal) FuncArgs() []Val {
	if args, ok := v.peg.([]Val); ok {
		return args
	}
	return nil
}

func (v *FuncBaseVal) Canon() string {
	args := v.FuncArgs()
	parts := make([]string, len(args))
	for i, a := range args {
		parts[i] = a.Canon()
	}
	return v.funcName + "(" + strings.Join(parts, ",") + ")"
}

func (v *FuncBaseVal) Superior() Val { return top() }

// --- Concrete function types ---

// KeyFuncVal: key() - returns current key name
type KeyFuncVal struct {
	FuncBaseVal
}

func NewKeyFuncVal(spec *ValSpec, ctx *AontuContext) *KeyFuncVal {
	kv := &KeyFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "key")}
	return kv
}

func (v *KeyFuncVal) IsPathDependent() bool { return true }
func (v *KeyFuncVal) CJO() int              { return 60000 }

func (v *KeyFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	if peer.IsNil() {
		return peer
	}

	// Resolve: get key from path.
	// TS: this.path[this.path.length - (1 + move)]
	// move defaults to 1 (go up one level from leaf).
	move := 1
	args := v.FuncArgs()
	if len(args) > 0 {
		if n, ok := args[0].GetPeg().(int); ok {
			move = n
		} else if f, ok := args[0].GetPeg().(float64); ok {
			move = int(f)
		}
	}

	// Try own path first, then context path
	ownPath := v.GetPath()
	idx := len(ownPath) - (1 + move)
	if idx < 0 || idx >= len(ownPath) {
		// Fallback to context path
		ownPath = ctx.path
		idx = len(ownPath) - (1 + move)
	}

	if idx >= 0 && idx < len(ownPath) {
		key := ownPath[idx]
		result := NewStringVal(&ValSpec{Peg: key})
		result.dc = DONE
		if peer.IsTop() {
			return result
		}
		return unite(ctx, result, peer, "key-resolve")
	}

	// Can't resolve yet
	v.NotDone()
	return v
}

func (v *KeyFuncVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, &AontuError{Msg: "unresolved key()"}
}

func (v *KeyFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewKeyFuncVal(&ValSpec{Peg: v.peg}, ctx)
	if spec != nil && spec.Path != nil {
		out.path = spec.Path
	} else if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *KeyFuncVal) SpreadClone(ctx *AontuContext) Val {
	// Always clone for spreads — key() is path-dependent
	return v.Clone(ctx, nil)
}

// CopyFuncVal: copy(x) - clone value without marks
type CopyFuncVal struct {
	FuncBaseVal
}

func NewCopyFuncVal(spec *ValSpec, ctx *AontuContext) *CopyFuncVal {
	return &CopyFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "copy")}
}

func (v *CopyFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "copy-resolve")
	}
	if arg.IsNil() {
		return arg
	}
	cloned := arg.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{}})
	cloned.GetMark().Type = false
	cloned.GetMark().Hide = false
	walk(cloned, func(child Val, _ []string, _ int) bool {
		child.GetMark().Type = false
		child.GetMark().Hide = false
		return true
	}, 32)
	if peer.IsTop() {
		cloned.SetDC(DONE)
		return cloned
	}
	return unite(ctx, cloned, peer, "copy-apply")
}

func (v *CopyFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewCopyFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// MoveFuncVal: move(x) - clone and hide source
type MoveFuncVal struct {
	FuncBaseVal
}

func NewMoveFuncVal(spec *ValSpec, ctx *AontuContext) *MoveFuncVal {
	return &MoveFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "move")}
}

func (v *MoveFuncVal) IsPathDependent() bool { return true }

func (v *MoveFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "move-resolve")
	}
	if arg.IsNil() {
		return arg
	}
	cloned := arg.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{}})
	cloned.GetMark().Type = false
	cloned.GetMark().Hide = false
	walk(cloned, func(child Val, _ []string, _ int) bool {
		child.GetMark().Type = false
		child.GetMark().Hide = false
		return true
	}, 32)
	cloned.SetDC(DONE)
	if peer.IsTop() {
		return cloned
	}
	return unite(ctx, cloned, peer, "move-apply")
}

func (v *MoveFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewMoveFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// TypeFuncVal: type(x) - mark as type constraint
type TypeFuncVal struct {
	FuncBaseVal
}

func NewTypeFuncVal(spec *ValSpec, ctx *AontuContext) *TypeFuncVal {
	return &TypeFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "type")}
}

func (v *TypeFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "type-resolve")
	}
	cloned := arg.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{Type: true}})
	cloned.GetMark().Type = true
	walk(cloned, func(child Val, _ []string, _ int) bool {
		child.GetMark().Type = true
		return true
	}, 32)
	cloned.SetDC(DONE)
	if peer.IsTop() {
		return cloned
	}
	return unite(ctx, cloned, peer, "type-apply")
}

func (v *TypeFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewTypeFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// HideFuncVal: hide(x) - mark as hidden
type HideFuncVal struct {
	FuncBaseVal
}

func NewHideFuncVal(spec *ValSpec, ctx *AontuContext) *HideFuncVal {
	return &HideFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "hide")}
}

func (v *HideFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "hide-resolve")
	}
	cloned := arg.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{Hide: true}})
	cloned.GetMark().Hide = true
	walk(cloned, func(child Val, _ []string, _ int) bool {
		child.GetMark().Hide = true
		return true
	}, 32)
	cloned.SetDC(DONE)
	if peer.IsTop() {
		return cloned
	}
	return unite(ctx, cloned, peer, "hide-apply")
}

func (v *HideFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewHideFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// UpperFuncVal: upper(x) - uppercase string
type UpperFuncVal struct {
	FuncBaseVal
}

func NewUpperFuncVal(spec *ValSpec, ctx *AontuContext) *UpperFuncVal {
	return &UpperFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "upper")}
}

func (v *UpperFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "upper-resolve")
	}
	s, ok := arg.GetPeg().(string)
	if !ok {
		return makeNilErr(ctx, "upper_not_string", v, peer)
	}
	result := NewStringVal(&ValSpec{Peg: strings.ToUpper(s)})
	result.dc = DONE
	if peer.IsTop() {
		return result
	}
	return unite(ctx, result, peer, "upper-apply")
}

func (v *UpperFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewUpperFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// LowerFuncVal: lower(x) - lowercase string
type LowerFuncVal struct {
	FuncBaseVal
}

func NewLowerFuncVal(spec *ValSpec, ctx *AontuContext) *LowerFuncVal {
	return &LowerFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "lower")}
}

func (v *LowerFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "lower-resolve")
	}
	s, ok := arg.GetPeg().(string)
	if !ok {
		return makeNilErr(ctx, "lower_not_string", v, peer)
	}
	result := NewStringVal(&ValSpec{Peg: strings.ToLower(s)})
	result.dc = DONE
	if peer.IsTop() {
		return result
	}
	return unite(ctx, result, peer, "lower-apply")
}

func (v *LowerFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewLowerFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// PathFuncVal: path(x) - resolve path reference
type PathFuncVal struct {
	FuncBaseVal
}

func NewPathFuncVal(spec *ValSpec, ctx *AontuContext) *PathFuncVal {
	return &PathFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "path")}
}

func (v *PathFuncVal) IsPathDependent() bool { return true }

func (v *PathFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "pathfunc-resolve")
	}
	if arg.IsNil() {
		return arg
	}
	if peer.IsTop() {
		arg.SetDC(DONE)
		return arg
	}
	return unite(ctx, arg, peer, "pathfunc-apply")
}

func (v *PathFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewPathFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// PrefFuncVal: pref(x) - wrap in preference
type PrefFuncVal struct {
	FuncBaseVal
}

func NewPrefFuncVal(spec *ValSpec, ctx *AontuContext) *PrefFuncVal {
	return &PrefFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "pref")}
}

func (v *PrefFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "preffunc-resolve")
	}
	result := NewPrefVal(&ValSpec{Peg: arg}, ctx)
	result.dc = DONE
	if peer.IsTop() {
		return result
	}
	return unite(ctx, result, peer, "preffunc-apply")
}

func (v *PrefFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewPrefFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// CloseFuncVal: close(x) - close container
type CloseFuncVal struct {
	FuncBaseVal
}

func NewCloseFuncVal(spec *ValSpec, ctx *AontuContext) *CloseFuncVal {
	return &CloseFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "close")}
}

func (v *CloseFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "close-resolve")
	}
	cloned := arg.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{}})
	if m, ok := cloned.(*MapVal); ok {
		m.closed = true
	} else if l, ok := cloned.(*ListVal); ok {
		l.closed = true
	}
	cloned.SetDC(DONE)
	if peer.IsTop() {
		return cloned
	}
	return unite(ctx, cloned, peer, "close-apply")
}

func (v *CloseFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewCloseFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// OpenFuncVal: open(x) - open container
type OpenFuncVal struct {
	FuncBaseVal
}

func NewOpenFuncVal(spec *ValSpec, ctx *AontuContext) *OpenFuncVal {
	return &OpenFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "open")}
}

func (v *OpenFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return makeNilErr(ctx, "func_no_args", v, peer)
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "open-resolve")
	}
	cloned := arg.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{}})
	if m, ok := cloned.(*MapVal); ok {
		m.closed = false
	} else if l, ok := cloned.(*ListVal); ok {
		l.closed = false
	}
	cloned.SetDC(DONE)
	if peer.IsTop() {
		return cloned
	}
	return unite(ctx, cloned, peer, "open-apply")
}

func (v *OpenFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewOpenFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// SuperFuncVal: super() - get superior type
type SuperFuncVal struct {
	FuncBaseVal
}

func NewSuperFuncVal(spec *ValSpec, ctx *AontuContext) *SuperFuncVal {
	return &SuperFuncVal{FuncBaseVal: *NewFuncBaseVal(spec, "super")}
}

func (v *SuperFuncVal) IsPathDependent() bool { return true }

func (v *SuperFuncVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	args := v.FuncArgs()
	if len(args) == 0 {
		return top()
	}
	arg := args[0]
	if !arg.Done() {
		arg = unite(ctx, arg, top(), "super-resolve")
	}
	result := arg.Superior()
	result.SetDC(DONE)
	if peer.IsTop() {
		return result
	}
	return unite(ctx, result, peer, "super-apply")
}

func (v *SuperFuncVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewSuperFuncVal(&ValSpec{Peg: cloneArgs(v.FuncArgs(), ctx, spec)}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

// --- Helpers ---

func cloneArgs(args []Val, ctx *AontuContext, spec *ValSpec) interface{} {
	if args == nil {
		return []Val{}
	}
	out := make([]Val, len(args))
	for i, a := range args {
		if a != nil {
			out[i] = a.Clone(ctx, &ValSpec{Mark: &ValMark{}})
		}
	}
	return out
}
