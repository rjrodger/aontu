/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

import "sort"

func expandAliases(root Val, snapmap map[string]Val) {
	rm, ok := root.(*MapVal)
	if !ok {
		return
	}

	seen := map[Val]bool{}

	var visit func(v Val, stack []string)
	visit = func(v Val, stack []string) {
		if nil == v || seen[v] {
			return
		}
		seen[v] = true

		switch n := v.(type) {
		case *RefVal:
			name, isAlias := n.aliasName()
			if !isAlias {
				return
			}
			n.expansion = nil
			for _, s := range stack {
				if s == name {
					return
				}
			}
			target, snapped := snapmap[refSnapKey(n)]
			if !snapped {
				target = rm.peg[name]
			}
			if nil == target {
				return
			}
			n.expansion = target
			visit(target, append(append([]string{}, stack...), name))

		case *MapVal:
			// A declaration is reached through its references, each
			// under its own name, never as a child: a self-reference
			// inside it is a knot only from inside.
			keys := make([]string, 0, len(n.keys))
			for _, k := range n.keys {
				if !n.isAliasKey(k) {
					keys = append(keys, k)
				}
			}
			sort.Strings(keys)
			for _, k := range keys {
				visit(n.peg[k], stack)
			}
			if nil != n.spread {
				visit(n.spread, stack)
			}

		case *ListVal:
			for _, e := range n.peg {
				visit(e, stack)
			}
			if nil != n.spread {
				visit(n.spread, stack)
			}

		case *ConjunctVal:
			for _, e := range n.peg {
				visit(e, stack)
			}

		case *DisjunctVal:
			for _, e := range n.peg {
				visit(e, stack)
			}

		case *FuncVal:
			for _, e := range n.peg {
				visit(e, stack)
			}

		case *PlusOpVal:
			for _, e := range n.peg {
				visit(e, stack)
			}

		case *PrefVal:
			visit(n.peg, stack)

		case *ExpectVal:
			visit(n.peg, stack)
		}
	}

	visit(root, nil)
}
