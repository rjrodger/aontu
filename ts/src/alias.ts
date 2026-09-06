/* Copyright (c) 2021-2026 Richard Rodger, MIT License */

// ALIAS EXPANSION FOR CANON. An alias is a name for a value, and
// nothing more (docs/design/ALIASES.0.md §4): the declaration is
// erased from generation, canon and the hash, and a reference resolves
// to the value in place. One place a reference is NOT resolved in
// place is a spread template -- `[&: %unit]`, `{&: {a: %u}}` -- because
// a template applies to children that have not arrived, so it stands
// in the settled tree as the reference it was written as. Canon has
// erased the declaration, so the name alone would not reparse, and the
// hash of `t: {&: %u}` would differ from the hash of `t: {&: integer}`,
// which is the same document.
//
// This walk runs ONCE, after the last unification pass, and attaches
// to every standing alias reference the value it names, which its
// canon then renders instead of the name. The tree is not changed:
// the reference still stands, still resolves at each destination, and
// unification never reads the expansion.
//
// What a reference expands to. The ref-spread SNAPSHOT where one was
// taken (MapVal.snapshotRefSpread: a path-dependent template captured
// before its key()/path() resolved at the declaration), else the
// declaration's settled value at the root. The snapshot is the
// template the destinations actually saw; the settled value of
// `%row = {name: key()}` is `{name: "%row"}`, the leak the snapshot
// exists to prevent, and canon must not print it either.
//
// The knot. A recursive alias names itself inside its own template
// (`%json = null | ... | [&: %json] | {&: %json}`). Its expansion
// contains a reference to the name being expanded, and that reference
// keeps its name: canon cannot spell the declaration it erased, and
// an infinite unrolling is not a canon. Such a canon does not reparse
// on its own -- the one place alias erasure and canon convergence
// pull apart (use-cases/BUGS.md §82). Only the reference that closes
// the cycle is left as a name; everything up to it expands.
//
// Every value is visited once (templates are shared across
// destinations, and one declaration is reached through many
// references), children in code-point key order, so the two ports
// attach the same expansions in the same order and print one canon.
// Twin of expandAliases in go/alias.go.

import type { Val } from './type'

import { cmpCodePoint } from './keyorder'
import { spreadSnapKey } from './val/MapVal'


function expandAliases(root: Val, snapmap: Map<string, Val>): void {
  if (true !== (root as any).isMap) {
    return
  }

  const seen = new Set<Val>()

  const visit = (v: any, stack: string[]): void => {
    if (null == v || true !== v.isVal || seen.has(v)) {
      return
    }
    seen.add(v)

    if (true === v.isRef) {
      const name: string | undefined = v.aliasName
      if (undefined === name) {
        return
      }
      v.expansion = undefined
      if (stack.includes(name)) {
        return
      }
      const target: Val | undefined =
        snapmap.get(spreadSnapKey(v)) ?? (root as any).peg[name]
      if (null == target) {
        return
      }
      v.expansion = target
      visit(target, [...stack, name])
      return
    }

    if (true === v.isMap) {
      // A declaration is reached through its references, each under
      // its own name, never as a child: a self-reference inside it
      // is a knot only from inside.
      const keys = Object.keys(v.peg)
        .filter((k: string) => !v.aliasKeys.includes(k))
        .sort(cmpCodePoint)
      for (const k of keys) {
        visit(v.peg[k], stack)
      }
    }
    else if (Array.isArray(v.peg)) {
      for (const e of v.peg) {
        visit(e, stack)
      }
    }
    else if (null != v.peg && true === v.peg.isVal) {
      visit(v.peg, stack)
    }

    if ((true === v.isMap || true === v.isList) && null != v.spread.cj) {
      visit(v.spread.cj, stack)
    }
  }

  visit(root, [])
} /* node:coverage ignore next 5 */


export {
  expandAliases,
}
