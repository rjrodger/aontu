/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import {
  walk
} from '../utility'

import { NilVal } from '../val/NilVal'
import { PrefVal } from '../val/PrefVal'
import { FuncBaseVal } from './FuncBaseVal'


class PrefFuncVal extends FuncBaseVal {
  isPrefFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new PrefFuncVal(spec)
  }

  funcname() {
    return 'pref'
  }


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)

    if (!out.isNil) {
      out = out.clone(ctx)

      // Wrap every child val in a PrefVal
      out = walk(out, (_key: string | number | undefined, val: Val) => {
        let oval = val
        // console.log('PREFVAL', _key, oval.canon, oval.constructor.name)
        if (
          val.isScalar
          || val.isPref
        ) {
          oval = new PrefVal({ peg: val }, ctx)
        }

        return oval
      })
    }

    return out
  }

}


export {
  PrefFuncVal,
}
