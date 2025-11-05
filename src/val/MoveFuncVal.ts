/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { NilVal } from '../val/NilVal'

import {
  walk
} from '../utility'



import { FuncBaseVal } from './FuncBaseVal'
import { CopyFuncVal } from './CopyFuncVal'



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


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? NilVal.make(ctx, 'arg', this)

    const orig = out
    const origcanon = orig.canon

    if (!orig.isNil) {
      const src = orig.clone(ctx)

      walk(orig, (_key: string | number | undefined, val: Val) => {
        val.mark.hide = true
        return val
      })

      out = new CopyFuncVal({ peg: [src] }, ctx)
    }

    Object.defineProperty(out, 'canon', {
      get: () => 'move(' + origcanon + ')',
      configurable: true
    })

    // console.log('MOVE-resolve', out)

    return out
  }
}


export {
  MoveFuncVal,
}
