/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE ROLE GATE: may an agent operating under a ROLE modify a SUBTREE?
//
// An agent about to change a model (`aontu set`, an overlay, a rewrite)
// asks first, and the answer comes from a ROLE MODEL that is itself an
// aontu document: one entry per role, each naming the subtrees the
// role may modify and, optionally, the ones it may not. Roles are
// arbitrary identifier strings -- `admin`, `dev`, `product`, `qa` --
// and the model is whatever its author writes, so the rules of the
// language (spreads, references, includes, `close()`) compose role
// models the way they compose everything else.
//
// The shape of a role is aontu too. It is conjoined with the model at
// evaluation, as a spread template over the roles map:
//
//   roles: { &: { allow: [&: Entry] deny?: [&: Entry] } }
//   Entry = string & re("^[$]") & re("[^.]$")
//
// so a malformed role -- `allow: "$.a"`, `deny: [1]`, an entry that is
// empty or does not start at the root or ends in a dot, a roles map
// that is a number -- is refused by the engine with the engine's own
// code and site, and this module never invents a finding shape of its
// own. The shape is a VALUE the model meets, not text appended to it:
// a model whose last line is an unclosed map or a dangling key would
// swallow appended text, and the shape would then apply to nothing.
// A role with no `allow` list allows nothing, because the template's
// empty list is what the tree holds for it.
//
// The lists are read from the WRITTEN tree, not from the generated
// document: a `hide()` mark keeps a list out of the output, and a gate
// that read the output would let a hidden `deny` vanish -- the wrong
// direction to be wrong in. Each entry must still be one concrete
// string: a kind (`string`) or anything else that does not generate is
// refused with the engine's `no_gen`.
//
// The rule is deliberately small, and it errs towards refusal:
//
//   - A path is ALLOWED when some `allow` entry is an ancestor of it or
//     equal to it. Being allowed `$.services` allows `$.services.auth`
//     and `$.services.auth.replicas`; it does not allow `$` -- a change
//     at the root reaches every sibling too.
//   - A path is REFUSED when any `deny` entry INTERSECTS it: an
//     ancestor, itself, or a descendant. Denied `$.services.*.tier`
//     refuses `$.services.auth.tier` (the denied node), and it refuses
//     `$.services.auth` and `$.services` too, because a change at
//     either could rewrite the tier. Deny wins over allow whatever the
//     order the entries were written in.
//   - `*` in an entry matches exactly one segment, any key. It is the
//     only pattern character; everything else is a key or a list index
//     compared for equality, as a reference compares them.
//   - A role is ONE KEY of the roles map, looked up as written, and a
//     role the map does not declare may modify nothing.
//
// The answer names the entry that decided it, as a path INTO THE ROLE
// MODEL (`$.roles.dev.deny.0`), so `aontu why` can say who wrote the
// rule and where.

import { Aontu } from './aontu'
import { ConjunctVal } from './val/ConjunctVal'
import { anchorAt } from './vet'
import type { VetFinding } from './vet'
import { evalFailure, nearestKey, pathParts } from './query'
import { includeOpts } from './utility'
import type { IncludeOptions } from './utility'


// Where the roles map lives when the caller does not say.
export const ALLOW_AT = '$.roles'


export type AllowVerdict = 'allowed' | 'refused' | 'error'


// What decided one path: the entry that covers it, the entry that
// intersects it, nothing at all, or a role the model does not declare.
export type AllowReason = 'allow' | 'deny' | 'uncovered' | 'no_role'


export type AllowDecision = {
  path: string          // the asked path, normalised: `$.a.b`
  allowed: boolean
  reason: AllowReason
  by?: string           // the deciding entry's path in the role model
  pattern?: string      // that entry's text, as the author wrote it
}


