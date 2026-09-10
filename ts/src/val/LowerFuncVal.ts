/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'


import { ScalarKindVal } from '../val/ScalarKindVal'
import { makeScalarLike } from '../val/valutil'
import { Decimal } from '../val/Decimal'
import { caseRange, rangeArg } from './caserange'



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

    // THE RANGE (ts/src/val/caserange.ts): `start` names the first
    // character of the run when it is zero or positive and the last
    // when it is negative; `len` of -1, and the absent argument, are
    // the source's length. Refused on a NUMBER, where a run of
    // characters means nothing -- the numeric arm below is a ceiling,
    // not a case mapping.
    const start = rangeArg(args?.[1])
    const len = rangeArg(args?.[2])
    const ranged = undefined !== start || undefined !== len
    if (ranged &&
      (Number.isNaN(start as number) || Number.isNaN(len as number) ||
        'string' !== typeof oldpeg)) {
      return this.place(makeNilErr(ctx, 'invalid-arg', this, arg, 'range'))
    }
    const peg = 'string' === typeof oldpeg ?
      caseRange(oldpeg, start ?? 0, len ?? -1, false) :
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
