/* Copyright (c) 2025 Richard Rodger, MIT License */


import { test, describe } from 'node:test'
import Assert from 'node:assert'

import { Aontu } from '../dist/aontu'
import { renderValue } from '../dist/render'
import {
  splitWords, caseName, quote, literal, typeExpr,
} from '../dist/lower'


function ctx(family: string, profile: any): any {
  return { profile: { lang: family, ...profile }, family, unit: 'u', lossy: [] }
}


describe('lower', () => {

  test('words-split-at-the-ascii-boundaries-and-non-ascii-rides', () => {
    Assert.deepStrictEqual(splitWords('HTTPServer2Go'), ['HTTP', 'Server', '2', 'Go'])
    Assert.deepStrictEqual(splitWords('utf8_string-value'), ['utf', '8', 'string', 'value'])
    Assert.deepStrictEqual(splitWords('naïveName'), ['naïve', 'Name'])
    Assert.deepStrictEqual(splitWords('a b'), ['a', 'b'])
    Assert.deepStrictEqual(splitWords('__'), [])
    // A code point at or above U+0080 is never split and never
    // converted: it rides into its word, whatever the style.
    Assert.strictEqual(caseName('crème_brûlée', 'pascal', []), 'CrèmeBrûlée')
    Assert.strictEqual(caseName('über2Go', 'snake', []), 'über_2_go')
    Assert.strictEqual(caseName('a-b c', 'kebab', []), 'a-b-c')
    Assert.strictEqual(caseName('a-b c', 'screaming', []), 'A_B_C')
    Assert.strictEqual(caseName('ledgerId', 'camel', ['ID']), 'ledgerID')
    Assert.strictEqual(caseName('id', 'camel', ['ID']), 'id')
    Assert.strictEqual(caseName('__', 'pascal', []), '__')
    Assert.strictEqual(caseName('AsIs_x', 'as-is', []), 'AsIs_x')
  })

  test('quote-follows-the-profile-quote-and-table', () => {
    const profile = { str: { quote: "'", escape: { '10': '\\n' } } }
    Assert.strictEqual(quote('it\'s "x"\n', profile),
      "'it\\u0027s \"x\"\\n\\u0002'")
    // No str at all: the double quote, and a bare table.
    Assert.strictEqual(quote('a"b\\c', {}), '"a\\u0022b\\u005cc"')
  })

  test('literals-spell-as-the-family-does', () => {
    const go = ctx('go', {})
    const ts = ctx('typescript', {})
    Assert.strictEqual(literal(1.5, go), '1.5')
    Assert.strictEqual(literal(null, go), 'nil')
    Assert.strictEqual(literal(null, ts), 'null')
    Assert.strictEqual(literal(false, ts), 'false')
    Assert.strictEqual(literal('s', ts), '"s"')
  })

  test('a-literal-set-in-go-takes-the-shared-primitive', () => {
    const go = ctx('go', {})
    const prim = (of: any[]) => typeExpr({ k: 'lit', of }, go, '$').text
    Assert.strictEqual(prim([1.5, 2]), 'float')
    Assert.strictEqual(prim([1, 2]), 'int')
    Assert.strictEqual(prim([true]), 'bool')
    Assert.strictEqual(prim([null]), 'null')
    Assert.strictEqual(prim(['a', 1]), 'any')
    Assert.strictEqual(go.lossy.length, 5)
  })

  test('a-profile-without-type-forms-falls-back-to-the-names', () => {
    // A supplied profile may name a lowering and no forms: the
    // primitive is its own name, and a form is open-less and close-less.
    const ts = ctx('typescript', {})
    Assert.strictEqual(typeExpr({ k: 'prim', prim: 'int' }, ts, '$').text, 'int')
    Assert.strictEqual(typeExpr(
      { k: 'list', of: { k: 'prim', prim: 'int' } }, ts, '$').text, 'int')
    Assert.strictEqual(typeExpr(
      { k: 'map', key: { k: 'prim', prim: 'string' }, of: { k: 'prim', prim: 'int' } },
      ts, '$').text, 'string, int')
    Assert.strictEqual(typeExpr(
      { k: 'union', of: [{ k: 'prim', prim: 'a' }, { k: 'prim', prim: 'b' }] },
      ts, '$').text, 'a | b')
  })

  test('the-paren-rule-puts-a-lower-precedence-inner-in-parens', () => {
    // The vocabulary keeps a container to leaves, so a list of a
    // nullable reaches the fold only through renderValue -- where the
    // TypeScript forms say (string | null)[] and not string | null[].
    const profile = new Aontu().generate('@"aontu:render/lang/typescript"').aontu.profile
    const report = renderValue({
      aontu: { Code: {
        units: [{
          path: 'a.ts', lang: 'typescript',
          decls: [{
            k: 'record', name: 'T', open: false, check: [], fields: [{
              name: 'a', optional: false,
              type: { k: 'list', of: { k: 'opt', of: { k: 'prim', prim: 'string' } } },
            }],
          }],
        }],
      },
    } }, { profiles: [profile] })
    Assert.strictEqual(report.verdict, 'ok')
    Assert.strictEqual(report.units[0].text,
      'export interface T {\n  a: (string | null)[];\n}\n')
  })

  test('a-body-piece-without-a-depth-nests-as-depth-zero-does', () => {
    const profile = new Aontu().generate('@"aontu:render/lang/typescript"').aontu.profile
    const unit = (piece: any) => ({
      aontu: { Code: {
        units: [{
          path: 'a.ts', lang: 'typescript',
          decls: [{
            k: 'func', name: 'f', params: [],
            body: { k: 'frag', of: [piece, { k: 'blank' }, 'done()'] },
          }],
        }],
      } },
    })
    const bare = renderValue(unit({ k: 'line', of: ['go()'] }), { profiles: [profile] })
    const at0 = renderValue(unit({ k: 'line', at: 0, of: ['go()'] }), { profiles: [profile] })
    Assert.strictEqual(bare.verdict, at0.verdict)
    Assert.strictEqual(bare.units.length, 1)
    Assert.strictEqual(bare.units[0].text, at0.units[0].text)
    Assert.ok(bare.units[0].text.includes('\n  go()\n\n  done()\n'))
  })
})