export type AllowReport = {
  verdict: AllowVerdict
  role: string
  paths: AllowDecision[]
  // G2's finding shape, as every verb reports: empty when the verdict
  // is `allowed`, the engine's own failure when it is `error`, and
  // the `no_path` of an undeclared role beside the refusals.
  findings: VetFinding[]
}


export type AllowOptions = IncludeOptions & {
  // Where the role model came from: relative loads resolve against
  // its directory, and a finding's site names it.
  path?: string
  // The path of the roles map inside the model (default `$.roles`).
  at?: string
}


// One entry: a string that starts at the root and does not end in a
// dot. `re()` refuses a nested quantifier, so the two conditions are
// two patterns rather than one grammar; an empty segment in the middle
// is harmless, because the path split drops it as a reference does.
const ENTRY = 'string & re("^[$]") & re("[^.]$")'

// The shape every role must satisfy, in the language: a list of
// subtree entries to allow, and optionally one to deny.
const ROLE_SHAPE = `{ allow: [&: ${ENTRY}] deny?: [&: ${ENTRY}] }`


// The shape document: a spread over the roles map at `at`, or -- when
// the roles map IS the document -- a top-level spread. Keys are quoted
// the way `aontu set` quotes an overlay line, so a segment may be a
// word the grammar spells otherwise.
function shapeSource(at: string): string {
  const keys = pathParts(at).map((p) => JSON.stringify(p))
  return 0 === keys.length
    ? '&: ' + ROLE_SHAPE
    : keys.join(': ') + ': { &: ' + ROLE_SHAPE + ' }'
}


// `$.a.b` for a segment list, `$` for none: the spelling every report
// uses for a path, whatever the caller wrote.
function pathText(parts: string[]): string {
  return '$' + (0 < parts.length ? '.' + parts.join('.') : '')
}


// The finding shape `get` reports with, deliberately: the gate invents
// no error format of its own.
function finding(
  code: string, path: string, message: string, note?: string): VetFinding {
  return {
    code,
    class: 'reference',
    severity: 'error',
    path,
    message,
    sites: [],
    ...(null == note ? {} : { note }),
  }
}


type Entry = {
  parts: string[]
  text: string
  by: string
}


// The entries of one list of the role, read from the tree. A concrete
// string is taken as written, hidden or not; anything else is asked
// to generate, which is where a kind or a hidden kind fails with the
// engine's own code, and where a preference answers with its default.
function readEntries(
  list: any, by: string, ctx: any,
): { entries: Entry[], finding?: VetFinding } {
  const entries: Entry[] = []
  for (let i = 0; i < list.peg.length; i++) {
    const el: any = list.peg[i]
    const before = ctx.err.length
    const text: string = true === el.isString ? el.peg : el.gen(ctx)
    if (before < ctx.err.length) {
      const err: any = ctx.err[before]
      return { entries, finding: finding(err.why, `${by}.${i}`, err.msg) }
    }
    entries.push({ parts: pathParts(text), text, by: `${by}.${i}` })
  }
  return { entries }
}


// One segment of an entry against one segment of a path: `*` matches
// any key, anything else matches itself.
function segmentMatches(pattern: string, segment: string): boolean {
  return '*' === pattern || pattern === segment
}


// The two subtrees share a node: one is an ancestor of the other, or
// they are the same. Checked over the shorter of the two, because the
// longer one only says where inside the shared subtree it goes on.
function intersects(entry: string[], path: string[]): boolean {
  const n = Math.min(entry.length, path.length)
  for (let i = 0; i < n; i++) {
    if (!segmentMatches(entry[i], path[i])) {
      return false
    }
  }
  return true
}


// The entry is an ancestor of the path, or the path itself. A longer
// entry names something INSIDE the asked subtree, and a change to the
// subtree reaches its siblings, so it does not cover.
function covers(entry: string[], path: string[]): boolean {
  return entry.length <= path.length && intersects(entry, path)
}


