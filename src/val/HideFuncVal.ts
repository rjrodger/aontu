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
    this.mark.type = false
    this.mark.hide = true
    // console.log('HFV', this.id, this.peg?.[0]?.canon)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new HideFuncVal(spec)
  }

  funcname() {
    return 'hide'
  }


  unify(peer: Val, ctx: AontuContext, trace?: any[]): Val {
    const te = ctx.explain && explainOpen(ctx, trace, 'HideFunc', this, peer)
    let out: Val | undefined = this.resolved

    if (null == out) {
      out = this.resolve(ctx, this.peg)
    }

    explainClose(te, out)
    return out
  }


  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? NilVal.make(ctx, 'arg', this)
    if (!out.isNil) {
      out = out.clone(ctx)
      // out.mark.hide = true

      walk(out, (_key: string | number | undefined, val: Val) => {
        val.mark.hide = true
        return val
      })

    }
    // console.log('HIDE-RESOLVE', args[0]?.canon, '->', out.canon)

    // TODO: since hide is self-erasing, we need this hack - find a better way

    const origcanon = out.canon
    Object.defineProperty(out, 'canon', {
      get: () => 'hide(' + origcanon + ')',
      configurable: true
    })

    return out
  }
}


export {
  HideFuncVal,
}
