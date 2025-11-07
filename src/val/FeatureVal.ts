/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { Val } from './Val'

import { top } from './top'

abstract class FeatureVal extends Val {
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
