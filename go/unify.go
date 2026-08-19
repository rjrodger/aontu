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
	// The path this meet happens at, read BEFORE uniteRaw scopes the
	// slot hint away. The slot is the TS ctx.path equivalent; with no
	// hint, a value sits at its own stored path (the same fallback
	// MapVal.Unify makes).
	var provPath []string
	if nil != ctx.prov {
		provPath = ctx.slot
		if nil == provPath && nil != a {
			provPath = a.vpath()
		}
	}

	out := uniteRaw(ctx, a, b)

	// The provenance record (G7 phase 4), at the one place every meet
	// passes through — the same reason the deprecation rider below
	// lives here. Off by default: an uninstrumented run pays one nil
	// check, and an instrumented one pays site materialisation
	// knowingly.
	if nil != ctx.prov {
		ctx.prov.record(provPath, a, b, out)
	}
	// The deprecation record survives EVERY meet (G3 phase 4): the
	// boolean marks have their own sweeps (conjunct, the bag walks),
	// but a record lost in one meet shape is a use the tooling never
	// warns about, so it rides here, at the one place all meets pass
	// through. First record wins; TOP and nil stay clean (TOP is the
	// unit, and an error needs no deprecation). Mirrors the rider at
	// the tail of unite in ts/src/unify.ts.
	if nil != out && !isTop(out) && !out.Nil() && nil == out.deprecRec() {
		var dep map[string]string
		if nil != a {
			dep = a.deprecRec()
		}
		if nil == dep && nil != b {
			dep = b.deprecRec()
		}
		if nil != dep {
			out.setDeprecRec(dep)
		}
	}
	return out
}

func uniteRaw(ctx *Ctx, a, b Val) Val {
	// Fast path, ABOVE the depth counter: a value that is already done,
	// unified with TOP, is itself. The TS unite has the same shape --
	// its fast paths return before its counter increments -- and the
	// counters have to charge the same entries or the shared depth
	// budget bites at different documents in the two ports. Counting it
	// here cost one frame per document (the scalar leaf of a nested
	// bag), which is exactly the constant-1 offset issue #46 recorded.
	if a != nil && (b == nil || isTop(b)) && a.Dc() == DONE {
		return a
	}

	// Bound recursion to break reference cycles (the TS unite uses a
	// per-path seen-map with its revisit constant; a depth guard is
	// sufficient here). The bound is the depth budget: the spec constant
	// unless the trust profile set one (ctx.budgetDepth, zero = default).
	maxDepth := ctx.budgetDepth
	if 0 == maxDepth {
		maxDepth = maxUniteDepth
	}
	ctx.depth++
	defer func() { ctx.depth-- }()
	if ctx.depth > maxDepth {
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
		// No `a.Dc() == DONE` check here: the fast path at the top of the
		// function already returned for that case, so anything reaching
		// this line is not done.
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
	if isConjunct(a) || isExpect(a) {
		return drive(a, b)
	}
	if isConjunct(b) || isDisjunct(b) || isPref(b) || isRef(b) || isVar(b) || isFunc(b) || isExpect(b) {
		return drive(b, a)
	}
	return drive(a, b)
}

// Structural recursion budget: how deep unite may nest before the
// evaluator reports `unify_cycle`. SHARED LANGUAGE SURFACE -- the TS
// MAXDEPTH (ts/src/unify.ts) carries the same number, and
// test/spec/budget.tsv pins the boundary in both, so changing it is a
// spec-visible change in both ports at once.
//
// Lowered from 2000 when TypeScript gained its own explicit budget:
// V8 exhausts its call stack past depth ~1500 in that evaluator, so
// 2000 was unreachable there and the two ports would have disagreed on
// every document between the limits. 1000 sits above every real
// document (the whole shared suite peaks at 603) and below both hosts'
// limits, so the budget decides the verdict rather than the runtime.
const maxUniteDepth = 1000

// unifyRoot runs the fixpoint loop: repeatedly unify the result with
// TOP until it converges (Dc == DONE) or an error is collected. ctx.root
// is refreshed each pass so references resolve against the latest tree.
func unifyRoot(root Val, ctx *Ctx) Val {
	if root.Nil() {
		return root
	}
	res := root
	// The pass budget: the spec constant unless the trust profile set
	// one (ctx.budgetPasses, zero = default).
	maxcc := ctx.budgetPasses
	if 0 == maxcc {
		maxcc = 9
	}
	prevCanon := ""
	sawPrev := false
	for cc := 0; cc < maxcc && res.Dc() != DONE; cc++ {
		ctx.root = res
		ctx.depth = 0
		ctx.cc = cc

		// Snapshot BEFORE the final pass (the loop condition has already
		// established the tree is not done), so exhaustion can tell
		// "still refining" from "stable residue" below. Taken at the
		// final pass's ENTRY rather than the previous pass's exit — the
		// same value when the budget allows two passes, and the only
		// possible value when the trust profile sets passes to 1, where
		// the old placement (cc == maxcc-2, never true) made exhaustion
		// silent, exactly the truncation docs/trust.md forbids. Mirrors
		// ts/src/unify.ts.
		if cc == maxcc-1 {
			prevCanon = res.Canon()
			sawPrev = true
		}

		res = unite(ctx, res, top())
		// MULTI-ERROR COLLECTION (G2 phase 6): the pass loop CONTINUES
		// past an erroring pass, so independent failures a later pass
		// would reach are collected in the same run — the break that
		// stood here made every multi-error report truncated at the
		// first erroring pass. What controls the cascade: a nil is
		// ABSORBING (unite's Nil arms return the existing nil, no new
		// error), so one failure stays ONE nil however many later meets
		// touch it. Mirrors ts/src/unify.ts; pinned by vet.tsv's
		// multi-* rows.
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
