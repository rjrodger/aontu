/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'


import { BaseVal } from './BaseVal'



abstract class FeatureVal extends BaseVal {
  isFeature = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }

}


export {
  FeatureVal,
}
