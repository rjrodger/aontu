/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "sort"

// THE MEMBERS OF A BAG, as every fold and every generator over a bag
// sees them (use-cases/BUGS.md §79; G9 phase 0 item 4). A member is a
// child that generation would EMIT: a hide()- or type()-marked child is
// not one, an alias declaration is not one, and an optional key whose
// value generates nothing -- an unfilled `y?: string`, an absent
// optional subtree -- is not one. each, emit, filter, pick, join and
// the aggregates read a bag through this one function, so a value the
// document withholds from its output is withheld from every text and
// every total the document computes from it. Maps list their members
// in code-point key order, lists in index order -- the one order canon,
// generation and the TS port agree on. Twin of ts/src/val/members.ts.
type member struct {
	key string
	val Val
}

func bagMembers(bag Val, ctx *Ctx) []member {
	// A member marked while its bag is not was marked in its own right,
	// and is left out as generation leaves it out. Under a MARKED bag
	// every child carries the mark (hide() and type() mark to the
	// leaves), so there the mark says nothing about the member and
	// every child is one -- the members of a hidden bag are what the
	// bag holds, exactly as a reference to it lifts them.
	lifted := bag.markedHide() || bag.markedType()
	if m, ok := bag.(*MapVal); ok {
		keys := append([]string(nil), m.keys...)
		sort.Strings(keys)
		out := make([]member, 0, len(keys))
		for _, k := range keys {
			v := m.peg[k]
			if (!lifted && (v.markedHide() || v.markedType())) || m.isAliasKey(k) {
				continue
			}
			if m.isOptional(k) && !filledMember(v, ctx) {
				continue
			}
			out = append(out, member{key: k, val: v})
		}
		return out
	}
	// Every caller passes a bag: the verbs test isBag first, and filter
	// and pack switch on the type before asking.
	l := bag.(*ListVal)
	out := make([]member, 0, len(l.peg))
	for i, v := range l.peg {
		if !lifted && (v.markedHide() || v.markedType()) {
			continue
		}
		out = append(out, member{key: itoa(i), val: v})
	}
	return out
}

// filledMember says whether an optional child generates something,
// decided as MapVal.Gen decides it: in an isolated collect context, so
// residue inside an absent optional subtree is dropped rather than
// raised. A JSON null generates nil and is a member like any other
// (the emittedMembers rule).
func filledMember(v Val, ctx *Ctx) bool {
	if !genable(v) {
		return false
	}
	c2 := *ctx
	c2.err = nil
	c2.collect = true
	// Generation in collect mode records its failures on the context
	// and answers nil, so a subtree that cannot generate arrives here
	// as no value (the emittedMembers shape).
	cv, err := v.Gen(&c2)
	if nil != err || nil == cv {
		return nil == err && gensNull(ctx, v)
	}
	return !isEmptyGen(cv)
}

// memberVals is the member values alone, for the verbs that do not
// need the keys.
func memberVals(bag Val, ctx *Ctx) []Val {
	ms := bagMembers(bag, ctx)
	out := make([]Val, 0, len(ms))
	for _, m := range ms {
		out = append(out, m.val)
	}
	return out
}
