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


class BigDecimalVal extends ScalarVal {
  isBigDecimal = true

  declare peg: Decimal

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    let peg = spec.peg
    if ('string' === typeof peg) {
      try {
        peg = Decimal.fromString(peg)
      }
      catch {
        // Includes a budget refusal (Decimal.fromString enforces D6),
        // so an over-budget string cannot enter through this route
        // either.
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
      if (peer.isScalarKind || (peer as any).isConstraint) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'KND') }) : ctx)
      }
      else if (
        peer.isScalar &&
        peer.kind === this.kind &&
        this.peg.equals(peer.peg)
      ) {
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
} /* node:coverage ignore next 6 */


export {
  BigDecimalVal,
}
