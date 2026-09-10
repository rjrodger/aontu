/* Copyright (c) 2021-2026 Richard Rodger, MIT License */


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
