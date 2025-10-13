/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'


class StringVal extends ScalarVal {
  isStringVal = true

  constructor(
    spec: {
      peg: string
    },
    ctx?: Context
  ) {
    super({ peg: spec.peg, kind: String }, ctx)
  }

  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }

  get canon() {
    return JSON.stringify(this.peg)
  }

}


export {
  StringVal,
}
