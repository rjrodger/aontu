/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import {
  Nil,
  IntegerVal,
} from '../val'



import { FuncValBase } from './FuncValBase'


class CeilFuncVal extends FuncValBase {
  isCeilFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new CeilFuncVal(spec)
  }

  funcname() {
    return 'ceil'
  }


  resolve(_ctx: Context | undefined, args: Val[]) {
    const oldpeg = args?.[0].peg
    const peg = isNaN(oldpeg) ? undefined : Math.ceil(oldpeg)
    const out =
      null == peg ? new Nil({ msg: 'Not a number: ' + oldpeg }) :
        new IntegerVal({ peg })
    return out
  }
}


export {
  CeilFuncVal,
}
