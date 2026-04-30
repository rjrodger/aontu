/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"reflect"
)

const MAXCYCLE = 9999

// pegEqual compares two peg values for equality.
// Maps and slices are not comparable with ==, so we handle them specially.
func pegEqual(a, b interface{}) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	// Avoid panic on uncomparable types
	defer func() { recover() }()
	return a == b
}

// unite is the core unification dispatch function.
func unite(ctx *AontuContext, a, b Val, whence string) Val {
	if a == nil && b == nil {
		return top()
	}

	// Fast path: same reference and done
	if a != nil && b != nil && a == b && a.Done() {
		return a
	}

	// Fast path: same ID both done
	if a != nil && b != nil && a.Done() && b.Done() {
		if a.GetID() == b.GetID() {
			return a
		}
		// Same concrete type and same peg, both not special
		if reflect.TypeOf(a) == reflect.TypeOf(b) &&
			!a.IsNil() && !a.IsConjunct() && !a.IsDisjunct() &&
			!a.IsPath() && !a.IsPref() && !a.IsFunc() && !a.IsExpect() &&
			!a.IsMap() && !a.IsList() {
			if pegEqual(a.GetPeg(), b.GetPeg()) {
				return a
			}
		}
	}

	// Cycle detection
	var sawKey string
	if a != nil && b != nil {
		ad, bd := "", ""
		if a.Done() {
			ad = "d"
		}
		if b.Done() {
			bd = "d"
		}
		sawKey = fmt.Sprintf("%d%s~%d%s~%d", a.GetID(), ad, b.GetID(), bd, ctx.pathidx)
		count, _ := ctx.seen[sawKey]
		count++
		ctx.seen[sawKey] = count
		if count > MAXCYCLE {
			return makeNilErr(ctx, "unify_cycle", a, b)
		}
	}

	var out Val
	unified := false

	switch {
	case a == nil:
		out = b

	case b == nil || b.IsTop():
		out = a

	case a.IsTop():
		out = b

	case a.IsNil():
		out = a

	case b.IsNil():
		out = b

	case a.IsConjunct() || a.IsExpect() || a.IsSpread():
		out = a.Unify(b, ctx)
		unified = true

	case b.IsConjunct() || b.IsDisjunct() || b.IsPath() || b.IsPref() ||
		b.IsFunc() || b.IsExpect() || b.IsSpread():
		out = b.Unify(a, ctx)
		unified = true

	default:
		// Same type and same peg value
		if reflect.TypeOf(a) == reflect.TypeOf(b) && pegEqual(a.GetPeg(), b.GetPeg()) {
			out = a
		} else {
			out = a.Unify(b, ctx)
			unified = true
		}
	}

	// Error check
	if out == nil {
		out = makeNilErr(ctx, "unite", a, b)
	}

	// Self-unify with TOP if not done and didn't call Unify
	if !unified && out != nil && !out.Done() && !out.IsNil() {
		out = out.Unify(top(), ctx)
	}

	return out
}
