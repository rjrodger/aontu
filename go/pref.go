/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// PrefVal marks a preferred (default) value, written `*x`. Within a
// disjunct it is selected over non-preferred members during
// generation; unified against a concrete peer it yields the peer when
// the peer narrows it, otherwise the preferred value wins.
type PrefVal struct {
	base
	peg      Val
	superpeg Val
	rank     int
}

func newPref(v Val) *PrefVal {
	p := &PrefVal{peg: v}
	p.superpeg = v.superior()
	if inner, ok := v.(*PrefVal); ok {
		p.rank = 1 + inner.rank
	}
	return p
}

func (p *PrefVal) cjo() int      { return 30000 }
func (p *PrefVal) superior() Val { return p.peg.superior() }
func (p *PrefVal) Canon() string { return "*" + p.peg.Canon() }

func (p *PrefVal) Gen(ctx *Ctx) (any, error) {
	return p.peg.Gen(ctx)
}

func (p *PrefVal) Unify(peer Val, ctx *Ctx) Val {
	// Resolve the preferred value (e.g. a function) before comparing.
	if p.peg.Dc() != DONE {
		p.peg = unite(ctx, p.peg, top())
		p.superpeg = p.peg.superior()
	}

	if peer == nil || isTop(peer) {
		p.setDc(DONE)
		return p
	}

	if pp, ok := peer.(*PrefVal); ok {
		if p.rank < pp.rank {
			return p
		}
		if pp.rank < p.rank {
			return pp
		}
		merged := unite(ctx, p.peg, pp.peg)
		return newPref(merged)
	}

	// Peer is a concrete or kind value. Unify the preferred value's
	// type with peer: if peer is type-compatible (result is still the
	// type), the preference value wins; otherwise peer narrows it.
	out := unite(ctx, p.superpeg, peer)
	if valSame(out, p.superpeg) {
		return p.peg
	}
	return out
}
