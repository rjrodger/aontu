/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'


import { FuncBaseVal } from './FuncBaseVal'
import { BagVal } from '../val/BagVal'


class CloseFuncVal extends FuncBaseVal {
  isCloseFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.validateArgs(spec.peg, 1)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new CloseFuncVal(spec)
  }

  funcname() {
    return 'close'
  }


  resolve(ctx: AontuContext, args: Val[]) {
    const argval: any = args[0]

    if (null == argval) {
      return makeNilErr(ctx, 'no_first_arg', this, undefined, 'close')
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
