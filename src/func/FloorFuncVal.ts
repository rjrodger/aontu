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
  IntegerVal,
} from '../val'



import { FuncBaseVal } from './FuncBaseVal'


class FloorFuncVal extends FuncBaseVal {
  isFloorFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    // // console.log('FFV', spec)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new FloorFuncVal(spec)
  }

  funcname() {
    return 'floor'
  }


  resolve(_ctx: Context | undefined, args: Val[]) {
    const oldpeg = args?.[0].peg
    const peg = isNaN(oldpeg) ? undefined : Math.floor(oldpeg)
    const out =
      null == peg ? new NilVal({ msg: 'Not a number: ' + oldpeg }) :
        new IntegerVal({ peg })
    // console.log('FLOOR-RES', oldpeg?.canon, '->', out?.canon)
    return out
  }
}


export {
  FloorFuncVal,
}
