/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'
import { Integer } from './ScalarKindVal'


class IntegerVal extends ScalarVal {
  isIntegerVal = true

  constructor(
    spec: {
      peg: number
    },
    ctx?: Context
  ) {
    if (!Number.isInteger(spec.peg)) {
      // TODO: use Nil?
      throw new Error('not-integer: ' + spec.peg)
    }
    super({ peg: spec.peg, kind: Integer }, ctx)
  }

  unify(peer: any, ctx: Context): Val {
    if (null != peer) {
      if (peer.isScalarKind && (peer.peg === Number || peer.peg === Integer)) {
        return this
      }
      else if (
        peer.isScalar &&
        peer.peg === this.peg
      ) {
        return this
      }
    }

    return super.unify(peer, ctx)
  }
}


export {
  IntegerVal,
}
