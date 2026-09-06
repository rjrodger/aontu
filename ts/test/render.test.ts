/* Copyright (c) 2025 Richard Rodger, MIT License */

// The fold alone (docs/design/RENDER.0.md D9): the arms a spec row
// cannot reach, because `render` hands the fold an instance the
// vocabulary has shaped -- every default filled, every unit a map.
// A caller of `renderValue` may hand it less, and the fold answers
// for what it is given.

import { test, describe } from 'node:test'
import Assert from 'node:assert'

import { renderValue } from '../dist/render'


describe('render-value', () => {

  test('nothing-to-render', () => {
    Assert.deepStrictEqual(renderValue({}), { verdict: 'ok', units: [], lossy: [] })
    Assert.deepStrictEqual(renderValue(undefined), { verdict: 'ok', units: [], lossy: [] })
  })

  test('sparse-pieces-take-the-vocabulary-defaults', () => {
    const report = renderValue({
      code: {
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
      },
    })
    Assert.strictEqual(report.verdict, 'lossy')
    Assert.strictEqual(report.units[0].text, 'x\n\ny\n')
  })

})
