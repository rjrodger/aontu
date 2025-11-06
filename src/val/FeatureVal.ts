/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { BaseVal } from './BaseVal'

import { top } from './top'

abstract class FeatureVal extends BaseVal {
  isFeature = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  superior(): Val {
    return top()
  }

}


export {
  FeatureVal,
}
