/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

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
	}
}

func copyMarks(to, from Val) {
	to.setMarkType(from.markedType())
	to.setMarkHide(from.markedHide())
}
