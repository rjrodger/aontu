/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { NilVal } from '../val/NilVal'
import { ScalarKindVal } from '../val/ScalarKindVal'
import { makeScalar } from '../val/valutil'



import { FuncBaseVal } from './FuncBaseVal'


class LowerFuncVal extends FuncBaseVal {
  isLower = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new LowerFuncVal(spec)
  }

  funcname() {
    return 'lower'
  }


  resolve(ctx: AontuContext | undefined, args: Val[]) {
    const oldpeg = args?.[0].peg
    const peg = 'string' === typeof oldpeg ? oldpeg.toLowerCase() :
      'number' === typeof oldpeg ? Math.floor(oldpeg) :
        undefined
    const out = this.place(
      null == peg ?
        NilVal.make(ctx, 'invalid-arg', this) :
        makeScalar(peg)
    )
    return out
  }


  superior() {
    const arg = this.peg?.[0]
    return arg?.isScalar ?
      this.place(new ScalarKindVal({
        peg: arg.kind
      })) :
      super.superior()
  }

}


export {
  LowerFuncVal,
}
