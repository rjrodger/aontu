/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

// ADR-034. Twin of ts/src/val/MaybeFuncVal.ts and AbsentVal.ts.

// Top with one difference: absence is GENERABLE, and generates
// nothing, so a bag drops it at a required key too.
type AbsentVal struct{ base }

func newAbsent() *AbsentVal {
	a := &AbsentVal{}
	a.dc = DONE
	a.sp = -1
	return a
}

func isAbsent(v Val) bool { _, ok := v.(*AbsentVal); return ok }

func (a *AbsentVal) Canon() string { return "maybe()" }

//coverage:ignore-block the interface requires it; nothing asks an absence for a supertype
func (a *AbsentVal) superior() Val { return a }

func (a *AbsentVal) Gen(ctx *Ctx) (any, error) { return nil, nil }

// The unit of the meet: absence narrows nothing. uniteRaw calls this
// for EITHER operand, which is what makes `&` commute.
func (a *AbsentVal) Unify(peer Val, ctx *Ctx) Val {
	//coverage:ignore-block absence is born DONE, and every driver skips a DONE argument rather than meeting it with top
	if isTop(peer) {
		return a
	}
	return peer
}

// The error list is swapped as trialUnify swaps it, but trial mode is
// NOT set: its shared nil carries no code to judge the failure by.
func forgive(ctx *Ctx, f *FuncVal, base []string, arg Val) Val {
	saved := ctx.err
	ctx.err = []*NilVal{}
	ctx.slot = base

	out := unite(ctx, arg, top())

	sink := ctx.err
	ctx.err = saved

	if n, ok := out.(*NilVal); ok && "reference" == codeClass(n.why) {
		a := newAbsent()
		a.path = cp(base)
		a.sp, a.spu, a.surl = f.sp, f.spu, f.surl
		return a
	}

	for _, err := range sink {
		ctx.adderr(err)
	}

	return out
}
