/* Copyright (c) 2025 Richard Rodger, MIT License */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { Lang, PathVal } from '../dist/lang'


const SPEC_DIR = Path.resolve(__dirname, '..', 'test', 'spec')


function loadPathsSpec(filename: string) {
  const content = Fs.readFileSync(Path.join(SPEC_DIR, filename), 'utf8')
  const rows: any[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [input, countStr, canons] = trimmed.split('\t')
    rows.push({
      input,
      count: parseInt(countStr, 10),
      canons: canons ? canons.split(',') : [],
    })
  }
  return rows
}


describe('paths', () => {
  const specs = loadPathsSpec('paths.tsv')

  for (const spec of specs) {
    test(`paths.tsv: ${spec.input}`, () => {
      const lang = new Lang()
      lang.parse(spec.input)

      assert.strictEqual(lang.paths.length, spec.count,
        `path count mismatch for: ${spec.input} ` +
        `(got [${lang.paths.map((p: any) => p.canon)}])`)

      if (spec.canons.length > 0) {
        const actualCanons = lang.paths.map((p: any) => p.canon)
        assert.deepStrictEqual(actualCanons, spec.canons,
          `path canons mismatch for: ${spec.input}`)
      }
    })
  }
})
