/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'


import { FuncBaseVal } from './FuncBaseVal'
import { NilVal } from '../val/NilVal'
import { BagVal } from '../val/BagVal'


class CloseFuncVal extends FuncBaseVal {
  isCloseFunc = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    this.validateArgs(spec.peg, 1)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new CloseFuncVal(spec)
  }

  funcname() {
    return 'close'
  }


  resolve(ctx: Context, args: Val[]) {
    const argval: any = args[0]

    if (null == argval) {
      return NilVal.make(ctx, 'no_first_arg', this, undefined, 'close')
    }

    if (argval.isMap || argval.isList) {
      (argval as BagVal).closed = true
      // console.log('CLOSED', argval.canon)
    }

    return argval
  }

}


export {
  CloseFuncVal,
}
