/* Copyright (c) 2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'
import { Null } from './ScalarKindVal'


class NullVal extends ScalarVal {
  isNullVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super({ peg: spec.peg, kind: Null }, ctx)
    this.peg = null
  }


  unify(peer: Val, ctx?: Context): Val {
    return super.unify(peer, ctx)
  }
}


export {
  NullVal,
}

