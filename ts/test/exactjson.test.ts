/* Copyright (c) 2025 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import { Aontu, exactJSON, Decimal } from '../dist/aontu'


const gen = (src: string) => new Aontu().generate(src)


describe('generate-native-types', () => {

  test('a-biginteger-generates-as-a-native-bigint', () => {
    const out = gen('x:0d5')
    Assert.equal(typeof out.x, 'bigint')
    Assert.equal(out.x, 5n)

    Assert.equal(typeof gen('x:5').x, 'number')
    Assert.equal(exactJSON(gen('x:5')), exactJSON(out))

    const big = gen('x:0d9007199254740993')
    Assert.equal(typeof big.x, 'bigint')
    Assert.equal(big.x, 9007199254740993n)

    Assert.equal(typeof gen('x:-0d5').x, 'bigint')
    Assert.equal(gen('x:-0d5').x, -5n)
  })

  test('a-bigdecimal-generates-as-a-Decimal', () => {
    const out = gen('x:0d0.1')
    Assert.ok(out.x instanceof Decimal)
    Assert.ok(out.x.equals(Decimal.fromString('0.1')))

    const integral = gen('x:0d1e3')
    Assert.ok(integral.x instanceof Decimal)
    Assert.equal(typeof integral.x, 'object')
    Assert.equal(integral.x.toString(), '1000.0')

    // Exact arithmetic reaches generate() as a Decimal too.
    const sum = gen('x:0d0.1+0d0.2')
    Assert.ok(sum.x instanceof Decimal)
    Assert.equal(sum.x.toString(), '0.3')
  })

  test('an-integer-past-the-safe-range-generates-as-a-bigint', () => {
    const big = gen('x:1152921504606846976')
    Assert.equal(typeof big.x, 'bigint')
    Assert.equal(big.x, 1152921504606846976n)
    Assert.equal(exactJSON(big), '{"x":1152921504606846976}')

    Assert.equal(typeof gen('x:-1152921504606846976').x, 'bigint')
    Assert.equal(gen('x:-1152921504606846976').x, -1152921504606846976n)

    // Exact integer arithmetic (D6) is the second route into the window.
    const sum = gen('x:576460752303423488+576460752303423488')
    Assert.equal(typeof sum.x, 'bigint')
    Assert.equal(sum.x, 1152921504606846976n)

    Assert.equal(typeof gen('x:9007199254740991').x, 'number')
    Assert.equal(typeof gen('x:9007199254740992').x, 'bigint')
    Assert.equal(exactJSON(gen('x:9007199254740992')), '{"x":9007199254740992}')

    Assert.equal(typeof gen('x:1e21').x, 'number')
    Assert.equal(exactJSON(gen('x:1e21')), '{"x":1e+21}')
    Assert.equal(typeof gen('x:100000000000000000000').x, 'number')

    Assert.equal(new Aontu().unify('x:1152921504606846976').canon,
      '{"x":1152921504606846976}')
    Assert.equal(new Aontu().unify('x:0d1152921504606846976').canon,
      '{"x":0d1152921504606846976}')
  })

  test('the-ordinary-leaves-are-untouched', () => {
    // A 0d-free document generates exactly what it always did.
    const out = gen('a:1 b:1.5 c:x d:true e:null f:[1,2] g:{h:1}')
    Assert.equal(typeof out.a, 'number')
    Assert.equal(typeof out.b, 'number')
    Assert.equal(typeof out.c, 'string')
    Assert.equal(typeof out.d, 'boolean')
    Assert.equal(out.e, null)
    Assert.ok(Array.isArray(out.f))
    Assert.equal(typeof out.f[0], 'number')
    Assert.equal(typeof out.g, 'object')
  })

  test('exact-types-survive-nesting', () => {
    const out = gen('x:{y:0d7} z:[0d1,0d0.5]')
    Assert.equal(typeof out.x.y, 'bigint')
    Assert.equal(typeof out.z[0], 'bigint')
    Assert.ok(out.z[1] instanceof Decimal)
  })

  test('JSON-stringify-cannot-serialise-the-result', () => {
    Assert.throws(() => JSON.stringify(gen('x:0d5')), TypeError)
    // ...and silently mangles the bigdecimal into an object shape (and
    // then throws on the bigint coefficient inside it).
    Assert.throws(() => JSON.stringify(gen('x:0d0.1')), TypeError)
  })

})


describe('exactjson', () => {

  test('writes-exact-digits-as-raw-json-numbers', () => {
    Assert.equal(exactJSON(gen('x:0d5')), '{"x":5}')
    Assert.equal(exactJSON(gen('x:-0d5')), '{"x":-5}')
    Assert.equal(
      exactJSON(gen('x:0d123456789012345678901234567890')),
      '{"x":123456789012345678901234567890}')
    Assert.equal(
      exactJSON(gen('x:0d9007199254740993')), '{"x":9007199254740993}')

    Assert.equal(exactJSON(gen('x:0d0.1')), '{"x":0.1}')
    Assert.equal(exactJSON(gen('x:0d1e3')), '{"x":1000.0}')
    Assert.equal(exactJSON(gen('x:-0d1.5')), '{"x":-1.5}')

    Assert.equal(exactJSON(gen('x:[0d1,0d2]')), '{"x":[1,2]}')
    Assert.equal(exactJSON(gen('x:{y:0d7}')), '{"x":{"y":7}}')
  })

  test('sorts-object-keys-where-JSON-stringify-would-not', () => {
    const idx: any = { '10': 2, '9': 1 }
    Assert.equal(JSON.stringify(idx), '{"9":1,"10":2}')
    Assert.equal(exactJSON(idx), '{"10":2,"9":1}')        // lexicographic

    // Plain insertion order is sorted too -- same rule, no special case.
    Assert.equal(exactJSON({ b: 1, a: 2 }), '{"a":2,"b":1}')

    Assert.equal(
      JSON.stringify({ '4294967295': 1, '4294967296': 2, '5': 3 }),
      '{"5":3,"4294967295":1,"4294967296":2}')
    Assert.equal(
      exactJSON({ '4294967295': 1, '4294967296': 2, '5': 3 }),
      '{"4294967295":1,"4294967296":2,"5":3}')

    // Nested objects sort at every level.
    Assert.equal(exactJSON({ x: { '9': { b: 1, a: 2 }, '10': 3 } }),
      '{"x":{"10":3,"9":{"a":2,"b":1}}}')

    // Arrays keep their order -- a list is ordered data, not a map.
    Assert.equal(exactJSON([3, 1, 2]), '[3,1,2]')
  })

  test('is-JSON-stringify-byte-for-byte-without-the-exact-leaves', () => {
    const CONTROLS = String.fromCharCode(0, 8, 12, 27, 31)
    const values: any[] = [
      null, true, false, 0, -0, 1, 1.5, 1e21, 1e-7, 1e20, -3,
      '', 'x', 'x y', 'a"b', 'a\\b', 'a\nb\tc', CONTROLS,
      '<b>&</b>', 'café 中文 😀',
      [], {}, [1, 'a', null], { a: 1, b: [2, { c: 'd' }] },
      { '': 1 }, [[[]]], { a: {} }, { a: [] },
    ]
    for (const v of values) {
      for (const indent of [undefined, 0, 2, 4, '\t', '..']) {
        Assert.equal(
          exactJSON(v, indent as any),
          JSON.stringify(v, null, indent as any),
          'mismatch for ' + JSON.stringify(v) + ' @ ' + indent)
      }
    }
  })

  test('indent-is-the-only-difference-between-cli-and-gens', () => {
    const out = gen('x:0d5 y:[0d1,2]')
    Assert.equal(exactJSON(out), '{"x":5,"y":[1,2]}')
    Assert.equal(exactJSON(out, 2), [
      '{',
      '  "x": 5,',
      '  "y": [',
      '    1,',
      '    2',
      '  ]',
      '}',
    ].join('\n'))
    Assert.equal(exactJSON({ a: 1 }, '\t'), '{\n\t"a": 1\n}')
    Assert.equal(exactJSON({ a: 1 }, 99), '{\n' + ' '.repeat(10) + '"a": 1\n}')
    Assert.equal(exactJSON({ a: 1 }, 0), '{"a":1}')
    // Empty containers stay on one line, indent or not.
    Assert.equal(exactJSON({ a: {}, b: [] }, 2),
      '{\n  "a": {},\n  "b": []\n}')
  })

  test('escapes-line-and-paragraph-separators', () => {
    const LS = String.fromCharCode(0x2028)
    const PS = String.fromCharCode(0x2029)
    Assert.equal(exactJSON({ a: 'x' + LS + 'y' }), '{"a":"x\\u2028y"}')
    Assert.equal(exactJSON({ a: 'x' + PS + 'y' }), '{"a":"x\\u2029y"}')
    Assert.equal(exactJSON([LS + PS]), '["\\u2028\\u2029"]')
    Assert.equal(JSON.parse(exactJSON({ a: LS })).a, LS)
    // A key is escaped by the same path as a value.
    Assert.equal(exactJSON({ ['k' + LS]: 1 }), '{"k\\u2028":1}')
    // HTML stays literal, exactly as the gens mode settled.
    Assert.equal(exactJSON({ a: '<b>&</b>' }), '{"a":"<b>&</b>"}')
  })

  test('handles-the-values-JSON-stringify-would-drop', () => {
    // Unlike JSON.stringify this always returns a string, so a caller
    // never has to test for `undefined` before writing the output.
    Assert.equal(exactJSON(undefined), 'null')
    Assert.equal(exactJSON(5n), '5')
    Assert.equal(exactJSON(new Decimal(15n, 1)), '1.5')
    // Non-finite numbers have no JSON form; `null` matches
    // JSON.stringify (and R2 keeps -0 out of generated output anyway).
    Assert.equal(exactJSON({ a: NaN, b: Infinity }), '{"a":null,"b":null}')
    // In an object an undefined member is dropped, in a list it is null.
    Assert.equal(exactJSON({ a: undefined, b: 1 }), '{"b":1}')
    Assert.equal(exactJSON([undefined, 1]), '[null,1]')
  })

  test('refuses-a-cycle-instead-of-looping-forever', () => {
    const cyclic: any = { a: 1 }
    cyclic.self = cyclic
    Assert.throws(() => exactJSON(cyclic), /circular/)
    // A SHARED (but acyclic) subtree is not a cycle and must serialise:
    // unification produces those routinely.
    const shared = { v: 1 }
    Assert.equal(exactJSON({ a: shared, b: shared }),
      '{"a":{"v":1},"b":{"v":1}}')
  })

})
