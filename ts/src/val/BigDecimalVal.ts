/* Copyright (c) 2025 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr, AontuError } from '../err'

import { ScalarVal } from './ScalarVal'
import { BigDecimal } from './ScalarKindVal'
import { Decimal } from './Decimal'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


// The exact base-10 decimal leaf of the number tower, reached only by a
// `0d` literal carrying a `.` or an exponent (`0d1.5`, `0d1e3`) or by
// direct construction.
//
// Its peg is a Decimal -- an OBJECT, so unlike every other scalar leaf
// its identity cannot be `===` on the peg. Two bigdecimals are the same
// value when their NUMBERS are equal (D2), which normalisation at
// construction reduces to a two-field comparison; `samePeg` and `unify`
// below are the two places that must not forget it.
class BigDecimalVal extends ScalarVal {
  isBigDecimal = true

  declare peg: Decimal

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    // Exact-input construction (D8): a Decimal, or a decimal literal as
    // text (`'1.5'`, `'0d1e3'`). A JS `number` is deliberately NOT
    // accepted -- binary64 has already rounded it, so `0.1` could never
    // arrive exact.
    let peg = spec.peg
    if ('string' === typeof peg) {
      try {
        peg = Decimal.fromString(peg)
      }
      catch (e: any) {
        throw new AontuError('not-bigdecimal: ' + spec.peg)
      }
    }
    if (!(peg instanceof Decimal)) {
      throw new AontuError('not-bigdecimal: ' + peg)
    }

    super({ ...spec, peg, kind: BigDecimal }, ctx)
  }


  unify(peer: any, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'BigDecimal', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'KND') }) : ctx)
      }
      else if (
        peer.isScalar &&
        peer.kind === this.kind &&
        this.peg.equals(peer.peg)
      ) {
        // Same kind and equal NUMBER. Never `peer.peg === this.peg`:
        // that is object identity, and `0d0.10 & 0d0.1` (two Decimals
        // holding one value) has to succeed.
        out = this
      }
      else if (peer.isTop) {
        out = this
      }
      else {
        out = makeNilErr(ctx, 'scalar_' +
          ((peer as any).kind === this.kind ? 'value' : 'kind'), this, peer)
      }
    }
    else {
      out = super.unify(peer, ctx)
    }

    explainClose(te, out)

    return out
  }


  samePeg(peg: any): boolean {
    return peg instanceof Decimal && this.peg.equals(peg)
  }


  get canon() {
    return this.peg.canon()
  }
}


export {
  BigDecimalVal,
}
