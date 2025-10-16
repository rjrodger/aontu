/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import {
  walk
} from '../utility'

import { NilVal, PrefVal } from '../val'
import { FuncBaseVal } from './FuncBaseVal'


class PrefFuncVal extends FuncBaseVal {
  isPrefFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new PrefFuncVal(spec)
  }

  funcname() {
    return 'pref'
  }


  resolve(ctx: Context, args: Val[]) {
    let out = args[0] ?? NilVal.make(ctx, 'arg', this)

    if (!out.isNil) {
      out = out.clone(ctx)

      // Wrap every child val in a PrefVal
      out = walk(out, (_key: string | number | undefined, val: Val) => {
        let out = val
        // console.log('PREFVAL', _key, out.canon, (out as any).isScalarVal)
        if ((val as any).isScalarVal) {
          out = new PrefVal({ peg: val }, ctx)
        }
        return out
      })
    }

    return out
  }

}


export {
  PrefFuncVal,
}
