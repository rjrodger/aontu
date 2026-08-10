/* Copyright (c) 2025 Richard Rodger, MIT License */

/*
 * Unit tests for the exact leaves of the number tower: the Decimal value
 * type, the two Vals built on it, and the `0d` literal.
 *
 * The shared, cross-port contract lives in test/spec/number-tower.tsv.
 * What is here is the part a TSV row cannot reach: the TypeScript-side
 * representation (D8), the exact-input constructors, and the value-not-
 * identity comparisons (D2) that a spec row can only observe indirectly.
 */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import { Aontu } from '../dist/aontu'
import {
  DECIMAL_COEFFICIENT_BUDGET,
  DECIMAL_SCALE_BUDGET,
  Decimal,
} from '../dist/val/Decimal'
import { BigDecimalVal } from '../dist/val/BigDecimalVal'
import { BigIntegerVal } from '../dist/val/BigIntegerVal'


const canon = (src: string) => new Aontu().unify(src).canon


describe('decimal', () => {

  test('normalises-at-construction', () => {
    // Scale is presentation, not identity (D4): trailing zeros go...
    Assert.equal(new Decimal(10n, 2).toString(), '0.1')
    Assert.equal(new Decimal(1500n, 3).toString(), '1.5')
    // ...but never below one decimal place, so an integral bigdecimal
    // cannot render as something that reparses as a biginteger.
    Assert.equal(new Decimal(1000n, 0).toString(), '1000.0')
    Assert.equal(new Decimal(1n, -3).toString(), '1000.0')
    Assert.equal(new Decimal(10000n, 1).toString(), '1000.0')
    // Zero has exactly one form, at scale 1 (D5: no negative zero).
    Assert.equal(new Decimal(0n, 7).toString(), '0.0')
    Assert.equal(new Decimal(-0n, 0).toString(), '0.0')
    Assert.equal(new Decimal(0n, -9).scale, 1)
  })

  test('renders-plain-at-every-magnitude', () => {
    Assert.equal(new Decimal(1n, 1).toString(), '0.1')
    Assert.equal(new Decimal(1n, 9).toString(), '0.000000001')
    Assert.equal(new Decimal(-15n, 1).toString(), '-1.5')
    Assert.equal(new Decimal(-1n, 3).toString(), '-0.001')
    // Sign before the marker: `0d-1.5` is not a literal, so canon must
    // not produce it.
    Assert.equal(new Decimal(-15n, 1).canon(), '-0d1.5')
    Assert.equal(new Decimal(15n, 1).canon(), '0d1.5')
  })

  test('equals-and-compares-by-value', () => {
    Assert.ok(new Decimal(10n, 2).equals(new Decimal(1n, 1)))
    Assert.ok(!new Decimal(15n, 1).equals(new Decimal(16n, 1)))
    // Distinct objects, one value: `===` would say no.
    Assert.ok(new Decimal(1n, 1) !== new Decimal(1n, 1))
    Assert.ok(new Decimal(1n, 1).equals(new Decimal(1n, 1)))

    Assert.equal(new Decimal(1n, 1).compare(new Decimal(2n, 1)), -1)
    Assert.equal(new Decimal(2n, 1).compare(new Decimal(1n, 1)), 1)
    Assert.equal(new Decimal(1n, 1).compare(new Decimal(100n, 3)), 0)
    // Different scales, so the comparison must align them exactly.
    Assert.equal(new Decimal(1n, 0).compare(new Decimal(999n, 3)), 1)
    Assert.equal(new Decimal(-15n, 1).compare(new Decimal(15n, 1)), -1)
  })

  test('negates-exactly-and-folds-negative-zero', () => {
    Assert.equal(new Decimal(15n, 1).negate().toString(), '-1.5')
    Assert.equal(new Decimal(-15n, 1).negate().toString(), '1.5')
    Assert.equal(new Decimal(0n, 1).negate().toString(), '0.0')
  })

  test('fromString-is-an-exact-input-constructor', () => {
    Assert.equal(Decimal.fromString('1.5').canon(), '0d1.5')
    Assert.equal(Decimal.fromString('0d1.5').canon(), '0d1.5')
    Assert.equal(Decimal.fromString('-0d0.10').canon(), '-0d0.1')
    Assert.equal(Decimal.fromString('1e3').canon(), '0d1000.0')
    Assert.equal(Decimal.fromString('1e-1').canon(), '0d0.1')
    // Beyond binary64's exact reach, and exact anyway.
    Assert.equal(
      Decimal.fromString('9007199254740993.5').canon(),
      '0d9007199254740993.5')
    Assert.throws(() => Decimal.fromString('1.5.6'))
    Assert.throws(() => Decimal.fromString('0d.5'))
    Assert.throws(() => Decimal.fromString('1_000'))
  })

})


