/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { ScalarVal } from './ScalarVal'


class BooleanVal extends ScalarVal<boolean> {
  isBooleanVal = true

  constructor(
    spec: {
      peg: boolean
    },
    ctx?: Context
  ) {
    super({ peg: spec.peg, type: Boolean }, ctx)
  }
  unify(peer: Val, ctx?: Context): Val {
    return super.unify(peer, ctx)
  }

  // static TRUE = new BooleanVal({ peg: true }, new Context({ vc: 1, root: TOP }))
  // static FALSE = new BooleanVal({ peg: false }, new Context({ vc: 2, root: TOP }))
}


export {
  BooleanVal,
}
