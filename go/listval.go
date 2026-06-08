/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// ListVal is an ordered list of element Vals. Unification is
// element-wise by index; a longer peer extends the result.
type ListVal struct {
	base
	peg    []Val
	closed bool
}

func newList(elems []Val) *ListVal {
	return &ListVal{peg: elems}
}

func (l *ListVal) superior() Val { return top() }

func (l *ListVal) Canon() string {
	var b strings.Builder
	b.WriteByte('[')
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
		ev, err := e.Gen(ctx)
		if err != nil {
			return nil, err
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
	done := true

	for _, e := range l.peg {
		ev := unite(ctx, e, top())
		out.peg = append(out.peg, ev)
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
			if i < len(out.peg) {
				uv := unite(ctx, out.peg[i], pe)
				out.peg[i] = uv
				if uv.Dc() != DONE {
					done = false
				}
			} else {
				uv := unite(ctx, pe, top())
				out.peg = append(out.peg, uv)
				if uv.Dc() != DONE {
					done = false
				}
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
	return out
}
