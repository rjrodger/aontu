/* Copyright (c) 2025 Richard Rodger, MIT License */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { Aontu } from '..'


const SPEC_DIR = Path.resolve(__dirname, '..', 'test', 'spec')


function loadSpec(filename: string): { input: string, parse?: string, unify?: string, gen?: string }[] {
  const content = Fs.readFileSync(Path.join(SPEC_DIR, filename), 'utf8')
  const rows: any[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [input, parse, unify, gen] = trimmed.split('\t')
    rows.push({
      input,
      parse: parse === '~' ? undefined : parse,
      unify: unify === '~' ? undefined : unify,
      gen: gen === '~' ? undefined : gen,
    })
  }
  return rows
}


function runSpec(filename: string) {
  const specs = loadSpec(filename)
  const a = new Aontu()

  for (const spec of specs) {
    test(`${filename}: ${spec.input}`, () => {
      if (spec.parse) {
        const parsed = a.parse(spec.input) as any
        assert.strictEqual(parsed?.canon, spec.parse,
          `parse canon mismatch for: ${spec.input}`)
      }

      if (spec.unify) {
        const unified = a.unify(spec.input)
        assert.strictEqual(unified?.canon, spec.unify,
          `unify canon mismatch for: ${spec.input}`)
      }

      if (spec.gen) {
        const generated = a.generate(spec.input, { errs: [] })
        assert.deepStrictEqual(generated, JSON.parse(spec.gen),
          `gen mismatch for: ${spec.input}`)
      }
    })
  }
}


describe('spread-spec', () => {
  const specFiles = Fs.readdirSync(SPEC_DIR)
    .filter(f => f.endsWith('.tsv'))
    .sort()

  for (const file of specFiles) {
    describe(file.replace('.tsv', ''), () => {
      runSpec(file)
    })
  }
})
