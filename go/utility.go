/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

// propagateMarks copies type/hide marks from source to target.
func propagateMarks(source, target Val) {
	if source == nil || target == nil {
		return
	}
	sm := source.GetMark()
	tm := target.GetMark()
	tm.Type = tm.Type || sm.Type
	tm.Hide = tm.Hide || sm.Hide
}

// WalkFunc is called for each Val during a tree walk.
type WalkFunc func(v Val, path []string, depth int) bool

// walk performs a depth-first traversal of a Val tree.
// The before function is called on entry. If it returns false, children are skipped.
func walk(v Val, before WalkFunc, maxdepth int) {
	if v == nil || maxdepth < 0 {
		return
	}
	walkInner(v, v.GetPath(), 0, before, maxdepth)
}

func walkInner(v Val, path []string, depth int, before WalkFunc, maxdepth int) {
	if depth > maxdepth {
		return
	}

	if before != nil && !before(v, path, depth) {
		return
	}

	peg := v.GetPeg()

	// Map children
	if m, ok := peg.(map[string]Val); ok {
		for k, child := range m {
			if child != nil {
				childPath := append(append([]string{}, path...), k)
				walkInner(child, childPath, depth+1, before, maxdepth)
			}
		}
		return
	}

	// Array children
	if a, ok := peg.([]Val); ok {
		for _, child := range a {
			if child != nil {
				walkInner(child, child.GetPath(), depth+1, before, maxdepth)
			}
		}
		return
	}

	// Single Val child
	if child, ok := peg.(Val); ok && child != nil {
		walkInner(child, child.GetPath(), depth+1, before, maxdepth)
	}
}
