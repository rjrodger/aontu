/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// ExpectVal is the exact port of ts/src/val/ExpectVal.ts (issue #27):
// the marker a map creates when a PEER key arrives whose value is not
// generable on its own — a kind, top, a var, a constraint residual —
// most commonly a spread template field applied to a child that never
// receives a concrete value (`m:{&:{r:string} a:{}}`). The bag's Gen
// distinguishes this residue as mapval_spread_required /
// listval_spread_required (versus the generic *_no_gen), and the
// expectation escapes to a real value the moment a concrete peer
// arrives (see Unify).
//
// Created ONLY by the MapVal peer-key loop (TS handleExpectedVal is
// called from MapVal.unify alone), so a list child is never an
// ExpectVal and listval_spread_required stays exactly as reachable as
// it is in TypeScript: registered vocabulary, no raise site today.
type ExpectVal struct {
	base
	peg    Val    // the expectation (the non-generable value)
	peer   Val    // accumulated concrete peer values
	parent Val    // the bag that created it; its site locates the error
	key    string // the peer key the expectation arrived under
}

func (e *ExpectVal) superior() Val { return top() }

// Canon is EMPTY, exactly as in TS (FeatureVal's default over an
// unrendered peg): a map holding an expect for key r canons as
// `{"r":}` — the key present, the value pending.
func (e *ExpectVal) Canon() string { return "" }

// Gen is unreachable: BagVal-level Gen intercepts an expect child (the
// *_spread_required branch) before ever calling child.Gen, for
// optional and required keys alike — the same interception order as TS
// BagVal.gen, whose ExpectVal.gen is likewise dead code. Silent,
// mirroring the FuncVal.Gen pattern for never-generated residue.
func (e *ExpectVal) Gen(ctx *Ctx) (any, error) {
	return nil, nil
}

// Unify mirrors TS ExpectVal.unify: accumulate concrete peers, meet
// them with the expectation, and ESCAPE to the united value as soon as
// it is generable (`m:{&:{r:string} a:{r:x}}` resolves a.r to "x").
// Until then the expect itself stays, done.
func (e *ExpectVal) Unify(peer Val, ctx *Ctx) Val {
	if peer != nil && !isTop(peer) {
		if e.peer == nil {
			e.peer = peer
		} else {
			e.peer = unite(ctx, e.peer, peer)
		}
		peeru := unite(ctx, e.peer, e.peg)
		if expectGenable(peeru) {
			peeru.setDc(DONE)
			return peeru
		}
	}
	e.dc = DONE
	return e
}

func isExpect(v Val) bool {
	_, ok := v.(*ExpectVal)
	return ok
}

// expectGenable is the TS `isGenable` flag set, verbatim: the classes
// carrying `isGenable = true` in ts/src/val (ScalarVal, BagVal,
// ConjunctVal, DisjunctVal, FuncBaseVal, NilVal, PrefVal, RefVal).
// Ops (OpBaseVal), vars, kinds, constraints, top and expects are not.
// This is DELIBERATELY a different set from the bag-Gen `genable`
// (which classifies what a bag can EMIT — conjuncts and funcs fail
// there); this one classifies what escapes an expectation.
func expectGenable(v Val) bool {
	switch v.(type) {
	case *ScalarVal, *MapVal, *ListVal, *ConjunctVal, *DisjunctVal,
		*FuncVal, *NilVal, *PrefVal, *RefVal:
		return true
	}
	return false
}
