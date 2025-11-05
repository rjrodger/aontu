/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { BaseVal } from './BaseVal'



abstract class FeatureVal extends BaseVal {
  isFeature = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }

}


export {
  FeatureVal,
}
