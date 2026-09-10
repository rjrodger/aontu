/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"strconv"
	"strings"
)


func isBag(v Val) bool {
	switch v.(type) {
	case *ListVal, *MapVal:
		return true
	}
	return false
}

// aggregate folds a bag. f is the call the error is located at, and base
// the path the answer is placed at.
func aggregate(ctx *Ctx, op string, f *FuncVal, base []string, data Val) Val {
	if !isBag(data) {
		return makeNilErrFull(ctx, "aggregate_data", f, nil, op, nil)
	}
	children := memberVals(data, ctx)

	if "sum" == op {
		var total Val = newInteger(0)
		for _, child := range children {
			total = arithNamed(ctx, "add", op, f, total, child)
			if total.Nil() {
				return total
			}
		}
		return total
	}

	if 0 == len(children) {
		return makeNilErrFull(ctx, "aggregate_empty", f, nil, op, nil)
	}

	want := 1
	if "least" == op {
		want = -1
	}

	var best *ScalarVal
	for _, child := range children {
		c, cok := unpref(child).(*ScalarVal)
		if !cok || !arithKinds[c.kind] {
			return makeNilErrFull(ctx, "invalid-arg", f, nil, op, nil)
		}
		if nil == best || want == cmpNumeric(c, best) {
			best = c
		}
	}
	// The winner is returned as itself, so it keeps its own kind: the
	// least of a bag of bigdecimals is a bigdecimal.
	return clonePath(best, cp(base))
}


// joinVerdict is what a value can be to join: text it can fold, a
// settled value it never can, or something not settled yet.
type joinVerdict int

const (
	joinText joinVerdict = iota
	// A SETTLED value that will never become text: a map, a list, a
	// null. This is join_member, class conflict.
	joinNever
	// An unresolved kind, a top, a stable residue. NOT a join failure:
	// the call stays residual and generation reports mapval_no_gen,
	// class incomplete, as docs/trust.md requires.
	joinNotYet
)

// joinText renders a value the way `+` would, or reports that `+` would
// not take it at all. A pref member contributes its preferred value, and
// therefore that value's kind too.
func joinTextOf(v Val) (string, bool) {
	sv, ok := unpref(v).(*ScalarVal)
	if !ok {
		return "", false
	}
	switch sv.kind {
	case KindString, KindInteger, KindFloat,
		KindBigInteger, KindBigDecimal, KindBoolean:
		return primStr(sv.peg), true
	}
	return "", false
}

func joinMember(v Val) joinVerdict {
	u := unpref(v)
	if _, ok := joinTextOf(u); ok {
		return joinText
	}
	if isBag(u) {
		return joinNever
	}
	if sv, ok := u.(*ScalarVal); ok && KindNull == sv.kind {
		return joinNever
	}
	return joinNotYet
}

func joinSep(v Val) joinVerdict {
	u := unpref(v)
	if sv, ok := u.(*ScalarVal); ok {
		if KindString == sv.kind {
			return joinText
		}
		return joinNever
	}
	if isBag(u) {
		return joinNever
	}
	return joinNotYet
}

func joinPending(ctx *Ctx, args []Val) bool {
	if 0 == len(args) || !isBag(args[0]) {
		// Not a bag at all: let resolve say so rather than waiting for a
		// settling that has already happened.
		return false
	}
	if 1 < len(args) && joinNotYet == joinSep(args[1]) {
		return true
	}
	for _, child := range memberVals(args[0], ctx) {
		if joinNotYet == joinMember(child) {
			return true
		}
	}
	return false
}

// joinBag is join(d, sep?). f is the call the error is located at, base
// the path the answer is placed at. sep is nil when the call wrote only
// the bag, which makes the separator "" and join(coll) concatenation.
func joinBag(ctx *Ctx, f *FuncVal, base []string, data, sep Val) Val {
	if !isBag(data) {
		return makeNilErrFull(ctx, "aggregate_data", f, nil, "join", nil)
	}

	sepText := ""
	if nil != sep {
		sepText, _ = joinTextOf(sep)
	}

	parts := []string{}
	for _, child := range memberVals(data, ctx) {
		u := unpref(child)
		text, ok := joinTextOf(u)
		if !ok {
			return makeNilErrFull(ctx, "join_member", f, nil, "join",
				map[string]string{"member": u.Canon()})
		}
		parts = append(parts, text)
	}

	out := newString(strings.Join(parts, sepText))
	out.path = cp(base)
	return out
}

func project(ctx *Ctx, f *FuncVal, base []string, data, key Val) Val {
	if !isBag(data) {
		return makeNilErrFull(ctx, "aggregate_data", f, nil, "pick", nil)
	}

	name := ""
	if sv, ok := key.(*ScalarVal); ok {
		switch sv.kind {
		case KindString:
			name = sv.peg.(string)
		case KindInteger:
			name = strconv.FormatInt(sv.peg.(int64), 10)
		}
	}
	if "" == name {
		return makeNilErrFull(ctx, "invalid-arg", f, nil, "pick", nil)
	}

	peg := []Val{}
	for _, child := range memberVals(data, ctx) {
		var got Val
		switch c := child.(type) {
		case *MapVal:
			got = c.peg[name]
		case *ListVal:
			if i, err := strconv.Atoi(name); nil == err &&
				0 <= i && i < len(c.peg) {
				got = c.peg[i]
			}
		}
		if nil == got {
			return makeNilErrFull(ctx, "pick_key", f, nil, "pick",
				map[string]string{"key": name})
		}
		peg = append(peg,
			clonePath(got, cp(append(base, strconv.Itoa(len(peg))))))
	}

	out := newList(peg)
	out.path = cp(base)
	return out
}
