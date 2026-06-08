/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { ScalarVal } from './ScalarVal'


class StringVal extends ScalarVal {
  isString = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super({ peg: spec.peg, kind: String }, ctx)
  }

  unify(peer: Val, ctx: AontuContext): Val {
    return super.unify(peer, ctx)
  }

  get canon() {
    return JSON.stringify(this.peg)
  }

}

export {
  StringVal,
}
