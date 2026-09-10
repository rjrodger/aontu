/* Copyright (c) 2025 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import Assert from 'node:assert'

import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { normaliseRe } from '../dist/val/ConstraintVal'


const CORPUS = Path.join(
  __dirname, '..', '..', 'test', 'spec', 'files', 'regex-corpus.tsv')


type Row = { pattern: string, verdict: string, line: number }


function loadCorpus(): Row[] {
  const rows: Row[] = []
  const text = Fs.readFileSync(CORPUS, 'utf8')
    .replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  let line = 0
  for (const raw of text.split('\n')) {
    line++
    if ('' === raw || raw.startsWith('#')) {
      continue
    }
    const tab = raw.indexOf('\t')
    rows.push({ pattern: raw.slice(0, tab), verdict: raw.slice(tab + 1), line })
  }
  return rows
}


describe('regex-corpus', () => {

  const rows = loadCorpus()

  test('corpus-is-loaded', () => {
    // A guard on the guard: an empty or truncated corpus would make
    // every assertion below vacuous while still reporting green.
    Assert.ok(300 < rows.length, 'corpus too small: ' + rows.length)
    Assert.ok(rows.some((r) => r.verdict.startsWith('!')),
      'corpus has no refusals — it would not exercise the subset bounds')
    Assert.ok(rows.some((r) => !r.verdict.startsWith('!')),
      'corpus has no acceptances')
  })


  test('verdict-parity', () => {
    for (const row of rows) {
      const [norm, why] = normaliseRe(row.pattern)
      const got = '' === why ? norm : '!' + why
      Assert.equal(got, row.verdict,
        'regex-corpus.tsv line ' + row.line + ': ' + JSON.stringify(row.pattern))
    }
  })


  test('accepted-patterns-compile', () => {
    for (const row of rows) {
      if (row.verdict.startsWith('!')) {
        continue
      }
      // The `u` flag is part of the contract, not the test: it is what
      // makes JavaScript match code points as RE2 does.
      Assert.doesNotThrow(() => new RegExp(row.verdict, 'u'),
        'normalised form does not compile, line ' + row.line + ': ' +
        JSON.stringify(row.verdict))
    }
  })


  test('normalisation-is-idempotent', () => {
    for (const row of rows) {
      if (row.verdict.startsWith('!')) {
        continue
      }
      const [again, why] = normaliseRe(row.verdict)
      Assert.equal(why, '',
        'normalised form is refused on re-normalisation, line ' + row.line +
        ': ' + JSON.stringify(row.verdict) + ' -> ' + why)
      Assert.equal(again, row.verdict,
        'normalisation is not idempotent, line ' + row.line)
    }
  })


  test('a-long-repeat-bound-is-refused', () => {
    for (const n of [1000, 100000]) {
      const [, why] = normaliseRe('x{' + '1'.repeat(n) + '}')
      Assert.match(why, /repeat count above/, n + ' digits: ' + why)
    }

    const [, comma] = normaliseRe('x{2,' + '9'.repeat(100000) + '}')
    Assert.match(comma, /repeat count above/)

    // A long run of LEADING ZEROS is a small number, not an over-cap
    // one.
    const zeros = 'x{' + '0'.repeat(100000) + '5}'
    const [out, why] = normaliseRe(zeros)
    Assert.equal(why, '')
    Assert.equal(out, zeros)
  })

})
