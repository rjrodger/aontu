/* Copyright (c) 2025 Richard Rodger, MIT License */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import { execFileSync } from 'node:child_process'
import * as Path from 'node:path'

import { Aontu } from '../dist/aontu'
import { evalSource } from '../dist/cli'


const CLI = Path.join(__dirname, '..', 'dist', 'cli.js')


function run(args: string[], input?: string): { out: string; code: number } {
  try {
    const out = execFileSync('node', [CLI, ...args], {
      input: input ?? '',
      encoding: 'utf8',
    })
    return { out, code: 0 }
  }
  catch (err: any) {
    // execFileSync throws on non-zero exit; capture stdout/stderr + code.
    return { out: (err.stdout ?? '') + (err.stderr ?? ''), code: err.status ?? 1 }
  }
}


describe('cli', () => {

  // --- unit: evalSource is the pure core the CLI renders with ---

  test('eval-json', () => {
    const r = evalSource(new Aontu(), 'a:1 b:$.a', 'json')
    Assert.equal(r.ok, true)
    Assert.deepEqual(JSON.parse(r.text), { a: 1, b: 1 })
  })

  test('eval-canon', () => {
    const r = evalSource(new Aontu(), 'a:*1|number', 'canon')
    Assert.equal(r.ok, true)
    Assert.equal(r.text, '{"a":*1|number}')
  })

  test('eval-error', () => {
    const r = evalSource(new Aontu(), 'a:1 a:2', 'json')
    Assert.equal(r.ok, false)
    Assert.match(r.text, /Cannot unify value: 2 with value: 1/)
  })

  test('eval-empty', () => {
    const r = evalSource(new Aontu(), '', 'json')
    Assert.equal(r.ok, true)
    Assert.deepEqual(JSON.parse(r.text), {})
  })

  // --- integration: the built binary, driven via stdin/args ---

  test('cli-version', () => {
    const r = run(['--version'])
    Assert.equal(r.code, 0)
    Assert.match(r.out, /^\d+\.\d+\.\d+/)
  })

  test('cli-help', () => {
    const r = run(['--help'])
    Assert.equal(r.code, 0)
    Assert.match(r.out, /Usage: aontu/)
  })

  test('cli-stdin-json', () => {
    const r = run([], 'port: *8080 | integer\nhost: localhost')
    Assert.equal(r.code, 0)
    Assert.deepEqual(JSON.parse(r.out), { port: 8080, host: 'localhost' })
  })

  test('cli-stdin-canon', () => {
    const r = run(['--canon'], 'a:1|2')
    Assert.equal(r.code, 0)
    Assert.equal(r.out.trim(), '{"a":1|2}')
  })

  test('cli-error-exit-code', () => {
    const r = run([], 'a:1 a:2')
    Assert.equal(r.code, 1)
    Assert.match(r.out, /Cannot unify value: 2 with value: 1/)
  })

  test('cli-unknown-option', () => {
    const r = run(['--nope'])
    Assert.equal(r.code, 2)
    Assert.match(r.out, /unknown option/)
  })
})
