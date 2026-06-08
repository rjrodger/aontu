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

import {
  walk
} from '../utility'



import { FuncBaseVal } from './FuncBaseVal'
import { CopyFuncVal } from './CopyFuncVal'
import { PrefFuncVal } from './PrefFuncVal'



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
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)

    const orig = out

    if (!orig.isNil) {
      const src = orig.clone(ctx)

      if (src.isRef) {
        src.mark._hide_found = true
      }

      walk(orig, (_key: string | number | undefined, val: Val) => {
        val.mark.hide = true
        return val
      })

      // out = new CopyFuncVal({ peg: [src] }, ctx)
      out = new PrefFuncVal({ peg: [src] }, ctx)
      // out = src
    }

    // console.log('MOVE-resolve', orig, out)

    return out
  }
}


export {
  MoveFuncVal,
}
