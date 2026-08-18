/* Copyright (c) 2025 Richard Rodger, MIT License */

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import { vet } from '../dist/vet'
import { vet as vetFromPackage } from '../dist/aontu'


const SCHEMA = 'service: { name: string, port: integer }'


describe('vet-verdicts', () => {

  test('valid-data-is-valid', () => {
    const r = vet(SCHEMA, 'service: { name: "auth", port: 8080 }')
    Assert.equal(r.verdict, 'valid')
    Assert.equal(r.truncated, false)
    Assert.deepEqual(r.findings, [])
  })


  test('contradiction-is-invalid', () => {
    const r = vet(SCHEMA, 'service: { name: "auth", port: "8080" }')
    Assert.equal(r.verdict, 'invalid')
    Assert.equal(r.findings.length, 1)
    Assert.equal(r.findings[0].code, 'no_scalar_unify')
    Assert.equal(r.findings[0].class, 'conflict')
    Assert.equal(r.findings[0].path, '$.service.port')
  })


  // The two negative verdicts are the mechanical answer to error.tsv's
  // conflation: a contradiction can never be satisfied, incompleteness
  // merely is not satisfied YET.
  test('residue-is-incomplete-not-invalid', () => {
    const r = vet(SCHEMA, 'service: { name: "auth" }')
    Assert.equal(r.verdict, 'incomplete')
    Assert.equal(r.findings.length, 1)
    Assert.equal(r.findings[0].class, 'incomplete')
    Assert.equal(r.findings[0].path, '$.service.port')
  })


  test('partial-opts-out-of-strict', () => {
    const r = vet(SCHEMA, 'service: { name: "auth" }', { partial: true })
    Assert.equal(r.verdict, 'valid')
    // The finding is still REPORTED — `--partial` changes the verdict,
    // not what the caller is told.
    Assert.equal(r.findings.length, 1)
  })


  test('contradiction-outranks-residue', () => {
    const r = vet(SCHEMA, 'service: { name: 1 }')
    Assert.equal(r.verdict, 'invalid')
  })


  test('broken-schema-is-never-blamed-on-data', () => {
    const r = vet('a: 1\na: 2', 'a: 1')
    Assert.equal(r.verdict, 'error')
    Assert.deepEqual(r.findings, [])
  })


  test('unparseable-data-is-an-error-verdict', () => {
    const r = vet(SCHEMA, 'a: ]')
    Assert.equal(r.verdict, 'error')
  })
})


describe('vet-findings', () => {

  test('sites-are-role-tagged-data-first', () => {
    const r = vet(SCHEMA, 'service: { name: "auth", port: "8080" }',
      { schemaUrl: 'service.aon', dataUrl: 'deploy.json' })
    const sites = r.findings[0].sites
    Assert.equal(sites.length, 2)
    Assert.equal(sites[0].role, 'data')
    Assert.equal(sites[0].file, 'deploy.json')
    Assert.equal(sites[0].value, '"8080"')
    Assert.equal(sites[1].role, 'schema')
    Assert.equal(sites[1].file, 'service.aon')
    Assert.equal(sites[1].value, 'integer')
    Assert.ok(0 < sites[0].row)
    Assert.ok(0 < sites[0].col)
  })


  test('closed-key-finding-carries-one-site', () => {
    const r = vet('service: close({ name: string })',
      'service: { name: "auth", prot: 8080 }')
    Assert.equal(r.verdict, 'invalid')
    const f = r.findings.find((f: any) => 'closed' === f.code)
    Assert.ok(null != f)
    Assert.equal(f.path, '$.service.prot')
    Assert.equal(f.sites.length, 1)
    Assert.equal(f.sites[0].role, 'data')
  })


  // G1's atoms already attach the normalised residual and the offending
  // value; vet reads them where they are rather than re-deriving them.
  test('constraint-finding-carries-expected-and-actual', () => {
    const r = vet('service: { port: integer & min(1024) }',
      'service: { port: 80 }')
    const f = r.findings[0]
    Assert.equal(f.code, 'constraint')
    Assert.equal(f.expected, 'integer&min(1024)')
    Assert.equal(f.actual, '80')
    Assert.equal(f.note, undefined)
  })


  test('must-finding-carries-the-author-message-as-note', () => {
    const r = vet('service: { tier: must("gold"|"silver","tier must be supported") }',
      'service: { tier: "lead" }')
    const f = r.findings[0]
    Assert.equal(f.code, 'must')
    Assert.equal(f.note, 'tier must be supported')
    Assert.equal(f.expected, '"gold"|"silver"')
    Assert.equal(f.actual, '"lead"')
  })


  test('message-is-the-headline-only', () => {
    const r = vet(SCHEMA, 'service: { name: "auth", port: "8080" }')
    Assert.ok(r.findings[0].message.startsWith('[aontu/no_scalar_unify]'))
    Assert.ok(!r.findings[0].message.includes('\n'))
  })


  // A key may contain any character, so no punctuation is safe as a
  // path separator; the path is carried whole and never re-parsed.
  test('paths-are-not-delimiter-safe', () => {
    const r = vet('"a b": integer', '"a b": "x"')
    Assert.equal(r.findings[0].path, '$.a b')
  })


  test('root-conflict-reports-the-root-path', () => {
    const r = vet('1', '2')
    Assert.equal(r.verdict, 'invalid')
    Assert.equal(r.findings[0].path, '$')
  })


  // The spread constraint lives off-peg, so this is only reachable by
  // following it — but note WHERE the finding lands: the path is the
  // TEMPLATE's, not the instance's, because the conflict nil is created
  // against the template node. The data site still points at the
  // offending value, which is what a repair loop needs; naming the
  // instance path is a phase-3 report concern, recorded in the register.
  test('conflict-inside-a-spread-template-is-found', () => {
    const r = vet('services: &: { port: integer }',
      'services: { auth: { port: "80" } }')
    Assert.equal(r.verdict, 'invalid')
    Assert.equal(r.findings[0].path, '$.services.port')
    Assert.equal(r.findings[0].sites[0].role, 'data')
    Assert.equal(r.findings[0].sites[0].value, '"80"')
  })
})


