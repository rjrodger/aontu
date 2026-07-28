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
		if ev == nil && !gensNull(e) {
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
	out := &ListVal{}
	out.closed = l.closed
	out.path = cp(l.path)
	out.spread = l.spread
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

	for i, e := range l.peg {
		ev := unite(ctx, e, spreadCloneFor(spreadCj, append(cp(l.path), itoa(i)), ctx))
		out.peg = append(out.peg, ev)
		// Write the resolved element back into the receiver too: TS
		// bags evolve in place (see the mutation caveat in AGENTS.md),
		// so a list embedded in a stuck op/func shows its children's
		// resolution in canon even though the op discards the unify
		// return value. Vals are single-use, so this is safe — except
		// for path-dependent elements (key(), refs), which must stay
		// pending for per-destination spread re-resolution (see the
		// matching guard in MapVal.Unify).
		if !hasPathFunc(e) {
			l.peg[i] = ev
		}
		if ev.Dc() != DONE {
			done = false
		}
	}

	if pl, ok := peer.(*ListVal); ok {
		out.closed = l.closed || pl.closed
		for i, pe := range pl.peg {
			if l.closed && i >= len(l.peg) {
				return makeNilErr(ctx, "closed", pe, nil)
			}
			var uv Val
			if i < len(out.peg) {
				uv = unite(ctx, out.peg[i], pe)
				out.peg[i] = uv
			} else {
				uv = unite(ctx, pe, top())
				if l.spread != nil {
					uv = unite(ctx, uv, spreadCloneFor(spreadCj, append(cp(l.path), itoa(i)), ctx))
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
