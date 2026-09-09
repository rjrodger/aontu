/* Copyright (c) 2025 Richard Rodger, MIT License */

// The fold alone (docs/design/RENDER.0.md D9): the arms a spec row
// cannot reach, because `render` hands the fold an instance the
// vocabulary has shaped -- every default filled, every unit a map.
// A caller of `renderValue` may hand it less, and the fold answers
// for what it is given.

import { test, describe } from 'node:test'
import Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { render, renderValue, renderProfile } from '../dist/render'


describe('render-value', () => {

  // The options are optional: `render(src)` alone renders the root
  // under the defaults, which is how an embedder calls it.
  test('render-takes-no-options', () => {
    const report = render('aontu: Code: units: [{ path: "a.txt", lang: "text", decls: [] }]')
    Assert.strictEqual(report.verdict, 'ok')
    Assert.deepStrictEqual(report.units, [{ path: 'a.txt', lang: 'text', text: '' }])
  })

  // A profile document, the same way: `renderProfile(src)` alone, and
  // the answer carries the vocabulary's defaults.
  test('render-profile-takes-no-options-and-fills-the-defaults', () => {
    const loaded = renderProfile('aontu: Profile: lang: "text"')
    Assert.strictEqual(loaded.errors, undefined)
    Assert.strictEqual(loaded.profile.lang, 'text')
    Assert.deepStrictEqual(loaded.profile.indent, { unit: ' ', width: 2 })
    Assert.strictEqual(loaded.profile.lowering, undefined)
    const refused = renderProfile('aontu: Profile: lang: 1')
    Assert.strictEqual(refused.profile, undefined)
    Assert.strictEqual(refused.errors?.[0].path, '$.aontu.Profile.lang')
  })

  test('nothing-to-render', () => {
    Assert.deepStrictEqual(renderValue({}), { verdict: 'ok', units: [], lossy: [] })
    Assert.deepStrictEqual(renderValue(undefined), { verdict: 'ok', units: [], lossy: [] })
  })

  test('sparse-pieces-take-the-vocabulary-defaults', () => {
    const report = renderValue({
      aontu: { Code: {
        units: [{
          path: 'a.txt', lang: 'text',
          decls: [{
            k: 'frag', of: [
              { k: 'line', of: ['x'] },
              { k: 'blank' },
              { k: 'raw', text: 'y\n' },
            ]
          }],
        }],
      } },
    })
    Assert.strictEqual(report.verdict, 'lossy')
    Assert.strictEqual(report.units[0].text, 'x\n\ny\n')
  })


  // THE RENDERER NEVER WRITES (RENDER.0.md D8; docs/trust.md): the
  // library answers bytes, and only the verb's --out places them. A
  // filesystem import here would be the first step of a regression,
  // so the source is read for one. The Go twin scans go/render.go.
  test('render-source-has-no-filesystem-access', () => {
    const src = Fs.readFileSync(
      Path.join(__dirname, '..', 'src', 'render.ts'), 'utf8')
    Assert.doesNotMatch(src, /node:fs|from 'fs'|require\(|writeFileSync|mkdirSync|child_process/)
  })

})
