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
	root Val
	// src is the entry source text, used by error rendering to compute
	// row/col from a value's byte offset and to excerpt source lines
	// (NilVal.FullMessage frames). Values loaded from @"file" includes
	// carry offsets into their own file; with no per-value url tracking
	// their frames fall back to this text — the same fallback TS's
	// resolveSrc makes when a site's file cannot be read.
	src string
	// file is the display name of the entry source for error frames
	// (Aontu.File); empty renders <no-file>.
	file  string
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

	// The evaluation budgets (G5 trust profile, docs/trust.md): integer
	// counts of engine events, never wall-clock. ZERO MEANS THE DEFAULT
	// — the shared spec-visible constants test/spec/budget.tsv pins (9
	// passes, depth 1000) — so a bare &Ctx{} behaves exactly as before;
	// only aontu.go sets them, from the trust profile.
	budgetPasses int
	budgetDepth  int

	// prov is the provenance recorder (G7 phase 4), or nil for an
	// uninstrumented run. One run has one recorder: the Ctx is shared
	// by reference all the way down, as the error list is.
	prov *Provenance
}

func (c *Ctx) adderr(n *NilVal) {
	// An operand-less nil becomes its own primary (the TS ctx.adderr
	// rule), so it still renders a located section — e.g. the
	// budget_passes frame, whose siteless `-1:-1` arrow the shared
	// budget rows pin.
	if n.primary == nil {
		n.primary = n
	}
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
		// The thrown-error surface renders the full TS-style message
		// (marker, headline, hint, value line, frames); the LSP/Problem
		// surface keeps the short Message. See NilVal.FullMessage.
		parts = append(parts, e.FullMessage(c.src, c.file))
	}
	return strings.Join(parts, "\n------\n")
}
