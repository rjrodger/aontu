/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr, AontuError } from '../err'

import { ScalarVal } from './ScalarVal'
import { Float } from './ScalarKindVal'

import {
  explainOpen,
  explainClose,
} from '../utility'


class NumberVal extends ScalarVal {
  isNumber = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    // Number.isFinite (not the coercing global isNaN, which lets null/''
    // through as "numbers") — only an actual finite number is valid.
    if (!Number.isFinite(spec.peg)) {
      throw new AontuError('not-number: ' + spec.peg)
    }

    super({ ...spec, kind: Float }, ctx)
  }


  unify(peer: any, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Number', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind || (peer as any).isConstraint) {
        out = peer.unify(this, ctx)
      }
      else if (
        peer.isScalar &&
        peer.kind === this.kind &&
        peer.peg === this.peg
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


  get canon() {
    const s = super.canon
    return (s.includes('.') ||
      s.includes('e') ||
      s.includes('E') ||
      s.includes('N') ||
      s.includes('I')) ? s : s + '.0'
  }
} /* node:coverage ignore next 6 */


export {
  NumberVal,
}
