/* Copyright (c) 2021-2025 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { NilVal } from '../val/NilVal'


import {
  walk
} from '../utility'


import { FuncBaseVal } from './FuncBaseVal'


class CopyFuncVal extends FuncBaseVal {
  isCopyFunc = true

  resolved?: Val

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.mark.type = false
    this.mark.hide = false
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new CopyFuncVal(spec)
  }

  funcname() {
    return 'copy'
  }

  resolve(ctx: AontuContext | undefined, args: Val[]) {
    const val = args?.[0]
    const out = null == val || null == ctx ?
      NilVal.make(ctx, 'invalid-arg', this) :
      val.clone(ctx, { mark: { type: false, hide: false } })

    walk(out, (_key: string | number | undefined, val: Val) => {
      val.mark.type = false
      val.mark.hide = false
      return val
    })

    return out
  }
}


export {
  CopyFuncVal,
}
