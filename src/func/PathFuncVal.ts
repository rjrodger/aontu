/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import { NilVal } from '../val/NilVal'
import { RefVal } from '../val/RefVal'
import { FuncBaseVal } from './FuncBaseVal'


class PathFuncVal extends FuncBaseVal {
  isPathFunc = true

  prepared = 0

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    const pathfunc = new PathFuncVal(spec)
    pathfunc.prepared = this.prepared
    return pathfunc
  }

  funcname() {
    return 'path'
  }


  prepare(ctx: Context, args: Val[]) {
    let arg = args[0]

    if (0 === this.prepared) {
      if (arg.isScalar) {
        arg = this.place(new RefVal({ peg: [arg], absolute: false }))
      }
      else if (!arg.isRef) {
        arg = NilVal.make(ctx, 'invalid-arg', this)
      }
    }

    args[0] = arg

    this.prepared++

    return args
  }


  resolve(ctx: Context, args: Val[]) {
    let out = args[0] ?? NilVal.make(ctx, 'arg', this)

    return out
  }

}


export {
  PathFuncVal,
}
