/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { NilVal } from '../val/NilVal'
import { PathVal } from '../val/PathVal'
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
      if (arg instanceof PathVal) {
        // PathVal from dotted arg — resolve via find().
        const found = arg.find(ctx)
        if (found != null && !found.isNil) {
          arg = found
        }
        else {
          arg.dc = DONE
        }
      }
      else if (arg.isScalar && arg.peg != null && arg.peg !== ''
        && ('string' === typeof arg.peg || arg.isNumber)) {
        // String or number arg like path("foo") or path(0.2) — create a path value
        arg = this.place(new PathVal({ peg: [arg], absolute: false })) as PathVal
        arg.dc = DONE
      }
      else if (arg.isNil || (arg.isScalar && (arg.peg === '' || arg.peg == null))) {
        arg = makeNilErr(ctx, 'invalid-arg', this)
      }
      // else: already resolved by preprocessing — pass through
    }

    args[0] = arg

    this.prepared++

    return args
  }


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)

    if (out instanceof PathVal) {
      const found = out.find(ctx)
      if (found != null && !found.isNil) {
        out = found
      }
    }

    return out
  }

}


export {
  PathFuncVal,
}
