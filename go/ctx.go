/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// hide marking is mark-based (see RefVal.find and FuncVal.Unify): the
// move() machinery sets the hide mark on the found source node and the
// bag unify loops ratchet marks down one level per pass, mirroring the
// TS _hide_found + propagateMarks flow.

// Ctx carries unification state: the root Val (for path resolution,
// once references are ported) and the collected error list.
type Ctx struct {
	root  Val
	err   []*NilVal
	depth int            // unite recursion depth (cycle guard)
	cc    int            // current fixpoint pass (for late-resolving funcs)
	vars  map[string]Val // user-provided variables, resolved by $name
	// collect: generation inside an optional subtree — failures are
	// isolated (skipped/partial output) instead of raised, mirroring
	// the cctx clone({err: [], collect: true}) in TS BagVal.gen.
	collect bool
	// snapmap caches structural snapshots of ref spreads (see
	// snapshotRefSpread in mapval.go), keyed by the ref's canon + source
	// position — mirroring the snapmap on the TS unify root ctx.
	snapmap map[string]Val
	// slot is the location the next Unify target is being driven at —
	// the TS ctx.path equivalent. Producers (bag child loops, func arg
	// loops, junction folds) set it right before a unite call; unite
	// scopes it to the single dispatched Unify; consumers (FuncVal,
	// MapVal, ListVal) read it at entry. nil means "unknown — fall back
	// to the Val's own stored path", which is correct whenever the Val
	// actually sits at its slot (everything except shared/transplanted
	// clones, whose stored paths carry overlay tails).
	slot []string
}

func (c *Ctx) adderr(n *NilVal) {
	for _, e := range c.err {
		if e == n {
			return
		}
	}
	c.err = append(c.err, n)
}

func (c *Ctx) errmsg() string {
	parts := make([]string, 0, len(c.err))
	for _, e := range c.err {
		parts = append(parts, e.Message())
	}
	return strings.Join(parts, "\n------\n")
}
