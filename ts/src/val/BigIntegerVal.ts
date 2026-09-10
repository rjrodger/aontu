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
import { BigInteger } from './ScalarKindVal'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


class BigIntegerVal extends ScalarVal {
  isBigInteger = true

  declare peg: bigint

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    let peg = spec.peg
    if ('string' === typeof peg) {
      if (!/^[-+]?[0-9]+$/.test(peg)) {
        throw new AontuError('not-biginteger: ' + peg)
      }
      peg = BigInt(peg)
    }
    if ('bigint' !== typeof peg) {
      throw new AontuError('not-biginteger: ' + peg)
    }

    super({ ...spec, peg, kind: BigInteger }, ctx)
  }


  unify(peer: any, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'BigInteger', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind || (peer as any).isConstraint) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'KND') }) : ctx)
      }
      else if (
        peer.isScalar &&
        peer.kind === this.kind &&
        peer.peg === this.peg
      ) {
        // Same kind and equal NUMBER (bigint `===` is value equality).
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


  // The sign renders BEFORE the marker (`-0d5`): `0d-5` is not a literal
  // this language accepts, so canon must not produce it.
  get canon() {
    const neg = this.peg < 0n
    return (neg ? '-0d' : '0d') + (neg ? -this.peg : this.peg).toString()
  }
} /* node:coverage ignore next 6 */


export {
  BigIntegerVal,
}
