/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'
import { NilVal } from './NilVal'

import {
  explainOpen,
  explainClose,
} from '../utility'



class NumberVal extends ScalarVal {
  isNumber = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    if (isNaN(spec.peg)) {
      // TODO: use Nil?
      throw new Error('not-number: ' + spec.peg)
    }

    // super({ peg: spec.peg, kind: Number }, ctx)
    super({ ...spec, kind: Number }, ctx)
  }


  unify(peer: any, ctx: Context, trace?: any[]): Val {
    const te = ctx.explain && explainOpen(ctx, trace, 'Number', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind) {
        out = peer.unify(this, ctx)
      }
      else if (
        peer.isScalar &&
        peer.peg === this.peg
      ) {
        out = peer.isInteger ? peer : this
      }
      else if (peer.isTop) {
        out = this
      }
      else {
        out = NilVal.make(ctx, 'scalar', this, peer)
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
  NumberVal,
}