describe('bignum-vals', () => {

  test('exact-input-constructors', () => {
    // D8: a bigint or text, never a JS number -- binary64 has already
    // rounded a number argument before this library could inspect it.
    Assert.equal(new BigIntegerVal({ peg: 5n }).canon, '0d5')
    Assert.equal(new BigIntegerVal({ peg: -5n }).canon, '-0d5')
    Assert.equal(
      new BigIntegerVal({ peg: '9007199254740993' }).canon,
      '0d9007199254740993')
    Assert.throws(() => new BigIntegerVal({ peg: 5 }), /not-biginteger/)
    Assert.throws(() => new BigIntegerVal({ peg: '5.5' }), /not-biginteger/)

    Assert.equal(new BigDecimalVal({ peg: new Decimal(15n, 1) }).canon, '0d1.5')
    Assert.equal(new BigDecimalVal({ peg: '0.10' }).canon, '0d0.1')
    Assert.throws(() => new BigDecimalVal({ peg: 1.5 }), /not-bigdecimal/)
    Assert.throws(() => new BigDecimalVal({ peg: 'q' }), /not-bigdecimal/)
  })

  test('same-compares-value-not-object', () => {
    // D2's Go hazard, in its TypeScript form: a Decimal peg is an
    // OBJECT, so `peer.peg === this.peg` is object identity and would
    // make `0d0.10 & 0d0.1` fail while `0d1.5 & 0d1.5` accidentally
    // worked (or not) depending on allocation.
    const a = new BigDecimalVal({ peg: new Decimal(10n, 2) })
    const b = new BigDecimalVal({ peg: new Decimal(1n, 1) })
    Assert.ok(a.peg !== b.peg)
    Assert.ok(a.same(b))
    Assert.ok(!a.same(new BigDecimalVal({ peg: new Decimal(2n, 1) })))

    // A bigint peg needs no help: `===` on two bigints is value
    // equality even for values far outside binary64.
    const big = '123456789012345678901234567890'
    Assert.ok(new BigIntegerVal({ peg: big })
      .same(new BigIntegerVal({ peg: big })))
    Assert.ok(!new BigIntegerVal({ peg: big })
      .same(new BigIntegerVal({ peg: big + '1' })))

    // Never across leaves, however equal the numbers look.
    Assert.ok(!new BigIntegerVal({ peg: 1n })
      .same(new BigDecimalVal({ peg: '1.0' })))
  })

})