describe('vet-ordering-and-limits', () => {

  // Two independent conflicts DO collect in one pass, so ordering is
  // observable without waiting for phase 6.
  test('findings-are-sorted-by-data-site-then-code', () => {
    const r = vet('a: integer\nb: integer\nc: integer',
      'c: "z"\na: "x"\nb: "y"')
    Assert.equal(r.findings.length, 3)
    const rows = r.findings.map((f: any) => f.sites[0].row)
    Assert.deepEqual(rows, [...rows].sort((x, y) => x - y))
  })


  test('findings-with-the-same-site-order-by-code', () => {
    const r = vet('a: integer\nb: integer', 'a: "x"\nb: "y"')
    const codes = r.findings.map((f: any) => f.code)
    Assert.deepEqual(codes, [...codes].sort())
  })


  test('max-errors-caps-and-marks-truncated', () => {
    const r = vet('a: integer\nb: integer\nc: integer',
      'a: "x"\nb: "y"\nc: "z"', { maxErrors: 2 })
    Assert.equal(r.findings.length, 2)
    Assert.equal(r.truncated, true)
  })


  test('an-uncapped-report-is-not-truncated', () => {
    const r = vet('a: integer\nb: integer', 'a: "x"\nb: "y"')
    Assert.equal(r.truncated, false)
  })
})


describe('vet-anchor', () => {

  test('at-selects-a-subtree', () => {
    const schema = 'services: { auth: { port: integer } }\nother: { junk: string }'
    const r = vet(schema, 'auth: { port: 8080 }', { at: '$.services' })
    Assert.equal(r.verdict, 'valid')
  })


  test('at-accepts-a-bare-path', () => {
    const schema = 'services: { auth: { port: integer } }'
    const r = vet(schema, 'auth: { port: "x" }', { at: 'services' })
    Assert.equal(r.verdict, 'invalid')
  })


  test('at-root-is-the-whole-schema', () => {
    const r = vet(SCHEMA, 'service: { name: "auth", port: 8080 }', { at: '$' })
    Assert.equal(r.verdict, 'valid')
  })


  test('an-anchor-that-does-not-exist-is-an-error-verdict', () => {
    const r = vet(SCHEMA, 'a: 1', { at: '$.nope' })
    Assert.equal(r.verdict, 'error')
  })


  test('an-anchor-through-a-scalar-is-an-error-verdict', () => {
    const r = vet('a: 1', 'x: 1', { at: '$.a.b' })
    Assert.equal(r.verdict, 'error')
  })


  // `--closed` closes the ANCHOR, so a surplus key is only refused at
  // the level the run is anchored on: an unanchored run closes the
  // root, which says nothing about keys nested below it.
  test('closed-closes-the-anchor-for-this-run', () => {
    const open = vet('service: { name: string }',
      'service: { name: "auth" }\nextra: 1')
    Assert.equal(open.verdict, 'valid')

    const shut = vet('service: { name: string }',
      'service: { name: "auth" }\nextra: 1', { closed: true })
    Assert.equal(shut.verdict, 'invalid')
  })


  test('closed-applies-to-the-selected-anchor', () => {
    const open = vet('service: { name: string }',
      'name: "auth"\nextra: 1', { at: '$.service' })
    Assert.equal(open.verdict, 'valid')

    const shut = vet('service: { name: string }',
      'name: "auth"\nextra: 1', { at: '$.service', closed: true })
    Assert.equal(shut.verdict, 'invalid')
  })


  // A scalar anchor has no keys to close, so the flag is inert rather
  // than an error.
  test('closed-on-a-scalar-anchor-is-inert', () => {
    const r = vet('a: integer', '1', { at: '$.a', closed: true })
    Assert.equal(r.verdict, 'valid')
  })
})


describe('vet-api', () => {

  // The package entry is what a consumer requires, so the re-export is
  // part of the contract rather than a convenience.
  test('vet-is-exported-from-the-package-entry', () => {
    Assert.equal(typeof vetFromPackage, 'function')
    const r = vetFromPackage('a: integer', 'a: 1')
    Assert.equal(r.verdict, 'valid')
  })
})


describe('vet-containers', () => {

  // A list peg is an array, a map peg an object: the walk has to follow
  // both, and only a list conflict exercises the array arm.
  test('conflict-inside-a-list-is-found', () => {
    const r = vet('a: [integer]', 'a: ["x"]')
    Assert.equal(r.verdict, 'invalid')
    Assert.equal(r.findings[0].path, '$.a.0')
  })


  test('nested-list-conflicts-are-all-reported', () => {
    const r = vet('a: [integer, integer]', 'a: ["x", "y"]')
    Assert.equal(r.findings.length, 2)
  })
})
