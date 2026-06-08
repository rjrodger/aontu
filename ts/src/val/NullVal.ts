/* Copyright (c) 2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { ScalarVal } from './ScalarVal'
import { Null } from './ScalarKindVal'


class NullVal extends ScalarVal {
  isNull = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super({ peg: spec.peg, kind: Null }, ctx)
    this.peg = null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    return super.unify(peer, ctx)
  }
}


export {
  NullVal,
}

