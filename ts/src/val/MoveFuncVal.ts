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

import {
  walk
} from '../utility'



import { FuncBaseVal } from './FuncBaseVal'
import { CopyFuncVal } from './CopyFuncVal'
import { PrefFuncVal } from './PrefFuncVal'



class MoveFuncVal extends FuncBaseVal {
  isMoveFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new MoveFuncVal(spec)
  }

  funcname() {
    return 'move'
  }

  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }

  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)

    const orig = out

    if (!orig.isNil) {
      const src = orig.clone(ctx)

      // THE HIDE-WALK ONLY RUNS WHEN THE CLONE IS A SEPARATE OBJECT.
      //
      // move() is the only function that marks the ORIGINAL rather than
      // the clone -- that is how the value disappears from its old home
      // and reappears at the destination. It relies on clone() returning
      // something distinct to carry to the destination.
      //
      // TopVal.clone is the IDENTITY function, so for `move(top)` the
      // clone and the original are the same object and the walk hid the
      // very value being returned: the key vanished from generated output
      // with no error, while canon still showed `x:top` -- the port
      // disagreeing with itself.
      //
      // With the walk skipped, `move(top)` keeps `top` at the destination
      // and then errors there because top is not generable, which is
      // already what `x:top`, `x:copy(top)` and `x:pref(top)` do in both
      // ports, and what `move(number)` does for the same reason.
      if (src !== orig) {
        if (src.isRef) {
          src.mark._hide_found = true
        }

        walk(orig, (_key: string | number | undefined, val: Val) => {
          val.mark.hide = true
          return val
        })
      }

      out = new PrefFuncVal({ peg: [src] }, ctx)
    }

    // console.log('MOVE-resolve', orig, out)

    return out
  }
}


export {
  MoveFuncVal,
}
