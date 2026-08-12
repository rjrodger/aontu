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
import { ScalarKindVal } from '../val/ScalarKindVal'
import { makeScalarLike } from '../val/valutil'
import { Decimal } from '../val/Decimal'



import { FuncBaseVal } from './FuncBaseVal'


class LowerFuncVal extends FuncBaseVal {
  isLowerFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new LowerFuncVal(spec)
  }

  funcname() {
    return 'lower'
  }


  resolve(ctx: AontuContext | undefined, args: Val[]) {
    // A missing argument (`lower()`) must produce an invalid-arg error
    // value, as the Go port does — reading .peg off nothing threw a
    // TypeError that the unifier could only report as an opaque
    // internal error.
    const arg = args?.[0]
    const oldpeg = arg?.peg
    const peg = 'string' === typeof oldpeg ? oldpeg.toLowerCase() :
      'number' === typeof oldpeg ? Math.floor(oldpeg) :
        // The exact leaves take an EXACT floor and keep their kind: a
        // biginteger is already integral so it is its own floor, and a
        // bigdecimal floors by coefficient arithmetic. Math.floor is not
        // an option for either — it would round the value into binary64
        // first, which is the loss the `0d` leaves exist to refuse.
        'bigint' === typeof oldpeg ? oldpeg :
          oldpeg instanceof Decimal ? oldpeg.floor() :
            undefined
    const out = this.place(
      null == peg ?
        makeNilErr(ctx, 'invalid-arg', this) :
        // The floor keeps the ARGUMENT's kind (lower(2) is an integer 2,
        // lower(1.9) is a number 1) — the function must not narrow
        // number to integer, and this also makes the actual result kind
        // agree with the superior() advertised below.
        makeScalarLike(peg, arg)
    )
    return out
  }


  superior() {
    const arg = this.peg?.[0]
    return arg?.isScalar ?
      this.place(new ScalarKindVal({
        peg: arg.kind
      })) :
      super.superior()
  }

} /* node:coverage ignore next 6 */


export {
  LowerFuncVal,
}
