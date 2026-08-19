/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "sort"

// propagateMarks copies type/hide marks from one Val to another (mirrors
// propagateMarks in ts/src/utility.ts).
func propagateMarks(from, to Val) {
	if from.markedType() {
		to.setMarkType(true)
	}
	if from.markedHide() {
		to.setMarkHide(true)
	}
}

// canonDeprecation renders a value's canonical form wrapped in its
// deprecation call when it carries one — reparseably, so
// `deprecate(x, m)` round-trips through canon (G3 phase 4). Bags render
// their children through this (MapVal/ListVal Canon), which is where a
// deprecated FIELD — the realistic case — lives. Mirrors
// canonDeprecation in ts/src/utility.ts.
func canonDeprecation(v Val) string {
	c := v.Canon()
	d := v.deprecRec()
	if nil == d {
		return c
	}
	keys := make([]string, 0, len(d))
	for k := range d {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	rec := ""
	for i, k := range keys {
		if 0 < i {
			rec += ","
		}
		rec += jsonString(k) + ":" + jsonString(d[k])
	}
	if "" == rec {
		return "deprecate(" + c + ")"
	}
	return "deprecate(" + c + ",{" + rec + "})"
}

// walkMark sets or clears the type/hide marks on a Val and all of its
// descendants (the walk used by type(), hide() and copy()).
func walkMark(v Val, setType, typeVal, setHide, hideVal bool) {
	if setType {
		v.setMarkType(typeVal)
	}
	if setHide {
		v.setMarkHide(hideVal)
	}
	switch n := v.(type) {
	case *MapVal:
		for _, k := range n.keys {
			walkMark(n.peg[k], setType, typeVal, setHide, hideVal)
		}
	case *ListVal:
		for _, e := range n.peg {
			walkMark(e, setType, typeVal, setHide, hideVal)
		}
	case *ConjunctVal:
		for _, t := range n.peg {
			walkMark(t, setType, typeVal, setHide, hideVal)
		}
	case *DisjunctVal:
		for _, t := range n.peg {
			walkMark(t, setType, typeVal, setHide, hideVal)
		}
	case *PrefVal:
		walkMark(n.peg, setType, typeVal, setHide, hideVal)
	case *FuncVal:
		// TS walk recurses into a func's peg array, so mark walks reach
		// (possibly shared) arg trees too.
		for _, a := range n.peg {
			walkMark(a, setType, typeVal, setHide, hideVal)
		}
	}
}

func copyMarks(to, from Val) {
	to.setMarkType(from.markedType())
	to.setMarkHide(from.markedHide())
	to.setDeprecRec(from.deprecRec())
}
