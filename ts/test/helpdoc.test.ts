/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE TEACHING PACK AND THE CODE LOOKUP (G11 phases 1-3), and the
// TypeScript twin of go/cmd/aontu/help_test.go and explain_test.go.
//
// What the two ports must AGREE on -- the corpus bytes, the topic list
// and its order, every exit class, and the tool help itself -- is
// asserted in both suites against the same repository sources. These
// are CLI-level messages and the shared spec suite runs the engine, so
// there is no shared mode that could carry them; asserting both ports
// against one source is what makes the agreement checkable anyway.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import { execFileSync } from 'node:child_process'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { HELPDOC } from '../dist/helpdoc'
import { hints, codeClasses } from '../dist/hints'
import {
  runHelp, runExplain, nearestVerb, looksLikeVerb, KNOWN_VERBS,
} from '../dist/cli'


const CLI = Path.join(__dirname, '..', 'bin', 'aontu.js')
const REPO = Path.join(__dirname, '..', '..')


function run(args: string[]): { out: string; err: string; code: number } {
  const env = { ...process.env }
  delete env.NODE_V8_COVERAGE
  try {
    const out = execFileSync('node', [CLI, ...args], {
      input: '', encoding: 'utf8', env, stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { out, err: '', code: 0 }
  }
  catch (err: any) {
    return {
      out: err.stdout ?? '', err: err.stderr ?? '', code: err.status ?? 1,
    }
  }
}


// LINE ENDINGS ARE THE CHECKOUT'S BUSINESS, the rule every other gate
// in this repository states.
function readRepo(rel: string): string {
  return Fs.readFileSync(Path.join(REPO, rel), 'utf8')
    .replaceAll('\r\n', '\n').replaceAll('\r', '\n')
}


describe('helpdoc', () => {

  // THE ASSERTION THE WHOLE PHASE RESTS ON. ts/src/helpdoc.ts is a
  // generated copy (ts/scripts/helpdoc.cjs, `make helpdoc`), and a
  // generated copy that nothing compares is a second source of truth
  // waiting to drift. Regenerate rather than hand-edit.
  test('corpus-is-identical-with-its-sources', () => {
    Assert.ok(0 < HELPDOC.length, 'no topics: has the generator run?')
    for (const topic of HELPDOC) {
      Assert.equal(topic.text, readRepo(topic.source),
        `help topic ${topic.topic} is stale against ${topic.source}` +
        ' — run `make helpdoc`')
    }
  })

  // THE TWO PORTS SERVE THE SAME CORPUS, in the same order. Both read
  // the same generated index, so this is what catches a stage that
  // wrote one port and not the other.
  test('both-ports-stage-the-same-topics', () => {
    const goDir = Path.join(REPO, 'go', 'cmd', 'aontu', 'helpdoc')
    const index = readRepo('go/cmd/aontu/helpdoc/index.tsv')
      .split('\n')
      .filter((line) => '' !== line && !line.startsWith('#'))
      .map((line) => line.split('\t'))

    Assert.deepEqual(index.map((col) => col[0]), HELPDOC.map((t) => t.topic),
      'the two ports list different topics, or in a different order')

    for (const [topic, file, summary, source] of index) {
      const staged = Fs.readFileSync(Path.join(goDir, file), 'utf8')
        .replaceAll('\r\n', '\n').replaceAll('\r', '\n')
      const mine = HELPDOC.find((t) => topic === t.topic)
      Assert.ok(null != mine, `${topic} is staged for Go and not here`)
      Assert.equal(staged, mine.text, `${topic} differs between the ports`)
      Assert.equal(summary, mine.summary, `${topic}: summaries differ`)
      Assert.equal(source, mine.source, `${topic}: sources differ`)
    }
  })

  // The one construct the phase exists for. An agent that cannot learn
  // `&:` offline cannot write a schema that constrains anything, and
  // gets `verdict: valid` over data that violates it.
  test('help-language-teaches-the-map-template', () => {
    const r = run(['help', 'language'])
    Assert.equal(r.code, 0)
    Assert.ok(r.out.includes('&:'), 'the grammar card omits `&:`')
    Assert.ok(r.out.includes('TEMPLATE'), 'the card does not name it')
  })

  test('help-tasks-bridges-the-callers-vocabulary', () => {
    const r = run(['help', 'tasks'])
    Assert.equal(r.code, 0)
    // The word the caller arrives with. It occurs nowhere in the tool
    // help, which is the measurement that opened G11.
    for (const want of ['ontology', 'aontu vet', '&:']) {
      Assert.ok(r.out.includes(want), `help tasks omits ${want}`)
    }
  })

  test('help-index-lists-every-topic', () => {
    const r = run(['help'])
    Assert.equal(r.code, 0)
    for (const topic of HELPDOC) {
      Assert.ok(r.out.includes(topic.topic), `the index omits ${topic.topic}`)
      Assert.ok(r.out.includes(topic.summary), `no summary for ${topic.topic}`)
    }
  })

  test('help-index-json', () => {
    const r = run(['help', '--format', 'json'])
    Assert.equal(r.code, 0)
    const report = JSON.parse(r.out)
    Assert.equal(report.aontu.verb, 'help')
    Assert.equal(report.topics.length, HELPDOC.length)
    Assert.deepEqual(Object.keys(report.topics[0]).sort(),
      ['source', 'summary', 'topic'])
  })

  test('help-topic-json-carries-the-text', () => {
    const r = run(['help', 'language', '--format', 'json'])
    Assert.equal(r.code, 0)
    const report = JSON.parse(r.out)
    Assert.equal(report.topic, 'language')
    Assert.ok(report.text.includes('&:'))
  })

  // AN UNKNOWN TOPIC NAMES THE ALTERNATIVES. The caller who typed it
  // has no other way to find out what exists.
  test('help-unknown-topic-lists-the-topics', () => {
    const r = run(['help', 'langauge'])
    Assert.equal(r.code, 2)
    Assert.equal(r.out, '', 'a refusal wrote to stdout')
    for (const want of ['langauge', 'language', 'examples']) {
      Assert.ok(r.err.includes(want), `the refusal omits ${want}`)
    }
  })

  test('help-usage-refusals', () => {
    for (const [args, want] of [
      [['help', 'a', 'b'], 'one topic'],
      [['help', '--format', 'xml'], 'text or json'],
      [['help', '--format'], 'text or json'],
      [['help', '--bogus'], 'unknown help option'],
    ] as [string[], string][]) {
      const r = run(args)
      Assert.equal(r.code, 2, args.join(' '))
      Assert.ok(r.err.includes(want), `${args.join(' ')}: ${r.err}`)
    }
  })

  test('help-verb-takes-the-tool-help', () => {
    const r = run(['help', '--help'])
    Assert.equal(r.code, 0)
    Assert.ok(r.out.startsWith('Usage: aontu'))
  })


  // --- G11 phase 3: explain ---

  // EVERY REGISTERED CODE RESOLVES. This is the property that makes
  // the verb usable from a report: a caller reading `[aontu/x]` out of
  // a finding can always ask what it means. The registry is read from
  // the shared TSV rather than the engine table, so the test can fail
  // when the two disagree instead of agreeing with itself.
  test('explain-answers-for-every-registered-code', () => {
    const codes = readRepo('test/spec/errcodes.tsv')
      .split('\n')
      .filter((line) => '' !== line.trim() && !line.startsWith('#'))
      .map((line) => line.split('\t')[0])
    Assert.ok(100 < codes.length, `the registry looks unread: ${codes.length}`)
    for (const code of codes) {
      Assert.equal(runExplain([code]), 0, `explain ${code} refused`)
      Assert.ok(null != codeClasses[code], `${code} has no class`)
    }
  })

  test('explain-list-is-the-registry', () => {
    const r = run(['explain', '--list'])
    Assert.equal(r.code, 0)
    const listed = r.out.trim().split('\n').map((line) => line.split(/\s+/)[0])
    Assert.deepEqual(listed.length, Object.keys(codeClasses).length,
      'the list is not the registry')
    for (const code of Object.keys(codeClasses)) {
      Assert.ok(listed.includes(code), `--list omits ${code}`)
    }
  })

  // A registered code carrying no explanation text SAYS SO rather than
  // printing an empty block. Before this verb the gap was invisible,
  // because a hint is only ever met beside the error that raises it.
  test('explain-marks-the-codes-with-no-text', () => {
    const r = run(['explain', '--list'])
    Assert.equal(r.code, 0)
    const bare = r.out.trim().split('\n')
      .filter((line) => line.includes('(no text)'))
      .map((line) => line.split(/\s+/)[0])
    Assert.ok(0 < bare.length,
      'no code is marked as carrying no text; has the table become' +
      ' complete? then this test should assert that instead')
    for (const code of bare) {
      Assert.ok(null == hints[code], `${code} is marked bare but has a hint`)
    }
    const one = run(['explain', bare[0]])
    Assert.equal(one.code, 0)
    Assert.ok(one.out.includes('no explanation text is registered'))
  })

  test('explain-json', () => {
    const r = run(['explain', '--format', 'json', 'no_scalar_unify'])
    Assert.equal(r.code, 0)
    const report = JSON.parse(r.out)
    Assert.equal(report.code, 'no_scalar_unify')
    Assert.equal(report.class, 'conflict')
    Assert.ok(0 < report.hint.length)
  })

  test('explain-list-json-flags-what-is-explained', () => {
    const r = run(['explain', '--list', '--format', 'json'])
    Assert.equal(r.code, 0)
    const rows = JSON.parse(r.out).codes
    Assert.equal(rows.length, Object.keys(codeClasses).length)
    Assert.ok(rows.some((row: any) => true === row.explained))
    Assert.ok(rows.some((row: any) => false === row.explained))
  })

  // A DYNAMIC CODE IS REGISTERED THROUGH ITS PREFIX and carries the
  // prefix's hint: the suffix names the operator, the explanation is
  // the prefix's.
  test('explain-resolves-a-dynamic-code', () => {
    for (const code of ['func:upper', 'op[+]', 'var[x', 'ref[y']) {
      const r = run(['explain', code])
      Assert.equal(r.code, 0, `${code}: ${r.err}`)
      Assert.ok(r.out.includes(`code:  ${code}`))
    }
  })

  test('explain-unknown-code-suggests-a-near-match', () => {
    const r = run(['explain', 'no_scalar_unif'])
    Assert.equal(r.code, 2)
    Assert.equal(r.out, '', 'a refusal wrote to stdout')
    for (const want of [
      'no such error code', 'did you mean `no_scalar_unify`', '--list',
    ]) {
      Assert.ok(r.err.includes(want), `the refusal omits ${want}: ${r.err}`)
    }
  })

  // The other arm of the suggestion: a code nothing is near gets the
  // refusal with no `did you mean`, because naming an unrelated code
  // with confidence is worse than naming none.
  test('explain-unknown-code-with-no-near-match-suggests-nothing', () => {
    const r = run(['explain', 'zzzzzzzzzzzzzzzzzzzz'])
    Assert.equal(r.code, 2)
    Assert.ok(r.err.includes('no such error code'))
    Assert.ok(!r.err.includes('did you mean'), r.err)
  })

  test('explain-usage-refusals', () => {
    for (const [args, want] of [
      [['explain'], 'needs one code'],
      [['explain', 'a', 'b'], 'needs one code'],
      [['explain', '--list', 'x'], 'takes no code'],
      [['explain', '--format', 'xml'], 'text or json'],
      [['explain', '--bogus'], 'unknown explain option'],
    ] as [string[], string][]) {
      const r = run(args)
      Assert.equal(r.code, 2, args.join(' '))
      Assert.ok(r.err.includes(want), `${args.join(' ')}: ${r.err}`)
    }
  })

  test('explain-verb-takes-the-tool-help', () => {
    const r = run(['explain', '--help'])
    Assert.equal(r.code, 0)
    Assert.ok(r.out.startsWith('Usage: aontu'))
  })

  // The in-process entries, so the exported surface is exercised as a
  // library call and not only through the packaged binary.
  test('help-and-explain-are-callable-in-process', () => {
    Assert.equal(runHelp([]), 0)
    Assert.equal(runHelp(['language']), 0)
    Assert.equal(runHelp(['nope']), 2)
    Assert.equal(runExplain(['--list']), 0)
    Assert.equal(runExplain(['nope']), 2)
  })


  // --- G11 phase 2: the one-argument mistyped-verb hint ---

  // `aontu help` used to answer `cannot read help: open help: no such
  // file or directory` and exit 1 -- the bare word read as a file name,
  // with the good hint gated behind a SECOND argument.
  test('bare-word-is-diagnosed-as-a-mistyped-verb', () => {
    for (const [arg, near] of [
      ['vett', 'vet'], ['gett', 'get'], ['explian', 'explain'],
      ['relation', 'relations'], ['hepl', 'help'],
    ]) {
      const r = run([arg])
      Assert.equal(r.code, 2, arg)
      Assert.ok(r.err.includes('not a verb this port knows'), arg)
      Assert.ok(r.err.includes(`did you mean \`aontu ${near}\``),
        `${arg}: ${r.err}`)
    }
  })

  test('bare-word-with-no-near-verb-suggests-nothing', () => {
    const r = run(['ontology'])
    Assert.equal(r.code, 2)
    Assert.ok(r.err.includes('not a verb this port knows'))
    Assert.ok(!r.err.includes('did you mean'),
      `suggested something unrelated: ${r.err}`)
  })

  // THE ESCAPE HATCH THE SUBCOMMAND DISPATCH ALREADY DOCUMENTS. A
  // path-shaped argument was meant as a path and keeps the file
  // diagnosis and its exit 1.
  test('path-shaped-argument-keeps-the-file-diagnosis', () => {
    for (const arg of ['./help', 'help.aon', '/tmp/aontu-no-such', 'sub/help']) {
      const r = run([arg])
      Assert.equal(r.code, 1, arg)
      Assert.ok(r.err.includes(`cannot read ${arg}`), `${arg}: ${r.err}`)
    }
  })

  test('looks-like-verb', () => {
    for (const arg of ['help', 'vet', 'a']) {
      Assert.equal(looksLikeVerb(arg), true, arg)
    }
    for (const arg of [
      '', './help', 'help.aon', '/tmp/help', 'sub/help', 'a\\b', '-x',
    ]) {
      Assert.equal(looksLikeVerb(arg), false, arg)
    }
  })

  test('nearest-verb-respects-the-cap', () => {
    Assert.equal(nearestVerb('vett', ['vet', 'view', 'why']), 'vet')
    Assert.equal(nearestVerb('qqqqqqqqqq', ['vet', 'view', 'why']), '')
    // A TIE RESOLVES BY CODE-POINT ORDER in both ports, not by the
    // order the verb table happens to be written in: `xet` is one edit
    // from both `get` and `vet`, and `get` sorts first.
    Assert.equal(nearestVerb('xet', ['vet', 'get']), 'get')
  })

  // KNOWN_VERBS feeds the suggestion, and is a SEPARATE list from the
  // if-chain in main() because the chain's arms have three shapes.
  // This is what stops the two drifting.
  test('known-verbs-all-dispatch', () => {
    for (const verb of KNOWN_VERBS) {
      const r = run([verb, '--help'])
      Assert.ok(!r.err.includes('not a verb this port knows'),
        `${verb} is in KNOWN_VERBS but main() does not dispatch it`)
      Assert.equal(r.code, 0, `${verb} --help: ${r.err}`)
    }
  })

  // THE TWO PORTS' TOOL HELP IS ONE TEXT. It was already byte-identical
  // before G11 and nothing asserted it, so a verb documented in one
  // port and not the other would have shipped silently. Extracted from
  // the sources rather than run, because the Go binary is not built by
  // this suite.
  test('the-tool-help-is-identical-in-both-ports', () => {
    const go = readRepo('go/cmd/aontu/main.go')
    const ts = readRepo('ts/src/cli.ts')
    const goText = go.slice(go.indexOf('const helpText = `') + 18)
    const tsText = ts.slice(ts.indexOf('const HELP = `') + 14)
    Assert.equal(
      goText.slice(0, goText.indexOf('`')),
      tsText.slice(0, tsText.indexOf('`')),
      'go/cmd/aontu/main.go helpText and ts/src/cli.ts HELP have drifted')
  })

  test('the-tool-help-advertises-the-language-door', () => {
    const ts = readRepo('ts/src/cli.ts')
    const help = ts.slice(ts.indexOf('const HELP = `') + 14)
    const text = help.slice(0, help.indexOf('`'))
    for (const want of [
      'aontu help [topic]', 'aontu explain <code>',
      'NEW TO THE LANGUAGE?', '&: inside a map is',
    ]) {
      Assert.ok(text.includes(want), `the tool help omits ${want}`)
    }
  })

})
