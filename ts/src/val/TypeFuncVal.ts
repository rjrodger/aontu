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
  walk,
  explainOpen,
  explainClose,
} from '../utility'


import { FuncBaseVal } from './FuncBaseVal'


class TypeFuncVal extends FuncBaseVal {
  isTypeFunc = true

  resolved?: Val

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)

    // The function does not mark itself!
    this.mark.type = false
    this.mark.hide = false
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new TypeFuncVal(spec)
  }

  funcname() {
    return 'type'
  }


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)
    if (!out.isNil) {
      out = out.clone(ctx)

      walk(out, (_key: string | number | undefined, val: Val) => {
        val.mark.type = true
        return val
      })
    }

    return out
  }
}


export {
  TypeFuncVal,
}