function decide(asked: string, allows: Entry[], denies: Entry[]): AllowDecision {
  const parts = pathParts(asked)
  const path = pathText(parts)

  // Deny first, and any intersection refuses: an entry above the path
  // forbids the whole subtree it is in, and one below it forbids the
  // change that would rewrite it from above.
  for (const d of denies) {
    if (intersects(d.parts, parts)) {
      return { path, allowed: false, reason: 'deny', by: d.by, pattern: d.text }
    }
  }
  for (const a of allows) {
    if (covers(a.parts, parts)) {
      return { path, allowed: true, reason: 'allow', by: a.by, pattern: a.text }
    }
  }
  return { path, allowed: false, reason: 'uncovered' }
}


function errorReport(role: string, f: VetFinding): AllowReport {
  return { verdict: 'error', role, paths: [], findings: [f] }
}


// Evaluate the role model, select the role, and decide every path.
export function allow(
  src: string, role: string, paths: string[], opts?: AllowOptions,
): AllowReport {
  const options = opts ?? {}
  const at = pathText(pathParts(options.at ?? ALLOW_AT))

  const aontu = new Aontu(includeOpts(options))
  const ctx = aontu.ctx({ collect: true })
  const parseOpts = null == options.path ? undefined : { path: options.path }

  // The model MEETS the shape as data meets a schema under vet: both
  // parsed, conjoined, and unified ONCE. A parsed tree is single-use,
  // and a model evaluated on its own and then met again has already
  // resolved its references against itself, so a registry written
  // `roles: close({ &: $.Role ... })` would fail its second pass with
  // a `$.Role` it cannot find. The shape is parsed FIRST: the context
  // takes the last parsed document as its root and as the text an
  // error frame excerpts, and both must be the model's.
  const shape = aontu.parse(shapeSource(at), undefined, ctx)
  const model = aontu.parse(src, parseOpts, ctx)
  if (0 < ctx.err.length) {
    return errorReport(role, evalFailure(ctx))
  }
  const root: any = aontu.unify(
    new ConjunctVal({ peg: [model, shape] }, ctx), undefined, ctx)
  if (0 < ctx.err.length || true === root.isNil) {
    return errorReport(role, evalFailure(ctx))
  }

  // The shape made the roles map exist, so what can be missing is the
  // ROLE -- and an undeclared role may modify nothing. That is the
  // question's answer (refused), not a broken model (error), and the
  // finding carries the nearest declared name. The role is one key,
  // looked up as written: not a path, so a name may hold a dot, and
  // an own key only, so a name the prototype has is not a role.
  const roles: any = anchorAt(root, at)
  const atRole = `${at}.${role}`
  if (!Object.prototype.hasOwnProperty.call(roles.peg, role)) {
    const near = nearestKey(role, Object.keys(roles.peg))
    return {
      verdict: 'refused',
      role,
      paths: paths.map((p) => ({
        path: pathText(pathParts(p)), allowed: false, reason: 'no_role',
      })),
      findings: [finding(
        'no_path',
        atRole,
        `The role ${role} is not declared at ${at} in this document.`,
        null == near ? undefined : `did you mean ${near}?`)],
    }
  }
  const node: any = roles.peg[role]

  const allows = readEntries(node.peg.allow, `${atRole}.allow`, ctx)
  if (null != allows.finding) {
    return errorReport(role, allows.finding)
  }
  const denies = readEntries(node.peg.deny, `${atRole}.deny`, ctx)
  if (null != denies.finding) {
    return errorReport(role, denies.finding)
  }

  const decisions = paths.map((p) => decide(p, allows.entries, denies.entries))

  // Nothing asked is nothing allowed: a gate that answered `allowed`
  // to an empty question would let a caller that dropped its
  // arguments through.
  const allowed = 0 < decisions.length && decisions.every((d) => d.allowed)

  return {
    verdict: allowed ? 'allowed' : 'refused',
    role,
    paths: decisions,
    findings: [],
  }
}
