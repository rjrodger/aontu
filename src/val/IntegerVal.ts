/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { ScalarVal } from './ScalarVal'
import { Integer } from './ScalarKindVal'
import { NilVal } from './NilVal'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


class IntegerVal extends ScalarVal {
  isInteger = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    if (!Number.isInteger(spec.peg)) {
      // TODO: use Nil?
      throw new Error('not-integer: ' + spec.peg)
    }
    // super({ peg: spec.peg, kind: Integer }, ctx)
    super({ ...spec, kind: Integer }, ctx)
  }

  unify(peer: any, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Integer', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind) {
        out = peer.unify(this, ctx.clone({ explain: ec(te, 'KND') }))
      }
      else if (
        peer.isScalar &&
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
}


export {
  IntegerVal,
}
