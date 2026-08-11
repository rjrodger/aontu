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


// The unbounded exact integer leaf of the number tower, reached only by
// a `0d` literal with no fraction and no exponent (`0d5`, `-0d5`,
// `0d123456789012345678901234567890`) or by direct construction.
//
// Its peg is a native bigint: exact at any magnitude, immutable, and
// compared by VALUE with `===` (D2 -- two separately built bigints
// holding the same number are `===`, which is exactly the property the
// Go port has to reproduce by hand for `*big.Int`).
//
// `biginteger` is DISJOINT from `integer`: `5 & 0d5` is an error, since
// a successful meet would have to pick one of the two kinds and either
// choice makes `&` asymmetric in kind.
class BigIntegerVal extends ScalarVal {
  isBigInteger = true

  declare peg: bigint

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    // Exact-input construction (D8): a bigint, or the digits as text. A
    // JS `number` is deliberately NOT accepted -- it has already been
    // rounded before this library could inspect it, so an exact value
    // above 2^53 could never arrive that way intact.
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
      if (peer.isScalarKind) {
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
}


export {
  BigIntegerVal,
}
