/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import {
  NilVal,
  ScalarKindVal,
  makeScalar,
} from '../val'



import { FuncBaseVal } from './FuncBaseVal'


class LowerFuncVal extends FuncBaseVal {
  isLowerFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new LowerFuncVal(spec)
  }

  funcname() {
    return 'lower'
  }


  resolve(_ctx: Context | undefined, args: Val[]) {
    const oldpeg = args?.[0].peg
    const peg = 'string' === typeof oldpeg ? oldpeg.toLowerCase() :
      'number' === typeof oldpeg ? Math.floor(oldpeg) :
        undefined
    const out = this.place(
      null == peg ? new NilVal({ msg: 'Not a string or number: ' + oldpeg }) :
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
