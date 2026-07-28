/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strconv"

func cp(p []string) []string { return append([]string{}, p...) }

func itoa(i int) string { return strconv.Itoa(i) }

// setPaths assigns the path from root to every Val in a freshly parsed
// tree (mirrors the path tracking that ts/src/lang.ts does during
// parse). References use these paths for relative resolution and cycle
// detection.
func setPaths(v Val, path []string) {
	v.setvpath(path)
	switch n := v.(type) {
	case *MapVal:
		if n.spread != nil {
			setPaths(n.spread, path)
		}
		for _, k := range n.keys {
			setPaths(n.peg[k], append(cp(path), k))
		}
	case *ListVal:
		if n.spread != nil {
			setPaths(n.spread, path)
		}
		for i, e := range n.peg {
			setPaths(e, append(cp(path), itoa(i)))
		}
	case *ConjunctVal:
		for _, t := range n.peg {
			setPaths(t, path)
		}
	case *DisjunctVal:
		for _, t := range n.peg {
			setPaths(t, path)
		}
	case *PrefVal:
		setPaths(n.peg, path)
	case *PlusOpVal:
		for _, t := range n.peg {
			setPaths(t, path)
		}
	case *FuncVal:
		for _, a := range n.peg {
			setPaths(a, path)
		}
	}
}

// overlayPath rebases a cloned node's path: the destination walk path
// overwrites the leading segments of the node's original path, and the
// original TAIL beyond the destination's length is kept (the TS
// Val.clone path behaviour). A transplant to a SHALLOWER destination
// therefore keeps trailing source segments — `x:a:{k:key()} y:$.x.a`
// gives y's key() the path [y,k,k] (dest [y,k] + orig tail [k]), so
// key(1) resolves to "k", exactly as in TS.
func overlayPath(dest, orig []string) []string {
	if len(orig) <= len(dest) {
		return cp(dest)
	}
	out := make([]string, len(orig))
	copy(out, dest)
	copy(out[len(dest):], orig[len(dest):])
	return out
}

// clonePath deep-clones a Val, rebasing the subtree at the given path
// (mirrors Val.clone in ts/src/val/Val.ts, used when a reference
// resolves to a target). Done-state is preserved.
func clonePath(v Val, path []string) Val {
	switch n := v.(type) {
	case *TopVal:
		// Return a fresh TOP so marks (e.g. hide(top)) don't leak onto
		// the shared singleton.
		out := newTop()
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		return out
	case *NilVal:
		c := *n
		c.path = cp(path)
		return &c
	case *ScalarVal:
		c := *n
		c.path = cp(path)
		return &c
	case *ScalarKindVal:
		c := *n
		c.path = cp(path)
		return &c
	case *MapVal:
		out := newMap()
		out.dc = n.dc
		out.path = overlayPath(path, n.path)
		out.closed = n.closed
		out.optional = append([]string{}, n.optional...)
		if n.spread != nil {
			out.spread = clonePath(n.spread, path)
		}
		copyMarks(out, n)
		for _, k := range n.keys {
			out.set(k, clonePath(n.peg[k], append(cp(path), k)))
		}
		return out
	case *ListVal:
		out := &ListVal{}
		out.dc = n.dc
		out.path = overlayPath(path, n.path)
		out.closed = n.closed
		if n.spread != nil {
			out.spread = clonePath(n.spread, path)
		}
		copyMarks(out, n)
		for i, e := range n.peg {
			out.peg = append(out.peg, clonePath(e, append(cp(path), itoa(i))))
		}
		return out
	case *ConjunctVal:
		out := newConjunct(nil)
		out.dc = n.dc
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		for _, t := range n.peg {
			out.peg = append(out.peg, clonePath(t, path))
		}
		return out
	case *DisjunctVal:
		out := newDisjunct(nil)
		out.dc = n.dc
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		for _, t := range n.peg {
			out.peg = append(out.peg, clonePath(t, path))
		}
		return out
	case *PrefVal:
		out := newPref(clonePath(n.peg, path))
		out.dc = n.dc
		out.rank = n.rank
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		return out
	case *RefVal:
		out := &RefVal{absolute: n.absolute, prefix: n.prefix, hideFound: n.hideFound, prefFound: n.prefFound, copyFound: n.copyFound}
		out.dc = n.dc
		out.sp = n.sp
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		out.peg = append([]any{}, n.peg...)
		return out
	case *VarVal:
		out := &VarVal{peg: n.peg}
		out.dc = n.dc
		out.sp = n.sp
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		return out
	case *PlusOpVal:
		out := &PlusOpVal{}
		out.dc = n.dc
		out.path = overlayPath(path, n.path)
		copyMarks(out, n)
		for _, t := range n.peg {
			out.peg = append(out.peg, clonePath(t, path))
		}
		return out
	case *FuncVal:
		out := &FuncVal{name: n.name}
		out.dc = n.dc
		out.path = overlayPath(path, n.path)
		// The spread-material stamp survives cloning (the key() delay
		// path re-clones each pass; a spread-delivered func must still
		// be recognisable when it later freezes in a hidden subtree).
		out.spr = n.spr
		copyMarks(out, n)
		for _, a := range n.peg {
			out.peg = append(out.peg, clonePath(a, path))
		}
		return out
	}
	return v
}
