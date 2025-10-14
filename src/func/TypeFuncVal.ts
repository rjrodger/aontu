/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import {
  NilVal,
} from '../val'


import {
  walk
} from '../utility'


import { FuncBaseVal } from './FuncBaseVal'


class TypeFuncVal extends FuncBaseVal {
  isTypeFuncVal = true

  resolved?: Val

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    this.type = true
    // console.log('TFV', this.id, this.peg?.[0]?.canon)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new TypeFuncVal(spec)
  }

  funcname() {
    return 'type'
  }


  unify(peer: Val, ctx: Context): Val {
    let out: Val | undefined = this.resolved

    if (null == out) {
      out = this.resolve(ctx, this.peg)
    }

    return out
  }


  resolve(ctx: Context, args: Val[]) {
    let out = args[0] ?? NilVal.make(ctx, 'arg', this)
    if (!out.isNil) {
      out = out.clone(ctx)
      // out.type = true

      walk(out, (_key: string | number | undefined, val: Val) => {
        val.type = true
        return val
      })

    }
    // console.log('TYPE-RESOLVE', args[0]?.canon, '->', out.canon)
    return out
  }
}


export {
  TypeFuncVal,
}
