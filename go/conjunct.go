/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strings"
)

// ConjunctVal is the unification (&) of its terms.
type ConjunctVal struct {
	base
	peg []Val
}

func newConjunct(terms []Val) *ConjunctVal {
	return &ConjunctVal{peg: terms}
}

func (c *ConjunctVal) cjo() int      { return 40000 }
func (c *ConjunctVal) superior() Val { return top() }

func (c *ConjunctVal) Canon() string {
	parts := make([]string, len(c.peg))
	for i, t := range c.peg {
		parts[i] = t.Canon()
	}
	return strings.Join(parts, "&")
}

func (c *ConjunctVal) Gen(ctx *Ctx) (any, error) {
	// An unresolved conjunct is not a concrete value.
	return nil, &AontuError{Msg: "Cannot generate value: " + c.Canon()}
}

func (c *ConjunctVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	terms := norm(c.peg)
	done := true

	// Unify each term against the peer.
	upeer := make([]Val, len(terms))
	for i, t := range terms {
		if t.Dc() == DONE && isTop(peer) {
			upeer[i] = t
		} else {
			upeer[i] = unite(ctx, t, peer)
		}
		if upeer[i].Dc() != DONE {
			done = false
		}
		if upeer[i].Nil() {
			return upeer[i]
		}
	}

	upeer = norm(upeer)

	// Fold the terms together left to right.
	var outvals []Val
	if len(upeer) == 0 {
		return top()
	}
	t0 := upeer[0]
	for pI := 0; pI < len(upeer); pI++ {
		var t1 Val
		if pI+1 < len(upeer) {
			t1 = upeer[pI+1]
		}
		if t1 == nil {
			outvals = append(outvals, t0)
			continue
		}
		val := unite(ctx, t0, t1)
		if val.Dc() != DONE {
			done = false
		}
		if _, ok := val.(*ConjunctVal); ok {
			// Could not merge t0 and t1; keep t0, advance.
			outvals = append(outvals, t0)
			t0 = t1
		} else if val.Nil() {
			return val
		} else {
			t0 = val
		}
	}

	var out Val
	switch len(outvals) {
	case 0:
		out = top()
	case 1:
		out = outvals[0]
	default:
		out = newConjunct(outvals)
	}
	if done {
		out.setDc(DONE)
	} else {
		out.setDc(c.dc + 1)
	}

	// Marks propagate from the conjunct and its terms to the result, so
	// e.g. type({}) & {y:1} stays a type value (excluded from gen).
	mt := c.mtype || peer.markedType()
	mh := c.mhide || peer.markedHide()
	for _, t := range upeer {
		mt = mt || t.markedType()
		mh = mh || t.markedHide()
	}
	if mt {
		out.setMarkType(true)
	}
	if mh {
		out.setMarkHide(true)
	}
	return out
}

// norm flattens nested conjuncts and orders terms by cjo so that
// unification is order-independent (lower cjo sorts first).
func norm(terms []Val) []Val {
	var expand []Val
	for _, t := range terms {
		if cj, ok := t.(*ConjunctVal); ok {
			expand = append(expand, cj.peg...)
		} else {
			expand = append(expand, t)
		}
	}
	sort.SliceStable(expand, func(i, j int) bool {
		return expand[i].cjo() < expand[j].cjo()
	})
	return expand
}
