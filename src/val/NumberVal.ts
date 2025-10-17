/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'


class NumberVal extends ScalarVal {
  isNumberVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    if (isNaN(spec.peg)) {
      // TODO: use Nil?
      throw new Error('not-number: ' + spec.peg)
    }

    super({ peg: spec.peg, kind: Number }, ctx)
  }

  unify(peer: any, ctx: Context): Val {
    if (null != peer) {
      if (peer.isScalarKindVal && peer.type === Number) {
        return this
      }
      else if (
        peer.isScalar &&
        peer.peg === this.peg
      ) {
        return peer.isIntegerVal ? peer : this
      }
    }

    return super.unify(peer, ctx)
  }
}


export {
  NumberVal,
}
