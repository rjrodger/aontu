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
// The shape of a role is aontu too. It is appended to the model at
// evaluation as a spread template over the roles map:
//
//   roles: { &: { allow: [&: string] deny?: [&: string] } }
//
// so a malformed role -- `allow: "$.a"`, `deny: [1]`, a roles map that
// is a number -- is refused by the engine with the engine's own code
// and site, and this module never invents a finding shape of its own.
// A role with no `allow` list allows nothing, because the template's
// empty list is what generates for it.
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
//
// The answer names the entry that decided it, as a path INTO THE ROLE
// MODEL (`$.roles.dev.deny.0`), so `aontu why` can say who wrote the
// rule and where.

import { Aontu } from './aontu'
import { anchorAt } from './vet'
import type { VetFinding } from './vet'
import { evalFailure, noPathFinding, pathParts } from './query'
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


// The shape every role must satisfy, in the language: a list of
// subtree strings to allow, and optionally one to deny.
const ROLE_SHAPE = '{ allow: [&: string] deny?: [&: string] }'


// The template line appended to the model: a spread over the roles
// map at `at`, or -- when the roles map IS the document -- a top-level
// spread. Keys are quoted the way `aontu set` quotes an overlay line,
// so a segment may be a word the grammar spells otherwise.
function shapeLine(at: string): string {
  const keys = pathParts(at).map((p) => JSON.stringify(p))
  return 0 === keys.length
    ? '&: ' + ROLE_SHAPE
    : keys.join(': ') + ': { &: ' + ROLE_SHAPE + ' }'
}


// The model plus its shape, on a line of its own so a source that
// ends mid-line (a trailing comment, say) is not run into it.
function withShape(src: string, at: string): string {
  const head = '' === src || src.endsWith('\n') ? src : src + '\n'
  return head + shapeLine(at) + '\n'
}


// `$.a.b` for a segment list, `$` for none: the spelling every report
// uses for a path, whatever the caller wrote.
function pathText(parts: string[]): string {
  return '$' + (0 < parts.length ? '.' + parts.join('.') : '')
}


type Entry = {
  parts: string[]
  text: string
  by: string
}


function entries(list: string[], by: string): Entry[] {
  return list.map((text, i) => ({
    parts: pathParts(text), text, by: `${by}.${i}`,
  }))
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


// Evaluate the role model, select the role, and decide every path.
export function allow(
  src: string, role: string, paths: string[], opts?: AllowOptions,
): AllowReport {
  const options = opts ?? {}
  const at = pathText(pathParts(options.at ?? ALLOW_AT))

  const aontu = new Aontu(includeOpts(options))
  const ctx = aontu.ctx({ collect: true })
  const parseOpts = null == options.path ? undefined : { path: options.path }
  const root: any = aontu.unify(withShape(src, at), parseOpts, ctx)

  // A model that does not stand up decides nothing: the engine's own
  // first failure is the report, as it is for `get`.
  if (0 < ctx.err.length || null == root || true === root.isNil) {
    return { verdict: 'error', role, paths: [], findings: [evalFailure(ctx)] }
  }

  // The template made the roles map exist, so what can be missing is
  // the ROLE -- and an undeclared role may modify nothing. That is the
  // question's answer (refused), not a broken model (error), and the
  // finding carries the nearest declared name.
  const atRole = `${at}.${role}`
  const node: any = anchorAt(root, atRole)
  if (null == node) {
    return {
      verdict: 'refused',
      role,
      paths: paths.map((p) => ({
        path: pathText(pathParts(p)), allowed: false, reason: 'no_role',
      })),
      findings: [noPathFinding(root, atRole)],
    }
  }

  // Generation is where a role that is not concrete fails -- `allow:
  // [string]` unifies and cannot generate -- and under `collect` the
  // failure lands on the context rather than throwing.
  const before = ctx.err.length
  const gen: any = node.gen(ctx)
  if (before < ctx.err.length) {
    const err: any = ctx.err[before]
    return {
      verdict: 'error',
      role,
      paths: [],
      findings: [{
        code: err.why,
        class: 'reference',
        severity: 'error',
        path: atRole,
        message: err.msg,
        sites: [],
      }],
    }
  }

  const allows = entries(gen.allow, `${atRole}.allow`)
  const denies = entries(gen.deny ?? [], `${atRole}.deny`)
  const decisions = paths.map((p) => decide(p, allows, denies))

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
