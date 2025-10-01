/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'


class NumberVal extends ScalarVal<number> {
  isNumberVal = true

  constructor(
    spec: {
      peg: number
    },
    ctx?: Context
  ) {
    super({ peg: spec.peg, type: Number }, ctx)
  }

  unify(peer: any, ctx?: Context): Val {
    if (null != peer) {
      if (peer.isScalarTypeVal && peer.type === Number) {
        return this
      }
      else if (
        peer.isScalarVal &&
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
