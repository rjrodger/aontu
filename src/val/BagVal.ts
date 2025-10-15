/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'


import { FeatureVal } from './FeatureVal'


abstract class BagVal extends FeatureVal {
  closed: boolean = false
  optionalKeys: string[] = []

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }

}


export {
  BagVal,
}
