/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { FuncBaseVal } from './FuncBaseVal'


class SuperFuncVal extends FuncBaseVal {
  isSuperFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new SuperFuncVal(spec)
  }

  funcname() {
    return 'super'
  }


  resolve(_ctx: AontuContext, _args: Val[]) {
    return this.place(this.superior())
  }

}


export {
  SuperFuncVal,
}
