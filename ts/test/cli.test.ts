/* Copyright (c) 2025 Richard Rodger, MIT License */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import { execFileSync } from 'node:child_process'
import * as Fs from 'node:fs'
import * as Os from 'node:os'
import * as Path from 'node:path'

import { Aontu } from '../dist/aontu'
import { evalSource, runVet, main as cliMainVet } from '../dist/cli'


const CLI = Path.join(__dirname, '..', 'bin', 'aontu.js')


function run(args: string[], input?: string): { out: string; code: number } {
  // The child does NOT inherit NODE_V8_COVERAGE. These cases assert the
  // packaged binary's behaviour; its coverage is contributed in-process
  // by coverage3.test.ts, and a grandchild's coverage file is not always
  // flushed before the runner aggregates — which made the ADR-002 gate
  // flaky rather than measuring anything extra.
  const env = { ...process.env }
  delete env.NODE_V8_COVERAGE

  try {
    const out = execFileSync('node', [CLI, ...args], {
      input: input ?? '',
      encoding: 'utf8',
      env,
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


// --- the vet verb (G2 phase 3) ---------------------------------------

function vetCapture(fn: () => void): { out: string; err: string } {
  const so = process.stdout.write
  const se = process.stderr.write
  let out = ''
  let err = ''
  ;(process.stdout as any).write = (s: any) => ((out += s), true)
  ;(process.stderr as any).write = (s: any) => ((err += s), true)
  try {
    fn()
  }
  finally {
    process.stdout.write = so
    process.stderr.write = se
    process.exitCode = 0
  }
  return { out, err }
}


function vetFiles(schema: string, data: string): { dir: string, schema: string, data: string } {
  const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-vet-'))
  const s = Path.join(dir, 'schema.aon')
  const d = Path.join(dir, 'data.json')
  Fs.writeFileSync(s, schema)
  Fs.writeFileSync(d, data)
  return { dir, schema: s, data: d }
}


const VET_SCHEMA = 'service: { name: string, port: integer }'


describe('cli-vet', () => {

  // The verb's whole reason for existing: an agent emits a document,
  // the gate says what does not hold and WHERE, and the exit code says
  // which kind of "no" it was.
  test('vet-reports-conflicts-with-both-sites', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }')
    const r = vetCapture(() => runVet([f.schema, f.data]))
    Assert.match(r.out, /verdict: invalid/)
    Assert.match(r.out, /\$\.service\.port: no_scalar_unify \[conflict\]/)
    Assert.match(r.out, /data: .*data\.json:1:\d+ \("8080"\)/)
    Assert.match(r.out, /schema: .*schema\.aon:1:\d+ \(integer\)/)
  })


  // A parent that collapses to a nil takes its subtree with it, so the
  // sibling conflict is reported on the CONTEXT rather than standing in
  // the tree. Both belong in the report: this is the design's own
  // motivating example, and it used to show half of what it found.
  test('vet-reports-findings-that-never-reached-the-tree', () => {
    const f = vetFiles(
      'service: close({ name: string, port: integer, replicas: integer })',
      'service: { name: "auth", prot: 8080, replicas: "3" }')
    const r = vetCapture(() => runVet([f.schema, f.data]))
    Assert.match(r.out, /\$\.service\.prot: closed/)
    Assert.match(r.out, /\$\.service\.replicas: no_scalar_unify/)
  })


  test('vet-exit-codes-are-verdict-classes', () => {
    const valid = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }')
    Assert.equal(vetCapture(() => {
      Assert.equal(runVet([valid.schema, valid.data]), 0)
    }).out.trim(), 'verdict: valid')

    const invalid = vetFiles(VET_SCHEMA, 'service: { name: 1, port: 8080 }')
    vetCapture(() => Assert.equal(runVet([invalid.schema, invalid.data]), 1))

    const incomplete = vetFiles(VET_SCHEMA, 'service: { name: "auth" }')
    vetCapture(() => Assert.equal(runVet([incomplete.schema, incomplete.data]), 3))

    // --partial keeps reporting the residue but stops it failing.
    vetCapture(() =>
      Assert.equal(runVet(['--partial', incomplete.schema, incomplete.data]), 0))

    const broken = vetFiles('a: 1\na: 2', 'a: 1')
    vetCapture(() => Assert.equal(runVet([broken.schema, broken.data]), 4))
  })


  test('vet-json-format-names-its-producer', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }')
    const r = vetCapture(() => runVet(['--format', 'json', f.schema, f.data]))
    const report = JSON.parse(r.out)
    Assert.equal(report.aontu.verb, 'vet')
    Assert.match(report.aontu.version, /^\d+\.\d+\.\d+$/)
    Assert.equal(report.verdict, 'invalid')
    Assert.equal(report.truncated, false)
    Assert.equal(report.findings[0].code, 'no_scalar_unify')
    Assert.equal(report.findings[0].sites[0].role, 'data')
  })


  test('vet-at-and-closed-reach-the-engine', () => {
    const f = vetFiles('services: { auth: { port: integer } }',
      'auth: { port: 8080 }')
    vetCapture(() => Assert.equal(runVet(['--at', '$.services', f.schema, f.data]), 0))

    const g = vetFiles('service: { name: string }',
      'service: { name: "auth" }\nextra: 1')
    vetCapture(() => Assert.equal(runVet([g.schema, g.data]), 0))
    vetCapture(() => Assert.equal(runVet(['--closed', g.schema, g.data]), 1))
  })


  test('vet-max-errors-truncates-and-says-so', () => {
    const f = vetFiles('a: integer\nb: integer\nc: integer',
      'a: "x"\nb: "y"\nc: "z"')
    const r = vetCapture(() =>
      Assert.equal(runVet(['--max-errors', '2', f.schema, f.data]), 1))
    Assert.match(r.out, /findings truncated/)
  })


  // Several data files are several candidates for one truth, so each is
  // vetted on its own and the worst verdict wins.
  test('vet-takes-more-than-one-data-file', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }')
    const bad = Path.join(f.dir, 'bad.json')
    Fs.writeFileSync(bad, 'service: { name: "auth", port: "nope" }')

    const r = vetCapture(() =>
      Assert.equal(runVet([f.schema, f.data, bad]), 1))
    Assert.match(r.out, /verdict: invalid/)
    Assert.match(r.out, /bad\.json/)
  })


  test('vet-usage-errors-exit-2', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }')

    for (const args of [
      [],
      [f.schema],
      ['--at'],
      ['--format', 'yaml', f.schema, f.data],
      ['--max-errors', 'lots', f.schema, f.data],
      ['--max-errors', '0', f.schema, f.data],
      ['--nope', f.schema, f.data],
    ]) {
      const r = vetCapture(() => Assert.equal(runVet(args), 2))
      Assert.match(r.err, /^aontu: /)
    }
  })


  test('vet-unreadable-file-exits-2-and-names-it', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }')
    const missing = Path.join(f.dir, 'no-such.json')
    const r = vetCapture(() => Assert.equal(runVet([f.schema, missing]), 2))
    Assert.match(r.err, /cannot read .*no-such\.json/)
  })


  test('vet-note-and-alternatives-reach-the-text-report', () => {
    const f = vetFiles(
      'service: { tier: must("gold"|"silver","tier must be supported"),' +
      ' port: integer & min(1024) }',
      'service: { tier: "lead", port: 80 }')
    const r = vetCapture(() => runVet([f.schema, f.data]))
    Assert.match(r.out, /note: tier must be supported/)
    Assert.match(r.out, /expected: integer&min\(1024\)/)
    Assert.match(r.out, /actual: +80/)
  })


  // A value the walk never reaches has no file name to report — a
  // preference's synthesised type yardstick is one — and the line
  // renders with an empty file rather than the word "undefined".
  test('vet-site-without-a-file-renders-empty', () => {
    const f = vetFiles('a: *1', 'a: {}')
    const r = vetCapture(() => runVet([f.schema, f.data]))
    Assert.match(r.out, /schema: :1:\d+ \(number\)/)
  })


  // The verb dispatches only as the FIRST argument, so a file argument
  // is never shadowed by a verb name.
  test('vet-dispatches-through-main', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }')
    const r = vetCapture(() => cliMainVet(['node', 'cli', 'vet', f.schema, f.data]))
    Assert.match(r.out, /verdict: valid/)
  })


  test('vet-verb-appears-in-help', () => {
    const r = run(['--help'])
    Assert.match(r.out, /aontu vet \[options\]/)
    Assert.match(r.out, /3 {2}incomplete/)
  })


  test('vet-end-to-end-exit-code', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }')
    const r = run(['vet', f.schema, f.data])
    Assert.equal(r.code, 1)
    Assert.match(r.out, /verdict: invalid/)
  })
})