describe('bignum-literal', () => {

  test('leaf-by-source', () => {
    // Digits only is a biginteger; a `.` or an exponent anywhere makes
    // it a bigdecimal, even when the VALUE is integral.
    Assert.equal(canon('x:0d5'), '{"x":0d5}')
    Assert.equal(canon('x:0d1e3'), '{"x":0d1000.0}')
    Assert.equal(canon('x:0d1.5e2'), '{"x":0d150.0}')
    Assert.equal(canon('x:0D12'), '{"x":0d12}')
    // Separators are legal only BETWEEN digits, as for ordinary numbers.
    Assert.equal(canon('x:0d1_000'), '{"x":0d1000}')
    Assert.equal(canon('x:0d1_0.0_1'), '{"x":0d10.01}')
  })

  test('sign-is-the-unary-prefix', () => {
    // D3 accepts `-0d5` and refuses `0d-5`. The sign is the existing
    // unary-minus operator, so the literal itself never carries one --
    // which is what keeps `0d1 +0d2` an addition rather than an
    // implicit list of `0d1` and a signed literal.
    Assert.equal(canon('x:-0d5'), '{"x":-0d5}')
    Assert.equal(canon('x:-0d1.5'), '{"x":-0d1.5}')
    Assert.equal(canon('x:-0d0'), '{"x":0d0}')
    Assert.equal(canon('x:-0d0.0'), '{"x":0d0.0}')
    Assert.throws(() => canon('x:0d-5'))
  })

  test('a-bare-0d-is-not-an-exact-leaf', () => {
    Assert.equal(canon('x:0d'), '{"x":"0d"}')
    Assert.equal(canon('x:"0d5"'), '{"x":"0d5"}')
    Assert.equal(canon('x:0d5.0'), '{"x":0d5.0}')
  })

  test('budget-is-enforced-on-the-exact-input-api-too', () => {
    // The literal path and the exact-input API (D8) must obey the SAME
    // bound. They did not: Decimal.fromString normalised first, so
    // `1e200000` quietly built a 200,002-digit coefficient and
    // `1e1000000000` would have exhausted memory -- through the very
    // API the design offers as the exact route. The Go port bounds
    // this path already (NewBigDecimal shares the literal checker), so
    // the gap was a cross-port divergence as well as a hazard.
    Assert.throws(() => Decimal.fromString('1e1000000000'),
      /decimal-budget/)
    Assert.throws(() => Decimal.fromString('1e200000'), /decimal-budget/)
    Assert.throws(
      () => Decimal.fromString('1.' + '2'.repeat(DECIMAL_COEFFICIENT_BUDGET)),
      /decimal-budget/)

    // And through the Val constructor that accepts text.
    Assert.throws(() => new BigDecimalVal({ peg: '1e1000000000' }),
      /not-bigdecimal/)

    // At the limit it is still a value, so the bound is inclusive here
    // exactly as it is for a literal.
    Assert.equal(
      Decimal.fromString('1e-' + DECIMAL_SCALE_BUDGET).scale,
      DECIMAL_SCALE_BUDGET)
  })


  test('budget-is-enforced-at-parse', () => {
    // The scale bound is the load-bearing half: this coefficient is ONE
    // digit, so a coefficient-only check never fires, yet plain-form
    // rendering would have to materialise a gigabyte of zeros.
    Assert.throws(() => new Aontu().generate('x:0d1e1000000000'),
      /exceeds the exactness budget/)
    Assert.throws(() => new Aontu().generate('x:0d1e-1000000000'),
      /exceeds the exactness budget/)
    // An exponent too long to be a number at all is still refused, and
    // still refused without building anything.
    Assert.throws(() => new Aontu().generate('x:0d1e' + '9'.repeat(4000)),
      /exceeds the exactness budget/)
    // The coefficient bound, at one digit over.
    Assert.throws(
      () => new Aontu().generate(
        'x:0d1.' + '2'.repeat(DECIMAL_COEFFICIENT_BUDGET)),
      /exceeds the exactness budget/)

    // Both bounds are inclusive, and a literal at the limit is a value.
    Assert.equal(
      canon('x:0d1e-' + DECIMAL_SCALE_BUDGET),
      '{"x":0d0.' + '0'.repeat(DECIMAL_SCALE_BUDGET - 1) + '1}')
    Assert.equal(
      canon('x:0d1e-' + (DECIMAL_SCALE_BUDGET + 1)), '{"x":nil}')

    // A biginteger has no coefficient budget: it is bounded by the
    // source it is written in, and cannot blow up from a short literal.
    Assert.equal(
      canon('x:0d' + '9'.repeat(5000)),
      '{"x":0d' + '9'.repeat(5000) + '}')
  })

})
