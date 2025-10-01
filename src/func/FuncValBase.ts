/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
} from '../type'

import {
  Context,
} from '../unify'

import { ValBase } from '../val/ValBase'


class FuncValBase extends ValBase {
  isFuncVal = true

  constructor(
    spec: {
      peg: any
    },
    ctx?: Context
  ) {
    super(spec, ctx)
  }

}


export {
  FuncValBase,
}
