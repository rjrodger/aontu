/* Copyright (c) 2025 Richard Rodger, MIT License */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import { execFileSync } from 'node:child_process'
import * as Fs from 'node:fs'
import * as Os from 'node:os'
import * as Path from 'node:path'

import { Aontu } from '../dist/aontu'
import {
  evalSource, runVet, runSubsume, runBreaking, runTrim,
  watchChange, watchSignature, vetWaiter, deprecatedAt,
  main as cliMainVet,
} from '../dist/cli'


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


  // A data document that will not parse is the DATA's fault: exit 1
  // with a finding naming the file, not exit 4, which says the schema
  // is unusable. And one bad file among several must not blank the
  // findings the others earned.
  test('vet-unparseable-data-exits-1-and-names-the-file', () => {
    const f = vetFiles(VET_SCHEMA, 'service: ]')
    const r = vetCapture(() => Assert.equal(runVet([f.schema, f.data]), 1))
    Assert.match(r.out, /verdict: invalid/)
    Assert.match(r.out, /\$: syntax \[parse\]/)
    Assert.match(r.out, /data: .*data\.json:-1:-1 \(nil\)/)

    const good = Path.join(f.dir, 'good.json')
    Fs.writeFileSync(good, 'service: { name: 1, port: 8080 }')
    const both = vetCapture(() =>
      Assert.equal(runVet([f.schema, good, f.data]), 1))
    Assert.match(both.out, /no_scalar_unify/)
    Assert.match(both.out, /syntax/)
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


  // A relative `@"file"` load inside either document resolves from THAT
  // document's directory, not from wherever the command was run —
  // which is what `aontu <file>` has always done. Before this, a
  // modular schema vetted from another directory came back `error`,
  // and a same-named file in the working directory was read instead.
  test('vet-resolves-includes-from-each-document', () => {
    const f = vetFiles('@"part.aon"\nname: string', 'name: "auth"\nport: 8080')
    Fs.writeFileSync(Path.join(f.dir, 'part.aon'), 'port: integer')

    const cwd = process.cwd()
    const decoy = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-vet-cwd-'))
    Fs.writeFileSync(Path.join(decoy, 'part.aon'), 'port: string')
    try {
      process.chdir(decoy)
      vetCapture(() => Assert.equal(runVet([f.schema, f.data]), 0))
    }
    finally {
      process.chdir(cwd)
    }
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


  // The cap is on the REPORT, not on each file: two data files that
  // each come in under it can still overflow it together, and only the
  // aggregate cut catches that. Per-file capping alone would emit four
  // findings here and call the report whole.
  test('vet-max-errors-caps-the-report-not-each-file', () => {
    const f = vetFiles('a: integer\nb: integer', 'a: "x"\nb: "y"')
    const other = Path.join(f.dir, 'other.json')
    Fs.writeFileSync(other, 'a: "p"\nb: "q"')

    const r = vetCapture(() => Assert.equal(
      runVet(['--max-errors', '3', f.schema, f.data, other]), 1))
    Assert.match(r.out, /findings truncated/)
    Assert.equal(r.out.match(/no_scalar_unify \[conflict\]/g)?.length, 3)
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


  // The usage errors all end with "(try --help)", so the verb answers
  // to it: same text as `aontu --help`, exit 0.
  test('vet-help-is-help-not-an-unknown-option', () => {
    for (const args of [['--help'], ['-h'], ['--help', 'a.aon', 'b.json']]) {
      const r = vetCapture(() => Assert.equal(runVet(args), 0))
      Assert.match(r.out, /aontu vet \[options\]/)
      Assert.equal(r.err, '')
    }
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


  // An OFF-PEG value still names its document: a preference's
  // synthesised type yardstick is not a peg entry, so provenance
  // reaches it only because the stamp walk follows it deliberately.
  // Before that it belonged to neither document, and the report said
  // so by naming no file at all.
  test('vet-site-off-peg-still-names-its-document', () => {
    const f = vetFiles('a: *1', 'a: {}')
    const r = vetCapture(() => runVet([f.schema, f.data]))
    Assert.match(r.out, /schema: .*schema\.aon:1:\d+ \(number\)/)
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


  // --- SARIF and watch (G2 phase 5) -----------------------------------

  // The interchange form: level from severity, the data site as the
  // primary location, the schema site related, the whole native finding
  // in properties. Shape parity with the Go port is the golden in
  // test/spec/files/vet-sarif/ (sarif.test.ts); this is the CLI wiring.
  test('vet-sarif-format-embeds-the-finding', () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }')
    const r = vetCapture(() => runVet(['--format', 'sarif', f.schema, f.data]))
    const log = JSON.parse(r.out)
    Assert.equal(log.version, '2.1.0')
    Assert.match(log.$schema, /sarif-2\.1\.0/)
    const result = log.runs[0].results[0]
    Assert.equal(result.ruleId, 'aontu/no_scalar_unify')
    Assert.equal(result.level, 'error')
    Assert.equal(result.properties.path, '$.service.port')
    // DECODED before comparing: the uri percent-encodes URI-significant
    // bytes, and on Windows the temp path's backslashes are exactly
    // that (%5C), so the raw string equality only held on POSIX.
    Assert.equal(
      decodeURIComponent(
        result.locations[0].physicalLocation.artifactLocation.uri),
      f.data)
    Assert.equal(result.relatedLocations.length, 1)
    Assert.match(log.runs[0].tool.driver.version, /^\d+\.\d+\.\d+$/)
  })


  // The watch loop: one report per run, one run per change, streaming.
  // The waiter is injected so the loop is bounded; the report changing
  // between runs proves the files are re-read each time.
  test('vet-watch-streams-a-report-per-change', async () => {
    const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }')
    let calls = 0
    const wait = async (files: string[], before: string) => {
      Assert.deepEqual(files, [f.schema, f.data])
      // The baseline is recorded BEFORE the run it follows, so a save
      // landing during the run still reads as a change.
      Assert.equal(typeof before, 'string')
      if (0 === calls++) {
        Fs.writeFileSync(f.data, 'service: { name: "auth", port: "80" }')
        return true
      }
      return false
    }

    let code = -1
    const so = process.stdout.write
    let out = ''
    ;(process.stdout as any).write = (s: any) => ((out += s), true)
    try {
      code = await (runVet(['--watch', f.schema, f.data], wait) as Promise<number>)
    }
    finally {
      process.stdout.write = so
    }

    Assert.equal(code, 1)
    Assert.match(out, /verdict: valid[\s\S]*verdict: invalid/)
  })


  // The real waiter resolves when a watched file's mtime+size signature
  // moves — including from "gone" to existing, which is what a file
  // being replaced by an editor looks like mid-save.
  test('vet-watch-change-resolves-on-touch', async () => {
    const f = vetFiles(VET_SCHEMA, 'service: {}')
    const missing = Path.join(f.dir, 'not-yet.json')
    const files = [f.schema, missing]

    const change = watchChange(files, watchSignature(files), 20)
    setTimeout(() => Fs.writeFileSync(missing, 'service: {}'), 120)
    Assert.equal(await change, true)
  })


  // The production waiter itself — the real poll interval, driven by a
  // real touch, so the composition runVet actually uses is exercised.
  test('vet-watch-production-waiter', async () => {
    const f = vetFiles(VET_SCHEMA, 'service: {}')
    const files = [f.schema, f.data]

    const change = vetWaiter(files, watchSignature(files))
    setTimeout(() => Fs.writeFileSync(f.data, 'service: { x: 1 }'), 250)
    Assert.equal(await change, true)
  })
})


// The subsumption verbs (G3 phase 3). What the two ports must AGREE on
// (the report itself) is pinned by test/spec/subsume.tsv; what each
// port owns (argument handling, exit codes, the text rendering, git
// resolution) is here. The Go twin is go/cmd/aontu/subsume_test.go.
describe('cli-subsume', () => {

  function subFiles(general: string, specific: string) {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-sub-'))
    const g = Path.join(dir, 'general.aon')
    const s = Path.join(dir, 'specific.aon')
    Fs.writeFileSync(g, general)
    Fs.writeFileSync(s, specific)
    return { dir, general: g, specific: s }
  }

  test('subsume-exit-codes-are-verdict-classes', () => {
    const yes = subFiles('a:integer', 'a:1')
    Assert.equal(vetCapture(() =>
      Assert.equal(runSubsume([yes.general, yes.specific]), 0)
    ).out.trim(), 'verdict: subsumes')

    const no = subFiles('a:integer', 'a:hello')
    const r = vetCapture(() =>
      Assert.equal(runSubsume([no.general, no.specific]), 1))
    Assert.match(r.out, /verdict: does_not_subsume/)
    Assert.match(r.out, /\$\.a: compat_narrowed \[compat\]/)
    Assert.match(r.out, /general: .*general\.aon:1:3 \(integer\)/)
    Assert.match(r.out, /specific: .*specific\.aon:1:3 \("hello"\)/)

    const und = subFiles('a:{x:1}|{x:2}', 'a:{x:1|2}')
    vetCapture(() =>
      Assert.equal(runSubsume([und.general, und.specific]), 3))

    const broken = subFiles('a:1 a:2', 'a:1')
    vetCapture(() =>
      Assert.equal(runSubsume([broken.general, broken.specific]), 4))
  })

  test('subsume-profile-selects-the-comparison', () => {
    const f = subFiles('a:*2|number', 'a:*1|number')
    vetCapture(() => Assert.equal(
      runSubsume(['--profile', 'values', f.general, f.specific]), 0))
    const r = vetCapture(() => Assert.equal(
      runSubsume(['--profile', 'defaults', f.general, f.specific]), 1))
    Assert.match(r.out, /compat_default_changed/)
  })

  test('subsume-at-anchors-both-documents', () => {
    const f = subFiles('a:{x:integer} b:2', 'a:{x:1} b:xyz')
    vetCapture(() => Assert.equal(
      runSubsume(['--at', '$.a', f.general, f.specific]), 0))
    // A path missing from either side is an error verdict.
    vetCapture(() => Assert.equal(
      runSubsume(['--at', '$.zz', f.general, f.specific]), 4))
  })

  test('subsume-json-names-the-producer', () => {
    const f = subFiles('a:integer', 'a:hello')
    const r = vetCapture(() =>
      Assert.equal(runSubsume(['--format', 'json', f.general, f.specific]), 1))
    const report = JSON.parse(r.out)
    Assert.equal(report.aontu.verb, 'subsume')
    Assert.equal(report.verdict, 'does_not_subsume')
    Assert.equal(report.findings[0].code, 'compat_narrowed')
    Assert.equal(report.aontu.mode, undefined)
  })

  test('subsume-usage-errors-exit-2', () => {
    Assert.equal(vetCapture(() =>
      Assert.equal(runSubsume(['--bogus']), 2)
    ).err.includes('unknown subsume option'), true)
    vetCapture(() => Assert.equal(runSubsume(['one.aon']), 2))
    vetCapture(() => Assert.equal(
      runSubsume(['--profile', 'bogus', 'a.aon', 'b.aon']), 2))
    vetCapture(() => Assert.equal(runSubsume(['--at']), 2))
    vetCapture(() => Assert.equal(
      runSubsume(['--format', 'sarif', 'a.aon', 'b.aon']), 2))
    const f = subFiles('a:1', 'a:1')
    vetCapture(() => Assert.equal(
      runSubsume([Path.join(f.dir, 'missing.aon'), f.specific]), 2))
    Assert.equal(vetCapture(() =>
      Assert.equal(runSubsume(['--help']), 0)
    ).out.includes('aontu subsume'), true)
  })

  // The design's own motivating example: the v2 that renames nothing
  // but adds a required key and moves a default is BREAKING, with both
  // witnesses located.
  test('breaking-detects-the-designs-v1-v2-break', () => {
    const f = subFiles(
      'service: close({name:string,port:*9090|integer,owner:string})',
      'service: close({name:string,port:*8080|integer})')
    const r = vetCapture(() => Assert.equal(
      runBreaking(['--against', f.specific, f.general]), 1))
    Assert.match(r.out, /verdict: breaking/)
    Assert.match(r.out, /\$\.service\.owner: compat_required_added/)
    Assert.match(r.out, /\$\.service\.port: compat_default_changed/)
  })

  test('breaking-modes-choose-the-directions', () => {
    // Widening (v2 admits more) is fine backward, breaking forward.
    const f = subFiles('a:number', 'a:integer')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--mode', 'backward', f.general]), 0))
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--mode', 'forward', f.general]), 1))
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--mode', 'full', f.general]), 1))
  })

  test('breaking-resolves-git-revisions', () => {
    const { execFileSync } = require('node:child_process')
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-brk-'))
    const file = Path.join(dir, 'svc.aon')
    const git = (...args: string[]) => execFileSync('git', [
      '-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args,
    ], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
    git('init', '-q', '.')
    Fs.writeFileSync(file, 'service: close({name:string,port:*8080|integer})')
    git('add', 'svc.aon')
    git('commit', '-q', '-m', 'v1')
    Fs.writeFileSync(file,
      'service: close({name:string,port:*9090|integer,owner:string})')

    const r = vetCapture(() => Assert.equal(
      runBreaking(['--against', 'git#HEAD', file]), 1))
    Assert.match(r.out, /verdict: breaking/)
    Assert.match(r.out, /specific: git#HEAD:1:\d+/)

    // The forward direction puts the git source on the general side.
    const fwd = vetCapture(() => Assert.equal(
      runBreaking(['--against', 'git#HEAD', '--mode', 'forward', file]), 1))
    Assert.match(fwd.out, /general: git#HEAD:1:\d+/)

    // An unknown revision is a usage failure naming the spelling.
    const bad = vetCapture(() => Assert.equal(
      runBreaking(['--against', 'git#no-such-rev', file]), 2))
    Assert.match(bad.err, /cannot resolve git#no-such-rev/)

    // No git binary at all: still a located usage failure, using the
    // spawn error's own message since there is no stderr to quote.
    const savedPath = process.env.PATH
    try {
      process.env.PATH = ''
      const gone = vetCapture(() => Assert.equal(
        runBreaking(['--against', 'git#HEAD', file]), 2))
      Assert.match(gone.err, /cannot resolve git#HEAD/)
    }
    finally {
      process.env.PATH = savedPath
    }
  })

  test('breaking-reads-the-documents-own-policy', () => {
    // The policy declares no compatibility promise: nothing to check,
    // whatever --against says.
    const f = subFiles(
      'aontu_policy: hide({compat: *none|backward|forward|full})\na:1',
      'a:hello')
    const r = vetCapture(() => Assert.equal(
      runBreaking(['--against', f.specific, '--format', 'json', f.general]), 0))
    const report = JSON.parse(r.out)
    Assert.equal(report.aontu.mode, 'none')
    Assert.equal(report.verdict, 'compatible')

    // --mode overrides the declaration.
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--mode', 'backward', f.general]), 1))

    // The none path renders as text too.
    Assert.equal(vetCapture(() => Assert.equal(
      runBreaking(['--against', f.specific, f.general]), 0)
    ).out.trim(), 'verdict: compatible')
  })

  // The declaration's other spellings: a preference-free disjunction
  // declares its first alternative; a bare scalar declares itself; a
  // value that does not spell a mode (or a document that does not stand
  // alone) falls back to backward.
  test('breaking-policy-spellings', () => {
    const noPref = subFiles(
      'aontu_policy: hide({compat: none|backward})\na:1', 'a:hello')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', noPref.specific, noPref.general]), 0))

    const bare = subFiles(
      'aontu_policy: hide({compat: none})\na:1', 'a:hello')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', bare.specific, bare.general]), 0))

    const notString = subFiles(
      'aontu_policy: hide({compat: 1})\na:integer',
      'aontu_policy: hide({compat: 1})\na:1')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', notString.specific, notString.general]), 0))

    const notMode = subFiles(
      'aontu_policy: hide({compat: sideways})\na:integer',
      'aontu_policy: hide({compat: sideways})\na:1')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', notMode.specific, notMode.general]), 0))

    // A document that does not stand alone: the policy read yields
    // nothing, and the backward check itself reports the error.
    const broken = subFiles('a:1 a:2', 'a:1')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', broken.specific, broken.general]), 4))
  })

  test('breaking-allow-undecided-downgrades-the-exit', () => {
    const f = subFiles('a:{x:1}|{x:2}', 'a:{x:1|2}')
    const r = vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, f.general]), 3))
    Assert.match(r.out, /verdict: undecided/)
    Assert.match(r.out, /sub_disjunct_distribution/)
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--allow-undecided', f.general]), 0))

    const j = vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--format', 'json', f.general]), 3))
    Assert.equal(JSON.parse(j.out).aontu.mode, 'backward')
    Assert.equal(JSON.parse(j.out).verdict, 'undecided')
  })

  test('breaking-usage-errors-exit-2', () => {
    vetCapture(() => Assert.equal(runBreaking(['file.aon']), 2))
    vetCapture(() => Assert.equal(runBreaking(['--against']), 2))
    const gf = subFiles('a:1', 'a:1')
    Assert.equal(vetCapture(() => Assert.equal(runBreaking(
      ['--against', 'git#', gf.general]), 2)
    ).err.includes('git# needs a revision'), true)
    vetCapture(() => Assert.equal(runBreaking(
      ['--mode', 'sideways', '--against', 'a.aon', 'b.aon']), 2))
    vetCapture(() => Assert.equal(runBreaking(
      ['--format', 'yaml', '--against', 'a.aon', 'b.aon']), 2))
    vetCapture(() => Assert.equal(runBreaking(['--bogus']), 2))
    const f = subFiles('a:1', 'a:1')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', Path.join(f.dir, 'missing.aon'), f.general]), 2))
    vetCapture(() => Assert.equal(runBreaking(
      [Path.join(f.dir, 'missing.aon'), '--against', f.specific]), 2))
    Assert.equal(vetCapture(() =>
      Assert.equal(runBreaking(['--help']), 0)
    ).out.includes('aontu breaking'), true)
  })

  // Deprecate-then-remove is the supported rename path: a finding
  // about a value the old version already deprecated becomes a warning
  // under --allow-deprecated-removal, and warnings do not move the
  // verdict.
  test('breaking-allow-deprecated-removal', () => {
    const f = subFiles(
      'service: close({name:string, listen:integer})',
      'service: close({name:string, listen:integer,' +
      ' port:deprecate(integer,{msg:"renamed",use:"$.service.listen"})})')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, f.general]), 1))
    const r = vetCapture(() => Assert.equal(runBreaking(
      ['--against', f.specific, '--allow-deprecated-removal', f.general]), 0))
    Assert.match(r.out, /verdict: compatible/)
    Assert.match(r.out, /\$\.service\.port: compat_narrowed/)

    // A removal the old version did NOT deprecate stays breaking.
    const g = subFiles(
      'service: close({name:string})',
      'service: close({name:string, port:integer})')
    vetCapture(() => Assert.equal(runBreaking(
      ['--against', g.specific, '--allow-deprecated-removal', g.general]), 1))
  })

  // The old-version reader behind the downgrade, arm by arm — the Go
  // port exports the same reader (aontu.DeprecatedAt) and pins the same
  // arms in go/check-adjacent tests.
  test('breaking-deprecated-at-reader', () => {
    const src = 'a:[deprecate(1,{msg:"m"})] b:{c:deprecate(2,{msg:"n"})} d:3'
    Assert.equal(deprecatedAt(src, '$.a.0', 'x.aon'), true)
    Assert.equal(deprecatedAt(src, '$.b.c', 'x.aon'), true)
    Assert.equal(deprecatedAt(src, '$.a.5', 'x.aon'), false)
    Assert.equal(deprecatedAt(src, '$.zz', 'x.aon'), false)
    Assert.equal(deprecatedAt(src, '$.d.deeper', 'x.aon'), false)
    Assert.equal(deprecatedAt(src, '$.d', 'x.aon'), false)
    // A document that does not stand alone answers false: the check
    // that produced the finding already reported why.
    Assert.equal(deprecatedAt('a:1 a:2', '$.a', 'x.aon'), false)
  })

  // The trim reporter (G3 phase 6). Go twin: TestTrimVerb in
  // go/cmd/aontu/trim_test.go.
  test('trim-check-reports-redundant-paths', () => {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-trim-'))
    const file = Path.join(dir, 'doc.aon')
    Fs.writeFileSync(file, 'a:{&:{deep:1}, b:{deep:1}, c:{other:2}}')
    const r = vetCapture(() => Assert.equal(runTrim(['--check', file]), 1))
    Assert.match(r.out, /verdict: redundant/)
    Assert.match(r.out, /\$\.a\.b\.deep/)

    Fs.writeFileSync(file, 'x:{y:1}')
    Assert.equal(vetCapture(() =>
      Assert.equal(runTrim(['--check', file]), 0)
    ).out.trim(), 'verdict: clean')

    Fs.writeFileSync(file, 'a:1 a:2')
    vetCapture(() => Assert.equal(runTrim(['--check', file]), 4))

    Fs.writeFileSync(file, 'a:{&:{k:1},m:{k:1}}')
    const j = vetCapture(() => Assert.equal(
      runTrim(['--check', '--format', 'json', file]), 1))
    const report = JSON.parse(j.out)
    Assert.equal(report.aontu.verb, 'trim')
    Assert.equal(report.verdict, 'redundant')
    Assert.deepEqual(report.redundant, ['$.a.m.k'])
  })

  test('trim-usage-errors-exit-2', () => {
    const f = subFiles('a:1', 'a:1')
    // Report-only: rewriting needs a format-preserving editor (G7),
    // so --check is required rather than silently defaulted.
    Assert.equal(vetCapture(() =>
      Assert.equal(runTrim([f.general]), 2)
    ).err.includes('pass --check'), true)
    vetCapture(() => Assert.equal(runTrim(['--check']), 2))
    vetCapture(() => Assert.equal(
      runTrim(['--check', f.general, f.specific]), 2))
    vetCapture(() => Assert.equal(runTrim(['--bogus']), 2))
    vetCapture(() => Assert.equal(
      runTrim(['--check', '--format', 'yaml', f.general]), 2))
    vetCapture(() => Assert.equal(
      runTrim(['--check', Path.join(f.dir, 'missing.aon')]), 2))
    Assert.equal(vetCapture(() =>
      Assert.equal(runTrim(['--help']), 0)
    ).out.includes('aontu trim'), true)
  })

  // The verbs ride the same first-argument dispatch vet does.
  test('subsume-verbs-dispatch-from-main', () => {
    const f = subFiles('a:integer', 'a:1')
    const r = vetCapture(() => cliMainVet(
      ['node', 'aontu', 'subsume', f.general, f.specific]))
    Assert.match(r.out, /verdict: subsumes/)
    const b = vetCapture(() => cliMainVet(
      ['node', 'aontu', 'breaking', '--against', f.specific, f.general]))
    Assert.match(b.out, /verdict: compatible/)
    const t = vetCapture(() => cliMainVet(
      ['node', 'aontu', 'trim', '--check', f.general]))
    Assert.match(t.out, /verdict: clean/)
  })

})
