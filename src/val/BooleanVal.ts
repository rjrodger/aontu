/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'

class BooleanVal extends ScalarVal {
  isBoolean = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super({ peg: spec.peg, kind: Boolean }, ctx)
  }

  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }
}


export {
  BooleanVal,
}
