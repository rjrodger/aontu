/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'
import { Integer } from './ScalarKindVal'


class IntegerVal extends ScalarVal<number> {
  isIntegerVal = true

  constructor(
    spec: {
      peg: number
    },
    ctx?: Context
  ) {
    if (!Number.isInteger(spec.peg)) {
      // TODO: use Nil?
      throw new Error('not-integer')
    }
    super({ peg: spec.peg, kind: Integer }, ctx)
  }

  unify(peer: any, ctx?: Context): Val {
    if (null != peer) {
      if (peer.isScalarTypeVal && (peer.peg === Number || peer.peg === Integer)) {
        return this
      }
      else if (
        peer.isScalarVal &&
        // peer.type === Number &&
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
