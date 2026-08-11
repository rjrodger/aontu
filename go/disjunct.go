/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// DisjunctVal is the choice (|) between its members. Conjunction
// distributes over disjunction: unifying with a peer tries the peer
// against each member, dropping members that fail.
type DisjunctVal struct {
	base
	peg         []Val
	prefsRanked bool
}

func newDisjunct(members []Val) *DisjunctVal {
	return &DisjunctVal{peg: members}
}

func (d *DisjunctVal) cjo() int      { return 35000 }
func (d *DisjunctVal) superior() Val { return top() }

func (d *DisjunctVal) Canon() string {
	parts := make([]string, len(d.peg))
	for i, m := range d.peg {
		parts[i] = m.Canon()
	}
	return strings.Join(parts, "|")
}

func (d *DisjunctVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}

	// Members are driven at the disjunct's own location (TS trials each
	// branch with the same undescended ctx; the slot hint is single-use
	// per unite).
	slot := ctx.slot

	if !d.prefsRanked {
		d.rankPrefs(ctx)
	}

	done := true
	oval := make([]Val, len(d.peg))
	for i, m := range d.peg {
		// Try the member against peer in isolation: a failed trial
		// must not pollute the real error list, so swap in a throwaway
		// error slice for the duration of the trial.
		saved := ctx.err
		trial := []*NilVal{}
		ctx.err = trial
		ctx.slot = slot
		r := unite(ctx, m, peer)
		failed := len(ctx.err) > 0 || r.Nil()
		ctx.err = saved
		if failed {
			oval[i] = nil
		} else {
			oval[i] = r
			if r.Dc() != DONE {
				done = false
			}
		}
	}

	// Flatten nested disjuncts, drop failed members, dedup.
	var res []Val
	for _, v := range oval {
		if v == nil {
			continue
		}
		if dj, ok := v.(*DisjunctVal); ok {
			res = append(res, dj.peg...)
		} else {
			res = append(res, v)
		}
	}
	res = dedup(res)

	switch len(res) {
	case 1:
		return res[0]
	case 0:
		return makeNilErr(ctx, "|:empty", d, peer)
	}
	out := newDisjunct(res)
	if done {
		out.setDc(DONE)
	} else {
		out.setDc(d.dc + 1)
	}
	return out
}

func (d *DisjunctVal) Gen(ctx *Ctx) (any, error) {
	val := d.foldForGen(ctx)
	if val == nil {
		return nil, &AontuError{Msg: "Cannot generate value: empty disjunct"}
	}
	return val.Gen(ctx)
}

// foldForGen reduces the members to the single Val that Gen will emit,
// returning nil for an empty disjunct.
//
// Split out of Gen so that gensNull can ask what a disjunct WOULD generate
// without generating it. Go's Gen returns (any, error) and so collapses
// TypeScript's two distinct empty results -- `undefined` (nothing) and
// `null` (JSON null) -- into one `nil`; gensNull reconstructs the
// difference from the child Val, and had no case for a disjunct. So a key
// whose value was a disjunction resolving to null was read as "nothing"
// and silently DROPPED, taking list elements with it.
func (d *DisjunctVal) foldForGen(ctx *Ctx) Val {
	if len(d.peg) == 0 {
		return nil
	}
	// Prefer PrefVal members (defaults); otherwise use all members.
	var vals []Val
	for _, m := range d.peg {
		if isPref(m) {
			vals = append(vals, m)
		}
	}
	if len(vals) == 0 {
		vals = d.peg
	}
	val := vals[0]
	for i := 1; i < len(vals); i++ {
		// Index `vals`, not `d.peg`: when the pref members are not the
		// leading entries the two slices differ, and folding against
		// d.peg[i] would unify the wrong (or a repeated) member.
		val = val.Unify(vals[i], ctx)
	}
	return val
}

// rankPrefs merges and filters PrefVal members before member trials
// (DisjunctVal.rankPrefs in TS): equal-rank prefs unify into one
// (`*{x:1} | *{y:2}` -> `*{x:1,y:2}`), a lower-rank pref supersedes a
// higher-rank one, and a nested disjunct that collapses to a single
// pref replaces itself in place. Returns the single remaining PrefVal
// (or the nil from a failed pref merge) for nested-collapse callers;
// nil otherwise.
func (d *DisjunctVal) rankPrefs(ctx *Ctx) Val {
	var lastpref *PrefVal
	lastprefI := -1

	for vI := 0; vI < len(d.peg); vI++ {
		switch v := d.peg[vI].(type) {
		case *PrefVal:
			if lastpref != nil {
				if v.rank == lastpref.rank {
					u := v.Unify(lastpref, ctx)
					if u.Nil() {
						return u
					}
					d.peg[lastprefI] = u
					if up, ok := u.(*PrefVal); ok {
						lastpref = up
					}
					d.peg[vI] = nil
				} else if v.rank < lastpref.rank {
					d.peg[lastprefI] = nil
					lastpref = v
					lastprefI = vI
				} else {
					d.peg[vI] = nil
				}
			} else {
				lastpref = v
				lastprefI = vI
			}
		case *DisjunctVal:
			if sub := v.rankPrefs(ctx); sub != nil {
				if sp, ok := sub.(*PrefVal); ok {
					d.peg[vI] = sp
					lastpref = sp
					lastprefI = vI
				}
			}
		}
	}

	kept := d.peg[:0]
	for _, p := range d.peg {
		if p != nil {
			kept = append(kept, p)
		}
	}
	d.peg = kept
	d.prefsRanked = true

	if len(d.peg) == 1 {
		if p, ok := d.peg[0].(*PrefVal); ok {
			return p
		}
	}
	return nil
}

// dedup removes structurally-equal Vals, keeping first occurrence.
func dedup(vals []Val) []Val {
	var out []Val
	for _, v := range vals {
		dup := false
		for _, e := range out {
			if valSame(e, v) {
				dup = true
				break
			}
		}
		if !dup {
			out = append(out, v)
		}
	}
	return out
}

// valSame reports structural equality used for disjunct dedup.
func valSame(a, b Val) bool {
	if a == b {
		return true
	}
	// TOP is a single value however many times it is spelled, so `top|top`
	// must collapse (idempotence). Go's top is not a pointer singleton, so
	// the identity test above misses it and the pair survived dedup --
	// which then also hid the fact that a bare unresolved top is not
	// generable, a rule both ports already applied to a plain `x:top`.
	// The analogue of TS's TopVal.same override.
	if isTop(a) || isTop(b) {
		return isTop(a) && isTop(b)
	}
	if as, ok := a.(*ScalarVal); ok {
		if bs, ok := b.(*ScalarVal); ok {
			// Per-kind VALUE comparison (D2). A bare `as.peg == bs.peg`
			// compares *big.Int / *Decimal addresses, so `0d1|0d1` would
			// keep both members instead of deduping to one.
			return as.kind == bs.kind && scalarPegSame(as.kind, as.peg, bs.peg)
		}
		return false
	}
	if ak, ok := a.(*ScalarKindVal); ok {
		if bk, ok := b.(*ScalarKindVal); ok {
			return ak.kind == bk.kind
		}
		return false
	}
	if ap, ok := a.(*PrefVal); ok {
		if bp, ok := b.(*PrefVal); ok {
			return valSame(ap.peg, bp.peg)
		}
	}
	return false
}
