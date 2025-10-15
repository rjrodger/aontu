/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'


import { FuncBaseVal } from './FuncBaseVal'


class SuperFuncVal extends FuncBaseVal {
  isSuperFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new SuperFuncVal(spec)
  }

  funcname() {
    return 'super'
  }


  resolve(_ctx: Context | undefined, _args: Val[]) {
    return this
  }

}


export {
  SuperFuncVal,
}