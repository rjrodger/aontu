/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "sort"

// THE GENERATION COMBINATORS (G8 phase 1, the Go side of
// ts/src/val/PackFuncVal.ts and ts/src/val/EachFuncVal.ts,
// docs/capability-review/g8-generation.md).
//
//	pack(data, tmpl)  one KEYED child per child of data
//	each(data, tmpl?) one LIST ELEMENT per child of data
//
// Both clone their template per destination -- an independent copy for
// each generated child, because a generator's template IS the child and
// a child is a position -- and both wait for the model to settle before
// they fire (the staging rule, G8 phase 0): a data
// argument that is merely `done` once can still be merged into by a
// sibling, an include or a spread, and children generated from a
// half-merged bag would be missing.
//
// TOTALITY. Both iterate a finite, settled bag and neither can call
// itself: the number of children either can produce is fixed by data
// that already exists. Nothing here recurses, which is the guarantee
// the combinators exist to keep.

// packKeys is the keys a data bag names, or the code naming what is
// wrong with it. For a list the strings themselves are the keys: keys
// are DATA, never position, or reordering the list would churn every
// generated child (the Terraform `count` lesson).
func packKeys(data Val) ([]string, string) {
	switch d := data.(type) {
	case *MapVal:
		return append([]string{}, d.keys...), ""
	case *ListVal:
		out := make([]string, 0, len(d.peg))
		for _, el := range d.peg {
			sv, ok := el.(*ScalarVal)
			if !ok || KindString != sv.kind {
				return nil, "pack_key"
			}
			s, _ := sv.peg.(string)
			out = append(out, s)
		}
		return out, ""
	}
	return nil, "pack_data"
}

// eachValues is the children a data bag holds, in the order the result
// must carry them: source order for a list, sorted-key order for a map.
// A generated list whose order depended on insertion history would
// differ between two runs of one document, and between the two ports.
func eachValues(data Val) ([]Val, string) {
	switch d := data.(type) {
	case *MapVal:
		names := append([]string{}, d.keys...)
		sort.Strings(names)
		out := make([]Val, 0, len(names))
		for _, k := range names {
			out = append(out, d.peg[k])
		}
		return out, ""
	case *ListVal:
		return append([]Val{}, d.peg...), ""
	}
	return nil, "each_data"
}

func packFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var data Val = top()
	if 0 < len(args) {
		data = args[0]
	}
	keys, bad := packKeys(data)
	if "" != bad {
		return makeNilErr(ctx, bad, f, nil)
	}

	var tmpl Val = top()
	if 1 < len(args) {
		tmpl = args[1]
	}

	out := newMap()
	for _, key := range keys {
		kslot := append(cp(base), key)
		// CLONED, never shared. A spread may share a template that
		// holds nothing path-dependent; a generator's template IS the
		// child, and a child is a position (see the TS
		// PackFuncVal.resolve comment).
		child := clonePath(tmpl, kslot)
		if prev, seen := out.peg[key]; seen {
			// Duplicate generated keys are not an error: the colliding
			// children unify, exactly as duplicate source keys merge.
			ctx.slot = kslot
			out.peg[key] = unite(ctx, prev, child)
			continue
		}
		out.keys = append(out.keys, key)
		out.peg[key] = child
	}
	out.setvpath(cp(base))
	return out
}

func eachFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var data Val = top()
	if 0 < len(args) {
		data = args[0]
	}
	vals, bad := eachValues(data)
	if "" != bad {
		return makeNilErr(ctx, bad, f, nil)
	}

	var tmpl Val
	if 1 < len(args) {
		tmpl = args[1]
	}

	elems := make([]Val, 0, len(vals))
	for i, v := range vals {
		islot := append(cp(base), itoa(i))
		// The element is the source child CLONED, not shared: it is a
		// second position holding that value, and a position is where
		// path-dependent content resolves. The clone keeps the identity
		// if the child carries one (G4 phase 1) -- a listed entity is
		// still that entity.
		el := clonePath(v, islot)
		if nil != tmpl {
			ctx.slot = islot
			el = unite(ctx, el, clonePath(tmpl, islot))
		}
		elems = append(elems, el)
	}
	out := newList(elems)
	out.setvpath(cp(base))
	return out
}
