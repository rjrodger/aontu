/* Copyright (c) 2025 Richard Rodger, MIT License */

// The validation verb: check a data document against a schema document
// and return a MACHINE-READABLE report (G2 phase 2,
// docs/capability-review/g2-validation-verb.md).
//
// This module is the engine only. The CLI verb, the JSON/SARIF
// renderers and `--watch` are phase 3 and 5; the Go port is phase 4.
// Keeping the engine transport-free is the split lsp.ts already uses,
// and for the same reason: it is the part that has to be unit-testable
// and embeddable.
//
// Two properties of the engine shape everything here, and both were
// probed rather than assumed:
//
//   - A CONTRADICTION surfaces as a NilVal in the unified tree, so
//     conflict findings come from a tree walk (the `walkNils` pattern
//     lsp.ts already uses, generalised).
//   - INCOMPLETENESS does not. `{name:"auth"}` against
//     `{name:string, port:integer}` unifies cleanly and leaves
//     `port:integer` standing — no nil, no error. It surfaces only when
//     something tries to GENERATE, which is why vet runs a generate
//     check in an isolated collect context and reads the
//     `incomplete`-class errors out of it. The two verdicts the report
//     distinguishes therefore come from two different mechanisms.

import type { Val } from './type'

import { Aontu } from './aontu'
import { ConjunctVal } from './val/ConjunctVal'
import { walkVals, collectNils } from './walk'


export type VetVerdict = 'valid' | 'invalid' | 'incomplete' | 'error'

export type VetRole = 'data' | 'schema'

export type VetSite = {
  file: string
  row: number
  col: number
  role: VetRole
  value?: string
}

export type VetFinding = {
  code: string
  class: string
  severity: 'error' | 'warning' | 'info'
  path: string
  message: string
  sites: VetSite[]
  expected?: string
  actual?: string
  note?: string
}

export type VetReport = {
  verdict: VetVerdict
  truncated: boolean
  findings: VetFinding[]
}

export type VetOptions = {
  at?: string          // validate against this path of the schema
  closed?: boolean     // close() the anchor for this run
  partial?: boolean    // residue is not a failure
  maxErrors?: number   // cap the finding list (default 20)
  schemaUrl?: string   // provenance label for schema sites
  dataUrl?: string     // provenance label for data sites
}


const DEFAULT_MAX_ERRORS = 20
const DEFAULT_SCHEMA_URL = 'schema'
const DEFAULT_DATA_URL = 'data'


// Every site in a freshly parsed tree carries the same url, and for a
// bare parse that url is the empty string: `site.url` is only populated
// by the multisource loader (ts/src/lang.ts). Vet takes two documents
// from its CALLER, not from the filesystem, so it stamps provenance
// itself — which is what lets the report assign site ROLES by
// provenance rather than by NilVal's source-order heuristic, exactly as
// the design requires.
function stampUrl(v: any, url: string) {
  walkVals(v, (n: any) => {
    n.site.url = url
    return true
  }, new Set())
}


// `$.a.b`, and `$` for the root. Deliberately NOT delimiter-escaped: a
// map key may contain any character, including every separator a
// compact summary might pick, so the path is carried as a JSON string
// and never parsed back out of a larger token.
function pathText(path?: string[]): string {
  return '$' + (null != path && 0 < path.length ? '.' + path.join('.') : '')
}


// `secondary` is the only operand that can be absent — a `closed` or an
// incomplete finding has one side, a two-site conflict has both — so
// this is the one nullable input, and every Val that does arrive
// carries a site and a canon.
function siteOf(v: any, dataUrl: string): VetSite | undefined {
  if (null == v) {
    return undefined
  }
  const file = v.site.url
  return {
    file,
    row: v.site.row,
    col: v.site.col,
    role: dataUrl === file ? 'data' : 'schema',
    value: v.canon,
  }
}


// The data site first — it is the thing to fix — then the schema site.
// The underlying NilVal fields are untouched: this is a report-layer
// projection, so the existing error.tsv assertions do not move.
function sitesOf(nil: any, dataUrl: string): VetSite[] {
  const sites: VetSite[] = [siteOf(nil.primary, dataUrl) as VetSite]

  const secondary = siteOf(nil.secondary, dataUrl)
  if (null != secondary) {
    sites.push(secondary)
  }

  // Partitioned rather than sorted: which of the two NilVal operands is
  // `primary` follows source order within one document, which says
  // nothing useful when one side is a schema and the other is data.
  return [
    ...sites.filter((s) => 'data' === s.role),
    ...sites.filter((s) => 'schema' === s.role),
  ]
}


function findingOf(nil: any, dataUrl: string): VetFinding {
  const details = nil.details ?? {}
  const finding: VetFinding = {
    code: nil.why,
    class: nil.class,
    severity: 'error',
    path: pathText(nil.path),
    message: nil.msg ? nil.msg.split('\n')[0] : '',
    sites: sitesOf(nil, dataUrl),
  }

  // `expected`/`actual` are the admissible-alternatives contract, and
  // the constraint algebra already produces them: G1's atoms attach the
  // normalised residual and the offending value, and `must` attaches
  // the author's message. Read them where they are rather than
  // re-deriving them here.
  if ('string' === typeof details.expected) {
    finding.expected = details.expected
  }
  if ('string' === typeof details.actual) {
    finding.actual = details.actual
  }
  if ('string' === typeof details.message) {
    finding.note = details.message
  }

  return finding
}


