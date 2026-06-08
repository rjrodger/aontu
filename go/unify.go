/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// unite is the binary unification dispatcher, mirroring the TS
// `unite` in ts/src/unify.ts (minus cycle-detection, which the core
// subset does not need without references). TOP is the unit element;
// complex Vals (conjunct/disjunct/pref) drive their own unify.
func unite(ctx *Ctx, a, b Val) Val {
	// Bound recursion to break reference cycles (the TS unite uses a
	// per-path seen-map with MAXCYCLE; a depth guard is sufficient here).
	ctx.depth++
	defer func() { ctx.depth-- }()
	if ctx.depth > maxUniteDepth {
		return makeNilErr(ctx, "unify_cycle", a, b)
	}

	if a == nil {
		return b
	}
	if b == nil || isTop(b) {
		if a.Dc() == DONE {
			return a
		}
		return a.Unify(top(), ctx)
	}
	if isTop(a) {
		return unite(ctx, b, top())
	}
	if a.Nil() {
		return a
	}
	if b.Nil() {
		return b
	}
	if isConjunct(a) {
		return a.Unify(b, ctx)
	}
	if isConjunct(b) || isDisjunct(b) || isPref(b) || isRef(b) || isVar(b) {
		return b.Unify(a, ctx)
	}
	return a.Unify(b, ctx)
}

const maxUniteDepth = 2000

// unifyRoot runs the fixpoint loop: repeatedly unify the result with
// TOP until it converges (Dc == DONE) or an error is collected. ctx.root
// is refreshed each pass so references resolve against the latest tree.
func unifyRoot(root Val, ctx *Ctx) Val {
	if root.Nil() {
		return root
	}
	res := root
	for cc := 0; cc < 9 && res.Dc() != DONE; cc++ {
		ctx.root = res
		ctx.depth = 0
		res = unite(ctx, res, top())
		if len(ctx.err) > 0 {
			break
		}
	}
	ctx.root = res
	return res
}
