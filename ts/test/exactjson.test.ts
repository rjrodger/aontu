/* Copyright (c) 2025 Richard Rodger, MIT License */

/*
 * D9 -- the generate contract, from the TypeScript side.
 *
 * Two things are pinned here that no shared TSV row can reach:
 *
 *   1. THE RUNTIME TYPES generate() returns. Byte-exact serialisation
 *      cannot see them: an integral bigdecimal (`0d1e3`) and a
 *      biginteger serialise to DIFFERENT text, but a biginteger and an
 *      ordinary integer serialise to the SAME text while generate()
 *      returned the wrong object. Canon pins the AST kind, the `gens`
 *      rows pin the bytes, and only these assertions pin the object.
 *      go/generate_test.go is the mirror on the Go side.
 *
 *   2. THE EMITTER ITSELF -- `exactJSON`, the public export the CLI and
 *      the spec runner's `gens` mode both go through. Its Go
 *      counterpart is `json.Encoder` with `SetEscapeHTML(false)` (see
 *      specGens in go/spec_test.go), so the anchor test below asserts
 *      that on everything WITHOUT an exact leaf the emitter is
 *      byte-identical to JSON.stringify -- which is what the `gens`
 *      mode already settled the two ports on.
 */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import { Aontu, exactJSON, Decimal } from '../dist/aontu'


const gen = (src: string) => new Aontu().generate(src)


describe('generate-native-types', () => {

  test('a-biginteger-generates-as-a-native-bigint', () => {
    const out = gen('x:0d5')
    Assert.equal(typeof out.x, 'bigint')
    Assert.equal(out.x, 5n)

    // The case the bytes cannot distinguish: an ordinary integer and a
    // biginteger of the same value both serialise as `5`, so only the
    // runtime type separates them.
    Assert.equal(typeof gen('x:5').x, 'number')
    Assert.equal(exactJSON(gen('x:5')), exactJSON(out))

    // Exact past binary64 -- the reason the leaf exists. As a plain
    // `number` this would have been 9007199254740992.
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

    // An INTEGRAL bigdecimal is still a Decimal, never a bigint and
    // never a number: `0d1e3` is a bigdecimal by source (D3) and the
    // leaves are disjoint (D2).
    const integral = gen('x:0d1e3')
    Assert.ok(integral.x instanceof Decimal)
    Assert.equal(typeof integral.x, 'object')
    Assert.equal(integral.x.toString(), '1000.0')

    // Exact arithmetic reaches generate() as a Decimal too.
    const sum = gen('x:0d0.1+0d0.2')
    Assert.ok(sum.x instanceof Decimal)
    Assert.equal(sum.x.toString(), '0.3')
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
    // The reason exactJSON exists, asserted rather than asserted about:
    // the standard serialiser THROWS on the biginteger leaf...
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

    // Plain digits, no `0d` marker -- that is canon's business, not
    // JSON's -- but an integral bigdecimal keeps its `.0` so the JSON
    // still shows a decimal.
    Assert.equal(exactJSON(gen('x:0d0.1')), '{"x":0.1}')
    Assert.equal(exactJSON(gen('x:0d1e3')), '{"x":1000.0}')
    Assert.equal(exactJSON(gen('x:-0d1.5')), '{"x":-1.5}')

    Assert.equal(exactJSON(gen('x:[0d1,0d2]')), '{"x":[1,2]}')
    Assert.equal(exactJSON(gen('x:{y:0d7}')), '{"x":{"y":7}}')
  })

  test('is-JSON-stringify-byte-for-byte-without-the-exact-leaves', () => {
    // The Go-parity anchor. Go's encoder (HTML escaping OFF) was
    // aligned with JSON.stringify when the `gens` mode landed, so
    // agreeing with JSON.stringify here is how this emitter stays
    // aligned with Go for everything the exact leaves did not add.
    // Control characters, written by code point so the source file
    // carries no invisible bytes: NUL, backspace, formfeed, escape,
    // unit separator. JS and Go both shorthand \b and \f and both
    // write \u00xx for the rest.
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
    // JSON.stringify's `space` semantics: a string indent, and a number
    // clamped to ten spaces.
    Assert.equal(exactJSON({ a: 1 }, '\t'), '{\n\t"a": 1\n}')
    Assert.equal(exactJSON({ a: 1 }, 99), '{\n' + ' '.repeat(10) + '"a": 1\n}')
    Assert.equal(exactJSON({ a: 1 }, 0), '{"a":1}')
    // Empty containers stay on one line, indent or not.
    Assert.equal(exactJSON({ a: {}, b: [] }, 2),
      '{\n  "a": {},\n  "b": []\n}')
  })

  test('escapes-line-and-paragraph-separators', () => {
    // The one place JS and Go's encoder disagree by default: Go escapes
    // U+2028/U+2029, JS leaves them literal. Byte parity wins, and the
    // escaped form is still legal JSON that decodes to the same string.
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
