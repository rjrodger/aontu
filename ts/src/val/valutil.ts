/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import { AontuError } from '../err'
import { ScalarVal } from './ScalarVal'
import { NumberVal } from './NumberVal'
import { StringVal } from './StringVal'
import { BooleanVal } from './BooleanVal'
import { NullVal } from './NullVal'


// TODO: move to FuncBaseVal
export function makeScalar(scalar: any): ScalarVal {
  const st = typeof scalar
  const spec = { peg: scalar }

  if ('number' === st) {
    return new NumberVal(spec)
  }
  else if ('string' === st) {
    return new StringVal(spec)
  }
  else if ('boolean' === st) {
    return new BooleanVal(spec)
  }
  else if (null === scalar) {
    return new NullVal(spec)
  }
  else {
    throw new AontuError('Not a scalar: ' + scalar)
  }
}
