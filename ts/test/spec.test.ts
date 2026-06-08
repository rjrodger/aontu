/* Copyright (c) 2025 Richard Rodger, MIT License */

/*
 * Shared, data-driven conformance tests.
 *
 * The test cases live in the top-level `test/spec/*.tsv` files and are
 * the single source of truth shared with the Go port (see
 * `go/spec_test.go`). Both implementations load the same TSV rows and
 * must produce identical results.
 *
 * TSV columns (tab-separated): name <TAB> mode <TAB> src <TAB> expect
 *   mode=canon : unify(src).canon must equal expect
 *   mode=gen   : generate(src) must deep-equal JSON.parse(expect)
 *   mode=err   : generate(src) must throw, message must contain expect
 * Escapes in src/expect: \n -> newline, \t -> tab, \\ -> backslash.
 */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { Aontu } from '../dist/aontu'


// test/spec lives at the repo root, two levels up from ts/dist-test.
const SPEC_DIR = Path.join(__dirname, '..', '..', 'test', 'spec')


type Row = {
  file: string
  name: string
  mode: string
  src: string
  expect: string
}


function unescape(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if ('\\' === c && i + 1 < s.length) {
      const n = s[++i]
      out += 'n' === n ? '\n' : 't' === n ? '\t' : n
    }
    else {
      out += c
    }
  }
  return out
}


function loadRows(): Row[] {
  const rows: Row[] = []
  const files = Fs.readdirSync(SPEC_DIR)
    .filter((f) => f.endsWith('.tsv'))
    .sort()

  for (const file of files) {
    const text = Fs.readFileSync(Path.join(SPEC_DIR, file), 'utf8')
    for (const line of text.split('\n')) {
      if ('' === line || line.startsWith('#')) {
        continue
      }
      const parts = line.split('\t')
      if (parts.length < 4) {
        continue
      }
      rows.push({
        file,
        name: parts[0],
        mode: parts[1],
        src: unescape(parts[2]),
        expect: unescape(parts[3]),
      })
    }
  }

  return rows
}


describe('spec', () => {
  const rows = loadRows()

  // Sanity: ensure the shared spec files were actually found.
  test('spec-files-present', () => {
    Assert.ok(0 < rows.length, 'no spec rows loaded from ' + SPEC_DIR)
  })

  for (const row of rows) {
    test(`${row.file}:${row.name}`, () => {
      const a0 = new Aontu()

      if ('canon' === row.mode) {
        Assert.strictEqual(a0.unify(row.src).canon, row.expect)
      }
      else if ('gen' === row.mode) {
        Assert.deepStrictEqual(a0.generate(row.src), JSON.parse(row.expect))
      }
      else if ('err' === row.mode) {
        Assert.throws(
          () => a0.generate(row.src),
          (err: any) => {
            const msg = String(err && err.message)
            Assert.ok(
              msg.includes(row.expect),
              `expected error containing "${row.expect}", got: ${msg}`
            )
            return true
          }
        )
      }
      else {
        throw new Error('unknown spec mode: ' + row.mode)
      }
    })
  }
})
