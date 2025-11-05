/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { FeatureVal } from './FeatureVal'


abstract class BagVal extends FeatureVal {
  isBag = true

  closed: boolean = false
  optionalKeys: string[] = []

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }
}


export {
  BagVal,
}
