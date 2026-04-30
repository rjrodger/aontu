/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

// OpBaseVal is the base for operator values.
type OpBaseVal struct {
	ValBase
	opName string
}

func NewOpBaseVal(spec *ValSpec, name string) *OpBaseVal {
	return &OpBaseVal{
		ValBase: NewValBase(spec),
		opName:  name,
	}
}

func (v *OpBaseVal) IsOp() bool      { return true }
func (v *OpBaseVal) IsGenable() bool { return true }
func (v *OpBaseVal) IsFeature() bool { return true }
func (v *OpBaseVal) CJO() int        { return 70000 }

func (v *OpBaseVal) OpArgs() []Val {
	if args, ok := v.peg.([]Val); ok {
		return args
	}
	return nil
}

func (v *OpBaseVal) Superior() Val { return top() }

// --- PlusOpVal: addition operator ---

type PlusOpVal struct {
	OpBaseVal
}

func NewPlusOpVal(spec *ValSpec, ctx *AontuContext) *PlusOpVal {
	return &PlusOpVal{OpBaseVal: *NewOpBaseVal(spec, "+")}
}

func (v *PlusOpVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	args := v.OpArgs()
	if len(args) < 2 {
		return makeNilErr(ctx, "plus_args", v, peer)
	}

	a := args[0]
	b := args[1]

	if !a.Done() {
		a = unite(ctx, a, top(), "plus-a")
	}
	if !b.Done() {
		b = unite(ctx, b, top(), "plus-b")
	}

	// Number addition
	an := toFloat64(a.GetPeg())
	bn := toFloat64(b.GetPeg())
	if a.IsScalar() && b.IsScalar() {
		if (a.IsNumber() || a.IsInteger()) && (b.IsNumber() || b.IsInteger()) {
			result := NewNumberVal(&ValSpec{Peg: an + bn})
			result.dc = DONE
			if peer.IsTop() {
				return result
			}
			return unite(ctx, result, peer, "plus-apply")
		}
	}

	// String concatenation
	as, aok := a.GetPeg().(string)
	bs, bok := b.GetPeg().(string)
	if aok && bok {
		result := NewStringVal(&ValSpec{Peg: as + bs})
		result.dc = DONE
		if peer.IsTop() {
			return result
		}
		return unite(ctx, result, peer, "plus-apply-str")
	}

	return makeNilErr(ctx, "plus_type", v, peer)
}

func (v *PlusOpVal) Gen(ctx *AontuContext) (interface{}, error) {
	result := v.Unify(top(), ctx)
	if result.IsNil() {
		return nil, &AontuError{Msg: "cannot generate plus: " + v.Canon()}
	}
	return result.Gen(ctx)
}

func (v *PlusOpVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	args := v.OpArgs()
	newArgs := make([]Val, len(args))
	for i, a := range args {
		if a != nil {
			newArgs[i] = a.Clone(ctx, &ValSpec{Mark: &ValMark{}})
		}
	}
	out := NewPlusOpVal(&ValSpec{Peg: newArgs}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *PlusOpVal) Canon() string {
	args := v.OpArgs()
	if len(args) >= 2 {
		return args[0].Canon() + "+" + args[1].Canon()
	}
	return "+()"
}
