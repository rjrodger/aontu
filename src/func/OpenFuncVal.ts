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


class OpenFuncVal extends FuncBaseVal {
  isOpenFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new OpenFuncVal(spec)
  }

  funcname() {
    return 'open'
  }


  resolve(ctx: Context | undefined, args: Val[]) {
    const argval: any = args[0]

    if (null == argval) {
      return NilVal.make(ctx, 'no_first_arg', this, undefined, 'close')
    }

    if (argval.isMap || argval.isList) {
      (argval as BagVal).closed = false
    }

    return argval
  }

}


export {
  OpenFuncVal,
}
