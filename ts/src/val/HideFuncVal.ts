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


class HideFuncVal extends FuncBaseVal {
  isHideFunc = true

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
    return new HideFuncVal(spec)
  }

  funcname() {
    return 'hide'
  }


  /*
  unify(peer: Val, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'HideFunc', this, peer)
    let out: Val | undefined = this.resolved

    if (null == out) {
      out = this.resolve(ctx, this.peg)
    }

    explainClose(te, out)
    return out
  }
  */


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)
    if (!out.isNil) {
      out = out.clone(ctx)

      walk(out, (_key: string | number | undefined, val: Val) => {
        val.mark.hide = true
        return val
      })
    }

    return out
  }
}


export {
  HideFuncVal,
}
