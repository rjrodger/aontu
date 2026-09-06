/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

import "sort"

// ALIAS EXPANSION FOR CANON -- the Go twin of ts/src/alias.ts.
//
// An alias is a name for a value, and nothing more
// (docs/design/ALIASES.0.md §4): the declaration is erased from
// generation, canon and the hash, and a reference resolves to the
// value in place. One place a reference is NOT resolved in place is a
// spread template -- `[&: %unit]`, `{&: {a: %u}}` -- because a template
// applies to children that have not arrived, so it stands in the
// settled tree as the reference it was written as. Canon has erased
// the declaration, so the name alone would not reparse, and the hash
// of `t: {&: %u}` would differ from the hash of `t: {&: integer}`,
// which is the same document.
//
// expandAliases runs ONCE, after the last unification pass, and
// attaches to every standing alias reference the value it names,
// which its Canon then renders instead of the name. The tree is not
// changed: the reference still stands, still resolves at each
// destination, and unification never reads the expansion.
//
// What a reference expands to: the ref-spread SNAPSHOT where one was
// taken (snapshotRefSpread: a path-dependent template captured before
// its key()/path() resolved at the declaration), else the
// declaration's settled value at the root. The snapshot is the
// template the destinations actually saw; the settled value of
// `%row = {name: key()}` is `{name: "%row"}`, the leak the snapshot
// exists to prevent, and canon must not print it either.
//
// The knot: a recursive alias names itself inside its own template
// (`%json = null | ... | [&: %json] | {&: %json}`). Its expansion
// contains a reference to the name being expanded, and that reference
// keeps its name -- canon cannot spell the declaration it erased, and
// an infinite unrolling is not a canon (use-cases/BUGS.md §82). Only
// the reference that closes the cycle is left as a name.
//
// Every value is visited once (templates are shared across
// destinations, and one declaration is reached through many
// references), children in code-point key order, so the two ports
// attach the same expansions in the same order and print one canon.
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
