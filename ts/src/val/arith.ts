/* Copyright (c) 2025 Richard Rodger, MIT License */


import type { Val } from '../type'

import { AontuContext } from '../ctx'
import { makeNilErr } from '../err'

import { IntegerVal } from './IntegerVal'
import { NumberVal } from './NumberVal'
import { BigIntegerVal } from './BigIntegerVal'
import { BigDecimalVal } from './BigDecimalVal'
import { Decimal, decimalOverBudget } from './Decimal'
import { isIntegerStorable } from './numkind'


type ArithOp = 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'rem'

// The three that divide, and therefore the three that can be handed a
// zero divisor and cannot answer over the decimal leaf.
function divides(op: ArithOp): boolean {
  return 'div' === op || 'mod' === op || 'rem' === op
}


// The numeric leaves, told apart by their own flags rather than by the
// JavaScript type of the peg: `integer` and `float` share `number`.
type ArithKind = 'integer' | 'float' | 'biginteger' | 'bigdecimal'

const EXACT_RANK: Record<string, number> = {
  integer: 1,
  biginteger: 2,
  bigdecimal: 3,
}


function isBig(k: ArithKind): boolean {
  return 'biginteger' === k || 'bigdecimal' === k
}


// A pref operand contributes its preferred value, and therefore that
// value's kind too -- the same rule `+` applies.
function unpref(v: any): any {
  while (v?.isPref) {
    v = v.peg
  }
  return v
}


function arithKind(v: any): ArithKind | undefined {
  if (true !== v?.isScalar) {
    return undefined
  }
  if (v.isBigInteger) {
    return 'biginteger'
  }
  if (v.isBigDecimal) {
    return 'bigdecimal'
  }
  if (v.isInteger) {
    return 'integer'
  }
  return 'number' === typeof v.peg ? 'float' : undefined
}


function asInteger(v: any, k: ArithKind): bigint {
  return 'biginteger' === k ? v.peg : BigInt(v.peg)
}


function asDecimal(v: any, k: ArithKind): Decimal {
  return 'bigdecimal' === k ? v.peg : new Decimal(asInteger(v, k), 0)
}


function arith(
  ctx: AontuContext | undefined,
  op: ArithOp,
  node: Val,
  a: Val,
  b: Val,
  attempt?: string
): Val {
  const name = attempt ?? op
  const av: any = unpref(a)
  const bv: any = unpref(b)
  const ak = arithKind(av)
  const bk = arithKind(bv)

  if (undefined === ak || undefined === bk) {
    return makeNilErr(ctx, 'invalid-arg', node, undefined, name)
  }

  // A big leaf never silently becomes a binary float, in EITHER operand
  // order. The error names both leaves in operand order.
  if (('float' === ak && isBig(bk)) || (isBig(ak) && 'float' === bk)) {
    return makeNilErr(ctx, 'exact_float_mix', node, undefined, name,
      { left: ak, right: bk })
  }

  if ('float' === ak || 'float' === bk) {
    return floatArith(ctx, op, name, node, av.peg, bv.peg)
  }

  const rank = EXACT_RANK[bk] < EXACT_RANK[ak] ? EXACT_RANK[ak] : EXACT_RANK[bk]

  if (EXACT_RANK.bigdecimal === rank) {
    return decimalArith(ctx, op, name, node, asDecimal(av, ak), asDecimal(bv, bk))
  }

  return integerArith(ctx, op, name, node, asInteger(av, ak),
    asInteger(bv, bk), EXACT_RANK.biginteger === rank)
}


function floatArith(
  ctx: AontuContext | undefined,
  op: ArithOp,
  name: string,
  node: Val,
  x: number,
  y: number
): Val {
  if (divides(op) && 0 === y) {
    return makeNilErr(ctx, 'divide_by_zero', node, undefined, name)
  }

  const out =
    'add' === op ? x + y :
      'sub' === op ? x - y :
        'mul' === op ? x * y :
          'div' === op ? x / y :
            // Truncated remainder, sign following the DIVIDEND, which is
            // what JavaScript's `%` and Go's math.Mod both give...
            'rem' === op ? x % y :
              flooredMod(x % y, y)

  return Number.isFinite(out) ?
    new NumberVal({ peg: out }) :
    makeNilErr(ctx, 'float_overflow', node, undefined, name)
}


function flooredMod(rem: number, y: number): number {
  return 0 !== rem && (rem < 0) !== (y < 0) ? rem + y : rem
}


// The exact integral leaves. Both compute in bigint, so nothing passes
// through binary64 and nothing rounds; only the storage test at the end
// differs, because `biginteger` is unbounded and `integer` is not.
function integerArith(
  ctx: AontuContext | undefined,
  op: ArithOp,
  name: string,
  node: Val,
  x: bigint,
  y: bigint,
  big: boolean
): Val {
  if (divides(op) && 0n === y) {
    return makeNilErr(ctx, 'divide_by_zero', node, undefined, name)
  }

  const out =
    'add' === op ? x + y :
      'sub' === op ? x - y :
        'mul' === op ? x * y :
          'div' === op ? x / y :
            'rem' === op ? x % y :
              flooredModBig(x % y, y)

  if (big) {
    // Unbounded and exact: nothing to check, and no demotion to
    // `integer` however small the result.
    return new BigIntegerVal({ peg: out })
  }

  return isIntegerStorable(out) ?
    new IntegerVal({ peg: Number(out) }) :
    makeNilErr(ctx, 'inexact_integer_sum', node, undefined, name,
      { sum: out.toString() })
}


function flooredModBig(rem: bigint, y: bigint): bigint {
  return 0n !== rem && (rem < 0n) !== (y < 0n) ? rem + y : rem
}


// The decimal leaf. Addition, subtraction and multiplication are exact
// coefficient arithmetic and land here; division does not, and says so.
function decimalArith(
  ctx: AontuContext | undefined,
  op: ArithOp,
  name: string,
  node: Val,
  x: Decimal,
  y: Decimal
): Val {
  if (divides(op)) {
    return makeNilErr(ctx, 'inexact_divide', node, undefined, name)
  }

  const out =
    'add' === op ? x.add(y) :
      'sub' === op ? x.add(y.negate()) :
        x.multiply(y)

  // The budget applies to RESULTS as well as literals: an exact answer
  // too wide to hold is refused, never rounded to fit.
  return decimalOverBudget(out) ?
    makeNilErr(ctx, 'decimal_budget', node, undefined, name) :
    new BigDecimalVal({ peg: out })
} /* node:coverage ignore next 9 */


export type {
  ArithOp,
}

export {
  arith,
}
