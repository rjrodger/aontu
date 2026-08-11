/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// ListVal is an ordered list of element Vals. Unification is
// element-wise by index; a longer peer extends the result.
type ListVal struct {
	base
	peg    []Val
	closed bool
	spread Val // &: spread applied to every element
}

func newList(elems []Val) *ListVal {
	return &ListVal{peg: elems}
}

func (l *ListVal) superior() Val { return top() }

func (l *ListVal) Canon() string {
	var b strings.Builder
	b.WriteByte('[')
	if l.spread != nil {
		b.WriteString("&:")
		b.WriteString(l.spread.Canon())
		if len(l.peg) > 0 {
			b.WriteByte(',')
		}
	}
	for i, e := range l.peg {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(e.Canon())
	}
	b.WriteByte(']')
	return b.String()
}

func (l *ListVal) Gen(ctx *Ctx) (any, error) {
	if l.mtype || l.mhide {
		return nil, nil
	}
	out := make([]any, 0, len(l.peg))
	for _, e := range l.peg {
		if e.markedType() || e.markedHide() {
			continue
		}
		// Mirrors the MapVal.Gen child handling (which mirrors TS
		// BagVal.gen): non-generable elements error at the bag level
		// (or truncate under collect); a nil that doesn't stand for
		// JSON null contributes nothing.
		if !genable(e) {
			if ctx != nil && ctx.collect {
				break
			}
			return nil, &AontuError{Msg: "Cannot resolve value: " + e.Canon()}
		}
		ev, err := e.Gen(ctx)
		if err != nil {
			if ctx != nil && ctx.collect {
				continue
			}
			return nil, err
		}
		if ev == nil && !gensNull(ctx, e) {
			continue
		}
		out = append(out, ev)
	}
	return out, nil
}

func (l *ListVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	if pl, ok := peer.(*ListVal); ok && !l.closed && pl.closed {
		return pl.Unify(l, ctx)
	}
	// A TOP peer refines the list IN PLACE (mirrors `out = peer.isTop ?
	// this : new ListVal(...)` in TS ListVal.unify) — see the matching
	// comment in MapVal.Unify.
	var out *ListVal
	if isTop(peer) {
		out = l
	} else {
		out = &ListVal{}
		out.closed = l.closed
		out.path = cp(l.path)
		out.spread = l.spread
	}
	done := true

	if pl, ok := peer.(*ListVal); ok {
		if out.spread == nil {
			out.spread = pl.spread
		} else if pl.spread != nil {
			out.spread = unite(ctx, out.spread, pl.spread)
		}
	}
	var spreadCj Val = top()
	if out.spread != nil {
		spreadCj = out.spread
	}

	// Driven base (see the matching comment in MapVal.Unify).
	dbase := ctx.slot
	if dbase == nil {
		dbase = l.path
	}

	inplace := out == l
	for i, e := range l.peg {
		// List marks ratchet onto elements each pass (the
		// propagateMarks(this, child) in TS ListVal.unify).
		if l.mtype && !e.markedType() {
			e.setMarkType(true)
		}
		if l.mhide && !e.markedHide() {
			e.setMarkHide(true)
		}
		islot := append(cp(dbase), itoa(i))
		sc := spreadCloneFor(spreadCj, islot, ctx)
		ctx.slot = islot
		ev := unite(ctx, e, sc)
		if inplace {
			out.peg[i] = ev
		} else {
			out.peg = append(out.peg, ev)
		}
		if ev.Dc() != DONE {
			done = false
		}
	}

	if pl, ok := peer.(*ListVal); ok {
		out.closed = l.closed || pl.closed
		// Self-unify the peer against TOP first (the `upeer` step in TS
		// ListVal.unify) — see the matching comment in MapVal.Unify.
		if pl.Dc() != DONE {
			ctx.slot = dbase
			if upl, uok := unite(ctx, pl, top()).(*ListVal); uok {
				pl = upl
			}
		}
		for i, pe := range pl.peg {
			if l.closed && i >= len(l.peg) {
				return makeNilErr(ctx, "closed", pe, nil)
			}
			islot := append(cp(dbase), itoa(i))
			var uv Val
			if i < len(out.peg) {
				ctx.slot = islot
				uv = unite(ctx, out.peg[i], pe)
				out.peg[i] = uv
			} else {
				ctx.slot = islot
				uv = unite(ctx, pe, top())
				if l.spread != nil {
					sc := spreadCloneFor(spreadCj, islot, ctx)
					ctx.slot = islot
					uv = unite(ctx, uv, sc)
				}
				out.peg = append(out.peg, uv)
			}
			if uv.Dc() != DONE {
				done = false
			}
		}
	} else if !isTop(peer) {
		return makeNilErr(ctx, "list", l, peer)
	}

	if done {
		out.setDc(DONE)
	} else {
		out.setDc(l.dc + 1)
	}
	propagateMarks(l, out)
	if !isTop(peer) {
		propagateMarks(peer, out)
	}
	return out
}
