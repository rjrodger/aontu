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
  StringVal,
} from '../val'



import { FuncValBase } from './FuncValBase'


class UpperFuncVal extends FuncValBase {
  isUpperFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new UpperFuncVal(spec)
  }

  funcname() {
    return 'upper'
  }


  resolve(_ctx: Context | undefined, args: Val[]) {
    const oldpeg = args?.[0].peg
    const peg = 'string' === typeof oldpeg ? oldpeg.toUpperCase() : undefined
    const out =
      null == peg ? new Nil({ msg: 'Not a string: ' + oldpeg }) :
        new StringVal({ peg })
    return out
  }
}


export {
  UpperFuncVal,
}
