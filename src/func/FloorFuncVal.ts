/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { FuncValBase } from './FuncValBase'


class FloorFuncVal extends FuncValBase {
  isFloorFuncVal = true

  constructor(
    spec: {
      peg: any
    },
    ctx?: Context
  ) {
    super(spec, ctx)
  }

  unify(peer: Val, ctx?: Context): Val {
    if (this.id === peer.id) {
      return this
    }

    if (this.peg.done) {

    }

    return this
  }

  get canon() {
    return ''
  }
}


export {
  FloorFuncVal,
}
