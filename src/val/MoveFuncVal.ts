/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { NilVal } from '../val/NilVal'
import { PathVal } from '../val/PathVal'

import {
  walk
} from '../utility'



import { FuncBaseVal } from './FuncBaseVal'
import { CopyFuncVal } from './CopyFuncVal'
import { PrefFuncVal } from './PrefFuncVal'



// Navigate the tree using a PathVal's resolved path and hide the source.
function hideAtPath(root: Val, pv: PathVal) {
  // Compute the refpath the same way PathVal.find does
  const parts: string[] = []
  for (const part of pv.peg) {
    if ('string' === typeof part) parts.push(part)
  }

  let refpath: string[]
  if (pv.absolute) {
    refpath = parts
  }
  else {
    refpath = pv.path.slice(0, -1).concat(parts)
  }

  // Walk to the source, handling conjuncts/disjuncts
  let node: any = root
  for (let i = 0; i < refpath.length; i++) {
    const part = refpath[i]
    if (node?.isMap || node?.isList) {
      node = node.peg[part]
    }
    else if (node?.isConjunct || node?.isDisjunct) {
      // Search junction terms for the key
      let found = null
      const stack = [...node.peg]
      while (stack.length > 0) {
        const term = stack.pop()
        if (term?.isConjunct || term?.isDisjunct) {
          stack.push(...term.peg)
        }
        else if ((term?.isMap || term?.isList) && term.peg[part] != null) {
          found = term.peg[part]
          break
        }
      }
      node = found
    }
    else {
      return
    }
    if (node == null) return
  }

  // Mark the source value hidden
  node.mark.hide = true
  walk(node, (_key: string | number | undefined, val: Val) => {
    val.mark.hide = true
    return val
  })
}


class MoveFuncVal extends FuncBaseVal {
  isMoveFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new MoveFuncVal(spec)
  }

  funcname() {
    return 'move'
  }

  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }

  resolve(ctx: AontuContext, args: Val[]) {
    let arg = args[0] ?? makeNilErr(ctx, 'arg', this)
    if (arg.isNil) return arg

    let src: Val

    if (arg instanceof PathVal) {
      // Get clone for the destination
      src = arg.find(ctx) as Val
      if (src == null || src.isNil) return makeNilErr(ctx, 'arg', this)

      // Hide the source in the tree by navigating to it
      hideAtPath(ctx.root as Val, arg)
    }
    else {
      src = arg.clone(ctx)

      // Hide the original
      arg.mark.hide = true
      walk(arg, (_key: string | number | undefined, val: Val) => {
        val.mark.hide = true
        return val
      })
    }

    // Clear marks on the clone (like copy)
    src.mark.type = false
    src.mark.hide = false
    walk(src, (_key: string | number | undefined, val: Val) => {
      val.mark.type = false
      val.mark.hide = false
      return val
    })

    return new PrefFuncVal({ peg: [src] }, ctx)
  }
}


export {
  MoveFuncVal,
}