// Findings are sorted BY VET, not by the walk. The underlying walk
// iterates raw object keys and the two hosts disagree about their order
// — `10:… 9:…` yields ["9","10"] in JavaScript, which hoists
// integer-like keys, against Go's insertion order (ts/src/keyorder.ts
// exists for exactly this) — so an unsorted report could never be in
// cross-port parity.
//
// The order is by data site (file, row, column), then code, then path.
// It is carried in ONE key string rather than a cascade of comparisons:
// the row and column are zero-padded so lexicographic order is numeric
// order, and NUL joins the fields because no field can contain one.
// A cascade would need a test per tie-breaker to stay honest; a key
// needs none, and cannot disagree with itself.
const ORDER_PAD = 9

function orderKey(f: VetFinding): string {
  const site = f.sites[0]
  return [
    site.file,
    String(site.row).padStart(ORDER_PAD, '0'),
    String(site.col).padStart(ORDER_PAD, '0'),
    f.code,
    f.path,
  ].join('\u0000')
}


// Walk the evaluated schema to the anchor path. `$` and `$.a.b` are
// both accepted, as is the bare `a.b` a shell is likely to hand over
// unquoted.
function anchorAt(root: any, at: string): Val | undefined {
  const trimmed = at.startsWith('$') ? at.slice(1) : at
  const parts = trimmed.split('.').filter((p) => '' !== p)

  let node: any = root
  for (const part of parts) {
    const peg = node?.peg
    if (null == peg || 'object' !== typeof peg || !(part in peg)) {
      return undefined
    }
    node = peg[part]
  }

  return node
}


// Validate `dataSrc` against `schemaSrc`.
//
// Never throws for findings: a contradiction in the data is DATA, and
// the caller gets a report. It throws only when the caller's own inputs
// are unusable — which is why an unusable schema is a verdict (`error`)
// rather than an exception too: "the schema is broken" is a fact the
// agent loop needs to branch on, not an exceptional condition.
export function vet(
  schemaSrc: string, dataSrc: string, opts?: VetOptions): VetReport {
  const options = opts ?? {}
  const schemaUrl = options.schemaUrl ?? DEFAULT_SCHEMA_URL
  const dataUrl = options.dataUrl ?? DEFAULT_DATA_URL
  const maxErrors = options.maxErrors ?? DEFAULT_MAX_ERRORS

  const aontu = new Aontu()

  // 1. The schema alone. If it does not stand up on its own, the data
  //    is never blamed for it.
  const schemaCtx = aontu.ctx({ collect: true })
  const schemaVal: any = aontu.unify(schemaSrc, undefined, schemaCtx)
  if (0 < schemaCtx.err.length || true === schemaVal?.isNil) {
    return { verdict: 'error', truncated: false, findings: [] }
  }

  // 2. The anchor: the whole schema, or the value at `--at`.
  let anchor: any = schemaVal
  if (null != options.at) {
    anchor = anchorAt(schemaVal, options.at)
    if (null == anchor) {
      return { verdict: 'error', truncated: false, findings: [] }
    }
  }

  // 3. Both documents get their provenance stamped BEFORE they meet, so
  //    every site in the result knows which document it came from.
  const dataCtx = aontu.ctx({ collect: true })
  const dataVal: any = aontu.parse(dataSrc, undefined, dataCtx)
  if (0 < dataCtx.err.length || null == dataVal) {
    return { verdict: 'error', truncated: false, findings: [] }
  }
  stampUrl(anchor, schemaUrl)
  stampUrl(dataVal, dataUrl)

  // `--closed` sets the flag `close()` itself sets, rather than wrapping
  // the anchor in a CloseFuncVal: the anchor is an already-evaluated
  // tree, and a func value would have to resolve again to have any
  // effect. A scalar anchor has no keys to close, so the flag is only
  // meaningful on a bag.
  if (true === options.closed && (true === anchor.isMap || true === anchor.isList)) {
    anchor.closed = true
  }

  const ctx = aontu.ctx({ collect: true })
  const pair = new ConjunctVal({ peg: [anchor, dataVal] }, ctx)
  const unified: any = aontu.unify(pair, undefined, ctx)

  // 4. Contradictions: every NilVal standing in the result.
  // collectNils reports the node it is given, so a root that is itself
  // a nil needs no separate arm — adding one listed the same finding
  // twice.
  const nils: any[] = collectNils(unified)

  const findings: VetFinding[] = nils.map((n) => findingOf(n, dataUrl))
  const conflicts = findings.length

  // 5. Incompleteness: what is left standing that cannot generate. The
  //    generate check runs in its own collect context so nothing it
  //    raises reaches the caller's error list, and so a schema that is
  //    merely unsatisfied does not look like one that is contradicted.
  // No try/catch: in collect mode `gen` records its reasons on the
  // context instead of throwing, which is the whole point of the mode.
  const genCtx: any = aontu.ctx({ collect: true })
  genCtx.root = unified
  unified.gen(genCtx)
  for (const err of genCtx.err) {
    if ('incomplete' === err.class) {
      findings.push(findingOf(err, dataUrl))
    }
  }

  const keyed = findings.map((f) => ({ key: orderKey(f), finding: f }))
  keyed.sort((a, b) => a.key < b.key ? -1 : 1)
  const ordered = keyed.map((k) => k.finding)

  const truncated = maxErrors < ordered.length
  const kept = truncated ? ordered.slice(0, maxErrors) : ordered

  // 6. The verdict derives from finding CLASSES, never from codes, so a
  //    new code can never change exit behaviour.
  let verdict: VetVerdict = 'valid'
  if (0 < conflicts) {
    verdict = 'invalid'
  }
  else if (findings.length > conflicts && true !== options.partial) {
    verdict = 'incomplete'
  }

  return { verdict, truncated, findings: kept }
}
