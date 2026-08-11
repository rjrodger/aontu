/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"strconv"
	"strings"
)

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

	// Scope the caller's slot hint to the single dispatched Unify call:
	// nested unites inside that Unify see only the slots the Unify
	// itself sets, and a hint never leaks across sibling drives.
	slot := ctx.slot
	ctx.slot = nil
	drive := func(v Val, peer Val) Val {
		ctx.slot = slot
		out := v.Unify(peer, ctx)
		ctx.slot = nil
		return out
	}

	if a == nil {
		return b
	}
	if b == nil || isTop(b) {
		if a.Dc() == DONE {
			return a
		}
		return drive(a, top())
	}
	if isTop(a) {
		ctx.slot = slot
		return unite(ctx, b, top())
	}
	if a.Nil() {
		return a
	}
	if b.Nil() {
		return b
	}
	if isConjunct(a) {
		return drive(a, b)
	}
	if isConjunct(b) || isDisjunct(b) || isPref(b) || isRef(b) || isVar(b) || isFunc(b) {
		return drive(b, a)
	}
	return drive(a, b)
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
	const maxcc = 9
	prevCanon := ""
	sawPrev := false
	for cc := 0; cc < maxcc && res.Dc() != DONE; cc++ {
		ctx.root = res
		ctx.depth = 0
		ctx.cc = cc
		res = unite(ctx, res, top())
		if len(ctx.err) > 0 {
			break
		}
		// Snapshot the second-to-last pass's result, so exhaustion can
		// tell "still refining" from "stable residue" below. Only paid
		// by models still unresolved this late.
		if cc == maxcc-2 && res.Dc() != DONE {
			prevCanon = res.Canon()
			sawPrev = true
		}
	}
	// The pass budget is spent AND the final pass still made progress:
	// the model was cut off while converging, and no other error
	// explains why. Silent truncation would surface later as ordinary
	// incompleteness, so exhaustion is a semantic error of its own
	// (class budget, docs/trust.md clause 2). A STABLE residue (the
	// final pass changed nothing -- e.g. a stuck `1+true`) is not a
	// budget failure: it stays silent here and surfaces at generate as
	// before. Mirrors the budget_passes emission at the TS pass-loop
	// exit (ts/src/unify.ts).
	if res.Dc() != DONE && len(ctx.err) == 0 && sawPrev && prevCanon != res.Canon() {
		// The hint names the budget and the still-refining paths
		// ({limit}/{paths}), as the TS residuePaths details do.
		paths := residuePaths(res, 4)
		joined := strings.Join(paths, " ")
		if joined == "" {
			joined = "$"
		}
		makeNilErrFull(ctx, "budget_passes", nil, nil, "resolve",
			map[string]string{"limit": strconv.Itoa(maxcc), "paths": joined})
	}
	ctx.root = res
	return res
}

// residuePaths is the Go twin of the TS residuePaths (ts/src/unify.ts):
// the first max non-done nodes of the residue, as $.dotted.paths,
// depth-first over bag children only.
func residuePaths(v Val, max int) []string {
	var out []string
	var visit func(n Val, isroot bool)
	visit = func(n Val, isroot bool) {
		if n == nil || max <= len(out) {
			return
		}
		if !isroot && n.Dc() != DONE {
			p := "$"
			if vp := n.vpath(); len(vp) > 0 {
				p = "$." + strings.Join(vp, ".")
			}
			out = append(out, p)
		}
		switch t := n.(type) {
		case *MapVal:
			for _, k := range t.keys {
				visit(t.peg[k], false)
			}
		case *ListVal:
			for _, e := range t.peg {
				visit(e, false)
			}
		}
	}
	visit(v, true)
	return out
}
