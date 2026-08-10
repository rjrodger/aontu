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


  resolve(_ctx: AontuContext, args: Val[]) {
    // super(x) is the lattice-superior of its ARGUMENT, not of the
    // super() call itself: super(1) -> integer, super(1.5) -> number,
    // super(a) -> string, super(true) -> boolean. Returning the
    // function's own superior (top) is what made super() inert.
    const arg: any = args?.[0]
    if (arg?.isVal) {
      const sup = arg.superior()
      // Where the argument has no meaningful superior (superior()
      // defaults to top), fall back to the previous behaviour.
      if (null != sup && true !== sup.isTop) {
        return this.place(sup)
      }
    }
    return this.place(this.superior())
  }

}


export {
  SuperFuncVal,
}
