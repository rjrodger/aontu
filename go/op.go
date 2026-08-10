/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strconv"

// PlusOpVal is the `+` operator: string concatenation, numeric addition
// or boolean or. Ported from ts/src/val/PlusOpVal.ts and OpBaseVal.ts.
// Operands are resolved to done before the operation runs; an operation
// that cannot yet run defers across fixpoint passes.
type PlusOpVal struct {
	base
	peg []Val
}

func newPlusOp(a, b Val) *PlusOpVal { return &PlusOpVal{peg: []Val{a, b}} }

func (o *PlusOpVal) superior() Val { return top() }

func (o *PlusOpVal) Canon() string {
	return o.peg[0].Canon() + "+" + o.peg[1].Canon()
}

func (o *PlusOpVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: " + o.Canon()}
}

func (o *PlusOpVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	if Val(o) == peer {
		return o
	}

	// Operands are driven at the op's own location (TS drives them with
	// the same undescended ctx; the slot hint is single-use per unite).
	slot := ctx.slot

	// Resolve operands into a scratch slice WITHOUT writing them back:
	// a stuck op keeps its original operands (`$flag+[...]` renders the
	// unresolved $flag), matching TS OpBaseVal.unify, which also only
	// passes the resolved args to operate().
	var out Val = o
	pegdone := true
	newpeg := make([]Val, len(o.peg))
	for i, arg := range o.peg {
		if arg.Dc() != DONE {
			ctx.slot = slot
			arg = unite(ctx, arg, top())
		}
		newpeg[i] = arg
		if arg.Dc() != DONE {
			pegdone = false
		}
	}

	if pegdone {
		result := o.operate(newpeg)
		if result == nil {
			switch {
			case isTop(peer):
				out = o
			case peer.Nil():
				out = makeNilErr(ctx, "op", o, peer)
			case o.Canon() == peer.Canon():
				out = o
			default:
				out = newConjunct([]Val{o, peer})
			}
		} else {
			out = unite(ctx, result, peer)
		}
	} else if isTop(peer) {
		// Rebuild with the resolved-so-far operands (mirrors the
		// `out = this.make(ctx, { peg: newpeg })` not-pegdone branch in
		// TS OpBaseVal.unify) so canon shows partial arg resolution.
		np := newPlusOp(newpeg[0], newpeg[1])
		np.path = cp(o.path)
		np.sp = o.sp
		out = np
	} else if peer.Nil() {
		out = peer
	} else {
		out = newConjunct([]Val{o, peer})
	}

	if out.Dc() != DONE {
		out.setDc(o.dc + 1)
	}
	return out
}

// operate computes the result once both operands are concrete. Only
// concrete scalar operands are valid (mirrors PlusOpVal.operate in TS):
// kinds, maps, lists, null, top and funcs do not coerce — the op stays
// unresolved and generate() reports it.
func (o *PlusOpVal) operate(args []Val) Val {
	// Keep the operand Vals, not just their native values: the result
	// kind is decided by the operand KINDS (R5 kind contagion), not by
	// the result value. A pref operand contributes its preferred value,
	// and therefore that value's kind too.
	av := unpref(args[0])
	bv := unpref(args[1])
	a := primatize(av)
	b := primatize(bv)
	if a == nil || b == nil {
		return nil
	}

	ab, abool := a.(bool)
	bb, bbool := b.(bool)
	_, astr := a.(string)
	_, bstr := b.(string)

	var peg any
	switch {
	case abool && bbool:
		peg = ab || bb
	case astr || bstr:
		peg = primStr(a) + primStr(b)
	case abool || bbool:
		// boolean mixed with a number does not coerce (no 0/1).
		return nil
	default:
		peg = plusAdd(a, b)
	}

	switch p := peg.(type) {
	case string:
		return newString(p)
	case bool:
		return newBoolean(p)
	case int64:
		return newInteger(p)
	case float64:
		// Kind contagion: `+` must not introduce a kind narrower than
		// its operands. The result is integer kind only when BOTH
		// operands are integer kind AND the sum is itself of integer
		// kind (the sum of two integers can leave the int64 range).
		// Deriving the kind from the result value alone would make
		// 1.5+1.5 an integer. Otherwise the result is the binary64
		// FLOAT leaf — never the `number` supertype, which no concrete
		// value carries.
		if isIntegerScalar(av) && isIntegerScalar(bv) && isIntegerKind(p, "") {
			return newInteger(int64(p))
		}
		return newFloat(p)
	}
	return nil
}

// unpref unwraps pref() layers: a pref operand contributes its preferred
// value (`pref(1)+2`).
func unpref(v Val) Val {
	for {
		pv, ok := v.(*PrefVal)
		if !ok {
			return v
		}
		v = pv.peg
	}
}

// isIntegerScalar reports whether an (already unpref'd) operand is a
// concrete scalar of integer kind.
func isIntegerScalar(v Val) bool {
	sv, ok := v.(*ScalarVal)
	return ok && sv.kind == KindInteger
}

// primatize extracts the native value of a scalar operand.
//
// The tower's exact leaves are deliberately EXCLUDED: `+` over them (the
// exact ladder, the float-plus-big refusal, and string concatenation of
// exact digits) is D6, which Phase 4 owns. Until then an exact operand
// makes operate() decline, so the op stays unresolved and generate()
// reports it — rather than reaching plusAdd, where primFloat would read
// a *big.Int as 0 and primStr would render it as the empty string. Two
// silent wrong answers is exactly what this gate exists to prevent.
func primatize(v Val) any {
	if sv, ok := unpref(v).(*ScalarVal); ok {
		if sv.kind == KindBigInteger || sv.kind == KindBigDecimal {
			return nil
		}
		return sv.peg
	}
	return nil
}

func plusAdd(a, b any) any {
	if _, ok := a.(string); ok {
		return primStr(a) + primStr(b)
	}
	if _, ok := b.(string); ok {
		return primStr(a) + primStr(b)
	}
	return primFloat(a) + primFloat(b)
}

func primStr(v any) string {
	switch n := v.(type) {
	case string:
		return n
	case int64:
		return strconv.FormatInt(n, 10)
	case float64:
		return formatNumber(n)
	case bool:
		if n {
			return "true"
		}
		return "false"
	}
	return ""
}

func primFloat(v any) float64 {
	switch n := v.(type) {
	case int64:
		return float64(n)
	case float64:
		return n
	}
	return 0
}
