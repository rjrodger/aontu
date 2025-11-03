/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import { ScalarVal } from './ScalarVal'
import { NumberVal } from './NumberVal'
import { StringVal } from './StringVal'
import { BooleanVal } from './BooleanVal'
import { NullVal } from './NullVal'
import { TopVal } from './TopVal'



const TOP = new TopVal({})


export function top(): TopVal {
  return TOP
}



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
    throw new Error('Not a scalar: ' + scalar)
  }
}
