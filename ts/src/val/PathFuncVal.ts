/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { NilVal } from '../val/NilVal'
import { RefVal } from '../val/RefVal'
import { FuncBaseVal } from './FuncBaseVal'


class PathFuncVal extends FuncBaseVal {
  isPathFunc = true

  prepared = 0

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    const pathfunc = new PathFuncVal(spec)
    pathfunc.prepared = this.prepared
    return pathfunc
  }

  funcname() {
    return 'path'
  }


  prepare(ctx: AontuContext, args: Val[]) {
    let arg = args[0]

    if (0 === this.prepared) {
      // A missing argument (`path()`) must produce an invalid-arg error
      // value, as the Go port does -- reading .isScalar off nothing threw
      // a TypeError that the unifier could only report as an opaque
      // internal error. Same discipline breach, and same fix, as the one
      // UpperFuncVal records; path() was missed in that sweep.
      if (null == arg) {
        arg = makeNilErr(ctx, 'invalid-arg', this)
      }
      else if (arg.isScalar) {
        arg = this.place(new RefVal({ peg: [arg], absolute: false }))
      }
      else if (!arg.isRef) {
        arg = makeNilErr(ctx, 'invalid-arg', this)
      }
    }

    args[0] = arg

    this.prepared++

    return args
  }


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)

    return out
  }

}


export {
  PathFuncVal,
}
