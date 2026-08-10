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


// Like makeScalar, but for a numeric result that must not narrow the
// kind of the value it was derived from (kind contagion: upper(2) is an
// integer 2, upper(1.1) is a number 2). `like` is the source Val whose
// kind is being carried over; anything that is not integer kind — and
// any result that has left the int64 range — yields a NumberVal.
//
// The two EXACT leaves need no `like`: unlike integer and float, which
// share the JavaScript `number` type and so can only be told apart by
// the value they came from, a bigint is a biginteger and a Decimal is a
// bigdecimal. Carrying the kind is automatic because the exact result
// types ARE the kinds — an exact ceiling of a bigdecimal is a Decimal,
// so upper(0d1.1) is bigdecimal 0d2.0 and upper(0d5) is biginteger 0d5.
//
// makeScalar keeps its own contract (every number becomes a NumberVal)
// for callers that have no kind to preserve.
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
