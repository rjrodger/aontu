/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// DisjunctVal is the choice (|) between its members. Conjunction
// distributes over disjunction: unifying with a peer tries the peer
// against each member, dropping members that fail.
type DisjunctVal struct {
	base
	peg []Val
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

	done := true
	oval := make([]Val, len(d.peg))
	for i, m := range d.peg {
		// Try the member against peer in isolation: a failed trial
		// must not pollute the real error list, so swap in a throwaway
		// error slice for the duration of the trial.
		saved := ctx.err
		trial := []*NilVal{}
		ctx.err = trial
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
	if len(d.peg) == 0 {
		return nil, &AontuError{Msg: "Cannot generate value: empty disjunct"}
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
		val = val.Unify(d.peg[i], ctx)
	}
	return val.Gen(ctx)
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
	if as, ok := a.(*ScalarVal); ok {
		if bs, ok := b.(*ScalarVal); ok {
			return as.kind == bs.kind && as.peg == bs.peg
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
