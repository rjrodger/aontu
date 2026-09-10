/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import { AontuError } from '../err'
import { ScalarVal } from './ScalarVal'
import { NumberVal } from './NumberVal'
import { IntegerVal } from './IntegerVal'
import { StringVal } from './StringVal'
import { BooleanVal } from './BooleanVal'
import { NullVal } from './NullVal'
import { BigIntegerVal } from './BigIntegerVal'
import { BigDecimalVal } from './BigDecimalVal'
import { Decimal } from './Decimal'
import { isIntegerKind } from './numkind'


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


export function makeScalarLike(scalar: any, like: any): ScalarVal {
  if ('bigint' === typeof scalar) {
    return new BigIntegerVal({ peg: scalar })
  }
  if (scalar instanceof Decimal) {
    return new BigDecimalVal({ peg: scalar })
  }
  if ('number' === typeof scalar &&
    true === like?.isInteger &&
    isIntegerKind(scalar)) {
    return new IntegerVal({ peg: scalar })
  }
  return makeScalar(scalar)
}
