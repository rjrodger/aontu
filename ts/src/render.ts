/* Copyright (c) 2025 Richard Rodger, MIT License */


// THE RENDERER (docs/design/RENDER.0.md; docs/capability-review/
// g9-transformation.md §3). `render` evaluates a document, takes the
// value at `--at` (the root by default), vets it against the bundled
// `aontu:code` vocabulary, and folds `code.units` into bytes;
// `renderValue` is the fold alone, over `generate()` output. The fold
// is pure and total: it never touches the Val tree, never reads or
// writes a file, never sorts and never iterates a map, and every piece
// of a fragment carries its own depth (`at`), so the renderer owns
// every prefix and no piece nests another (the second amendment's
// fragment algebra, RENDER.0.md D2 and D6).
//
// WHAT THIS PHASE RENDERS (RENDER.0.md P3): fragments -- a line, a
// blank run, a raw block, a bare string piece, a reference inline --
// and the `text` escape, under a profile that knows its language. The
// one bundled profile is `aontu:lang/text`, which every fragment-only
// unit falls back to; a declaration (`record`, `enum`, ...) needs a
// LOWERING, which P5 brings with the TypeScript and Go profiles, and
// until then is `render_profile`.

import { Aontu } from './aontu'
import { vet, failureFinding, anchorAt } from './vet'
import type { VetFinding } from './vet'
import { hcanon } from './hcanon'
import { makeNilErr } from './err'
import { cmpCodePoint } from './keyorder'
import { includeOpts } from './utility'
import type { IncludeOptions } from './utility'
import { lowerDecl, lowerHeader, ident } from './lower'
import type { LowerCtx } from './lower'


export type RenderVerdict = 'ok' | 'lossy' | 'error'

// One rendered unit: the path the instance gave it, its language, and
// its bytes, as one string.
export type RenderUnit = {
  path: string
  lang: string
  text: string
}

// THE THREE LOSS TIERS (RENDER.0.md D7). Tier 1 is a check the target's
// type system cannot enforce (the declaration lowering's, P5); tier 2
// a fragment -- structured, re-indentable, terminator-checked, saying
// nothing about target syntax; tier 3 an opaque escape, a `text`
// declaration or a `raw` piece. `strict` refuses tier 3 and only
// tier 3.
export type RenderLoss = {
  unit: string
  path: string
  tier: 1 | 2 | 3
  construct: string
  reason: string
}

// ONE PIECE'S PROVENANCE (RENDER.0.md D9, D11; P7). A dispatch stamps
// every piece it emits with the node it matched and the rule it took,
// and the fold reads the stamps back off the instance: `piece` is the
// piece's own path there, `unit` the unit it landed in, `node` the
// model address the rule matched, and `rule` the rule's address --
// its table's, then `#`, then its index in that table.
export type RenderTrace = {
  unit: string
  piece: string
  node: string
  rule: string
}

// THE COVERAGE REPORT (P7; G9 §6, "coverage cuts both ways"). Two
// lists, and both are set computations over what the run recorded.
export type RenderCoverage = {
  // Every model path a reference resolved to, in walk order: what the
  // render READ.
  read: string[]
  // Dead model: the SHALLOWEST model paths no read reached. A path
  // whose subtree holds a read is not named; its unread children are.
  dead: string[]
  // A silent hole: a rendered declaration no rule produced. In a
  // document with no rule table that is every declaration, which is
  // the true statement about it -- the rule layer governs none of this
  // output.
  unruled: { unit: string, path: string }[]
}

export type RenderReport = {
  verdict: RenderVerdict
  // In `units[]` order. Empty on `error`.
  units: RenderUnit[]
  // Per unit and path. Empty on `error`.
  lossy: RenderLoss[]
  // On `error` only, in vet's finding shape: the document did not
  // stand up, the instance is not `aontu:code`, or a unit could not be
  // rendered (`render_*`).
  errors?: VetFinding[]
  // The dispatch trace, under `trace` or `coverage` (P7), in document
  // order. Absent when it is empty, on `error`, and from
  // `renderValue`, which folds an instance the recorder never watched
  // being built.
  trace?: RenderTrace[]
  // The coverage report, under `coverage` (P7).
  coverage?: RenderCoverage
}

export type RenderOptions = IncludeOptions & {
  // The value to render, a path into the document. Absent means the
  // root.
  at?: string
  // Where the document CAME FROM, so a relative `@"file"` load inside
  // it resolves from its own directory.
  path?: string
  // Profiles supplied by the caller, each an evaluated profile map
  // (`{lang, indent, ...}`), matched to a unit by `lang` before the
  // bundled set is asked (RENDER.0.md D5, step 1).
  profiles?: any[]
  // Render only the unit at this path.
  unit?: string
  // Refuse tier-3 loss: the opaque escapes.
  strict?: boolean
  // RECORD THE DISPATCH TRACE (P7). Off by default: an instrumented
  // run stamps every value a reference resolves and every piece a rule
  // emits, and an ordinary one pays one property load per meet.
  trace?: boolean
  // Compute the coverage report, which needs the trace and turns it on.
  coverage?: boolean
  // Measure coverage under this path only, instead of the document
  // root (RENDER.0.md X-3). The narrower measure a document with its
  // model under one key wants.
  coverageAt?: string
}


const VOCABULARY = '@"aontu:code"'
// The bundled profiles, by lang: aontu:lang/<lang>.
const BUNDLED_LANGS = ['go', 'text', 'typescript']
const PROFILE_VOCABULARY = '@"aontu:profile"'


function finding(
  code: string, cls: string, path: string, message: string
): VetFinding {
  return { code, class: cls as any, severity: 'error', path, message, sites: [] }
}


function errorReport(errors: VetFinding[]): RenderReport {
  return { verdict: 'error', units: [], lossy: [], errors }
}


// The verb's evaluation, before the fold (RENDER.0.md D1): evaluate,
// anchor, vet the anchored value against the vocabulary as `aontu vet`
// would, and generate the MEET of the two -- so the vocabulary's
// defaults (`at: 0`, `n: 1`, `reindent: true`) are in the instance the
// fold reads, whether or not the document included the vocabulary
// itself. THE VET AND THE MEET READ THE SETTLED VALUE, re-sourced
// through its hash form (valid source that evaluates to the same
// value), not the document's text: a fragment's lines are what a
// transform COMPUTED -- an `emit`, a `join` -- and the vocabulary's
// alternatives are tried against values, not against calls that are
// still waiting to fire. A finding from that vet therefore addresses
// the instance by path, which is the addressing every render finding
// uses (G9 §3); a document that does not stand up at all is reported
// with its own sites, before any of this.
export function render(src: string, options?: RenderOptions): RenderReport {
  const opts = options ?? {}
  const aontu = new Aontu(includeOpts(opts))

  // THE RECORDER (P7), on for a run that was asked for a trace or a
  // coverage report and off for every other. Its presence is the one
  // switch: the read set fills as references resolve, and the two
  // riders that carry a read address and a dispatch stamp are written
  // only while it is there.
  const rec = true === opts.trace || true === opts.coverage
  const reads = rec ? new Set<string>() : undefined

  // COLLECT MODE, so a syntax error arrives on the context rather than
  // as a throw (the jsonschema and vet precedent; no try/catch, for
  // the reason those verbs have none).
  const actx = aontu.ctx({ collect: true, reads })
  const root: any = aontu.unify(src, { path: opts.path, collect: true }, actx)
  if (0 < actx.err.length || true === root?.isNil) {
    return errorReport([failureFinding(actx, opts.path, root)])
  }

  let node: any = root
  if (null != opts.at && '' !== opts.at) {
    const found: any = anchorAt(root, opts.at)
    if (null == found) {
      // The anchor names nothing: a `no_path` nil through the finding
      // shape every other refusal here uses.
      const nil: any = makeNilErr(actx, 'no_path', root, undefined, 'at')
      actx.err.push(nil)
      return errorReport([failureFinding(actx, opts.path, root)])
    }
    node = found
  }

  // UNDER NO CALLER CAPABILITY, here and in the meet below: the
  // vocabulary is the engine's own and the instance is a canon, which
  // includes nothing, so the caller's include capability -- which
  // governs the DOCUMENT -- has nothing to govern here, and `none`
  // must not deny the renderer its own schema.
  const value = hcanon(node)
  const report = vet(VOCABULARY, value)
  if ('valid' !== report.verdict) {
    return errorReport(report.findings)
  }

  // The meet, keyed: the vocabulary's root holds `code`, and so does
  // the instance's (a value the vet admitted is a map), and a document
  // with no `code` at all is the vocabulary's own empty instance.
  const codeVal: any = node.peg.code
  const instance = new Aontu().generate(
    VOCABULARY + (undefined === codeVal ? '' : '\ncode: ' + hcanon(codeVal)))
  const folded = renderValue(instance, opts)

  // THE TWO REPORTS ARE JOINED TO THE FOLD BY PATH (P7), which is what
  // lets the fold stay the pure total function D6 asks for: the
  // dispatch stamps ride the VALUE, the instance the fold reads is
  // that value re-sourced through its hash form, and a piece is at the
  // same path in both. Nothing to report on `error`: there are no
  // units to attribute pieces to.
  if (rec && 'error' !== folded.verdict) {
    const marks = emitted(node)
    const trace = traceOf(marks, instance, folded.units)
    // AN EMPTY TRACE IS NO TRACE, in both ports: Go omits an empty
    // slice, and a report shape that differed by port would be the one
    // thing the shared rows exist to refuse. A run that emitted no
    // piece has nothing to attribute, and the coverage report says so
    // in its own words.
    if (0 < trace.length) {
      folded.trace = trace
    }
    if (true === opts.coverage) {
      const cov = coverOf(root, node, reads as Set<string>, opts, marks,
        instance, folded.units)
      if (undefined === cov) {
        const nil: any = makeNilErr(actx, 'no_path', root, undefined,
          'coverageAt')
        actx.err.push(nil)
        return errorReport([failureFinding(actx, opts.path, root)])
      }
      folded.coverage = cov
    }
  }
  return folded
}


// ---------------------------------------------------------------------
// THE TRACE AND THE COVERAGE REPORT (RENDER.0.md D11, P7).

// The one walk order both ports walk in: a list by index, a map by key
// in code-point order. `fn` answers whether to descend.
function walkVals(root: any, fn: (v: any, path: string[]) => boolean): void {
  const walk = (v: any, path: string[]): void => {
    if (null == v || true !== v.isVal || !fn(v, path)) {
      return
    }
    if (true === v.isList && null != v.peg) {
      for (let i = 0; i < v.peg.length; i++) {
        walk(v.peg[i], [...path, String(i)])
      }
    }
    else if (true === v.isMap && null != v.peg) {
      for (const k of Object.keys(v.peg).sort(cmpCodePoint)) {
        // AN ALIAS DECLARATION IS NOT A MEMBER, here for the reason
        // every fold has it (./val/members.ts): `%wire = …` holds a
        // value the document never generates, so it is neither a piece
        // to trace nor model that could be called dead.
        if (!v.aliasKeys.includes(k)) {
          walk(v.peg[k], [...path, k])
        }
      }
    }
  }
  walk(root, [])
}


// A path as an address: `$`, then a dot before every segment.
function addr(path: string[]): string {
  return '$' + path.map((seg) => '.' + seg).join('')
}


// Every piece a dispatch stamped, under the anchored value, in
// document order. The path is relative to the anchor, which is where
// the instance the fold reads is rooted too.
function emitted(node: any): { path: string, mark: any }[] {
  const out: { path: string, mark: any }[] = []
  walkVals(node, (v: any, path: string[]) => {
    if (null != v.emitted) {
      out.push({ path: addr(path), mark: v.emitted })
    }
    return true
  })
  return out
}


// The trace: one entry per stamped piece that a RENDERED unit holds. A
// piece is IN the unit whose path prefixes its own, which is the whole
// of the question -- no path is parsed, and a stamp that lies under no
// unit at all (a rule set held under a key of its own, and referred to
// from a unit) simply matches nothing. A unit the run did not render
// (`--unit` names one) has no bytes for a piece of it to be in, so it
// is not among the prefixes either.
function traceOf(marks: { path: string, mark: any }[], instance: any,
  units: RenderUnit[]): RenderTrace[] {
  const pre: { at: string, path: string }[] = []
  unitList(instance).forEach((u: any, i: number) => {
    if (units.some((r) => r.path === u.path)) {
      pre.push({ at: '$.code.units.' + i, path: u.path })
    }
  })
  const out: RenderTrace[] = []
  for (const m of marks) {
    const hit = pre.find((p) => m.path === p.at || m.path.startsWith(p.at + '.'))
    if (undefined === hit) {
      continue
    }
    out.push({ unit: hit.path, piece: m.path, node: m.mark.node, rule: m.mark.rule })
  }
  return out
}


// Every proper ancestor of an address, `$` included.
function ancestors(a: string): string[] {
  const parts = a.split('.')
  const out: string[] = []
  for (let i = 1; i < parts.length; i++) {
    out.push(parts.slice(0, i).join('.'))
  }
  return out
}


// Is the value at `a` covered by the set -- the address itself in it,
// or an address above it? An address ABOVE it covers the whole subtree:
// a reference that read `$.schema` read everything under it, and a rule
// that emitted a unit emitted every declaration in it.
function covered(set: Set<string>, a: string): boolean {
  if (set.has(a)) {
    return true
  }
  for (const up of ancestors(a)) {
    if (set.has(up)) {
      return true
    }
  }
  return false
}


// THE COVERAGE REPORT (P7). Dead model is measured over the DOCUMENT
// ROOT, or under `coverageAt` when a document keeps its model under one
// key (X-3, decided here): the read set is absolute, so a narrower
// measure is a narrower walk, not a different origin. The render's own
// output -- `code` under the anchor -- is not model and is never
// walked into: nothing reads it, so every document would otherwise
// report it dead.
function coverOf(root: any, node: any, reads: Set<string>,
  opts: RenderOptions, marks: { path: string, mark: any }[], instance: any,
  units: RenderUnit[]): RenderCoverage | undefined {
  // THE ANCHOR IS THE ONE render() ALREADY FOUND, so `code` under it is
  // named without asking a second time: `--at` is resolved before the
  // vet, and an anchor that named nothing never reached here.
  const codeAddr = addr(node.path.concat('code'))

  let from: any = root
  let base: string[] = []
  if (null != opts.coverageAt && '' !== opts.coverageAt) {
    const found: any = anchorAt(root, opts.coverageAt)
    if (null == found) {
      return undefined
    }
    from = found
    base = found.path
  }

  // The two questions asked of the read set, as sets: is this address
  // read (or under one that is), and does a read lie BELOW it?
  const above = new Set<string>(reads)
  const below = new Set<string>()
  for (const r of reads) {
    for (const up of ancestors(r)) {
      below.add(up)
    }
  }

  const dead: string[] = []
  walkVals(from, (_v: any, path: string[]) => {
    const a = addr(base.concat(path))
    if (a === codeAddr || covered(above, a)) {
      return false
    }
    // THE ROOT OF THE MEASURE IS NEVER ITSELF DEAD MODEL, and is
    // descended into whatever the read set holds. A document that is
    // only a transform reads nothing above its own model, and naming
    // the root there would report the whole document dead while its
    // one live subtree sat inside it.
    if (below.has(a) || 0 === path.length) {
      return true
    }
    dead.push(a)
    return false
  })

  // A SILENT HOLE: a declaration of a rendered unit that no stamp
  // touches -- neither its own, nor one on the unit above it, nor one
  // on a piece inside it.
  const stamped = new Set<string>(marks.map((m) => m.path))
  const inside = new Set<string>()
  for (const m of marks) {
    for (const up of ancestors(m.path)) {
      inside.add(up)
    }
  }
  const unruled: { unit: string, path: string }[] = []
  unitList(instance).forEach((unit: any, i: number) => {
    if (!units.some((u) => u.path === unit.path)) {
      return
    }
    const decls: any[] = unit.decls
    decls.forEach((_d: any, j: number) => {
      const a = '$.code.units.' + i + '.decls.' + j
      if (!covered(stamped, a) && !inside.has(a)) {
        unruled.push({ unit: unit.path, path: a })
      }
    })
  })

  return { read: [...reads].sort(cmpCodePoint), dead, unruled }
}


// The bundled text profile, evaluated once: the profile of a unit
// whose declarations are fragments and text escapes only.
const bundled: Record<string, any> = {}

// A bundled profile, evaluated once: the meet of aontu:lang/<lang>
// with the vocabulary, so its defaults are in it.
function bundledProfile(lang: string): any {
  if (!BUNDLED_LANGS.includes(lang)) {
    return undefined
  }
  if (undefined === bundled[lang]) {
    bundled[lang] = new Aontu().generate('@"aontu:lang/' + lang + '"').profile
  }
  return bundled[lang]
}


// PROFILE SELECTION, per unit (RENDER.0.md D5): a caller-supplied
// profile whose `lang` is the unit's; else the bundled profile of that
// `lang`; else `aontu:lang/text`, if and only if every declaration in
// the unit is a fragment or a text escape; else nothing, which the
// caller reports as `render_profile`. The unit's inline `profile` is
// merged over whichever base was found.
function profileFor(lang: string, given: any[] | undefined, fragOnly: boolean): any {
  const supplied = (given ?? []).find((p: any) => p?.lang === lang)
  if (undefined !== supplied) {
    return supplied
  }
  const own = bundledProfile(lang)
  if (undefined !== own) {
    return own
  }
  return fragOnly ? bundledProfile('text') : undefined
}


function isMap(v: any): boolean {
  return null != v && 'object' === typeof v && !Array.isArray(v)
}


// An inline profile merged over its base, map by map, the inline
// value winning at a leaf; keys in code-point order, so the merge is
// the same in both ports.
function mergeProfile(base: any, over: any): any {
  const out: any = { ...base }
  for (const k of Object.keys(over).sort(cmpCodePoint)) {
    out[k] = isMap(base[k]) && isMap(over[k]) ?
      mergeProfile(base[k], over[k]) : over[k]
  }
  return out
}


// THE FOLD (RENDER.0.md D6). `pad(at)` is `indent.unit` repeated
// `indent.width × at` times; a line is `pad + text + LF`, and an empty
// text emits no pad; a blank is its terminators alone; a raw block's
// lines each get the pad unless `reindent: false`, which emits them
// at column 0 verbatim -- and common leading indentation is never
// stripped. A reference inline is its name, verbatim (a
// declaration-capable profile puts it through its identifier rules,
// P5). Nothing is trimmed (D3): the text is the transform's.
// A profile with no indent -- a caller-supplied map the vocabulary
// never filled -- takes the vocabulary's own default, two spaces.
function pad(profile: any, at: number): string {
  const indent = profile.indent ?? { unit: ' ', width: 2 }
  return (indent.unit ?? ' ').repeat((indent.width ?? 2) * at)
}

function line(profile: any, at: number, text: string): string {
  return ('' === text ? '' : pad(profile, at)) + text + '\n'
}

// A reference inline is its name: through the profile's identifier
// rules under a lowering, verbatim under text.
function inline(piece: any, ctx: LowerCtx | undefined): string {
  if ('string' === typeof piece) {
    return piece
  }
  return undefined === ctx ? piece.name : ident(piece.name, 'record', ctx, '', false)
}

function foldPiece(
  piece: any, profile: any, unit: string, path: string, lossy: RenderLoss[],
  ctx?: LowerCtx
): string {
  if ('string' === typeof piece) {
    return line(profile, 0, piece)
  }
  if ('line' === piece.k) {
    return line(profile, piece.at ?? 0, piece.of.map((p: any) => inline(p, ctx)).join(''))
  }
  if ('blank' === piece.k) {
    return '\n'.repeat(piece.n ?? 1)
  }
  lossy.push({
    unit, path, tier: 3, construct: 'raw',
    reason: 'verbatim text: the renderer re-indents it and checks nothing else',
  })
  const at: number = piece.at ?? 0
  const reindent: boolean = piece.reindent ?? true
  const lines: string[] = piece.text.split('\n')
  if ('' === lines[lines.length - 1]) {
    lines.pop()
  }
  return lines.map((l: string) => reindent ? line(profile, at, l) : l + '\n').join('')
}


// A PROFILE DOCUMENT (RENDER.0.md D5), evaluated the way `render`
// evaluates its own: under the caller's include options, then vetted
// against aontu:profile as a settled value and met with that vocabulary
// so its defaults (`indent.width: 2`, ...) are in it. The answer is the
// `profile` map the fold reads -- what `--profile <file>` hands to
// RenderOptions.profiles -- or the findings that refused the document:
// one that does not stand up, or one the vocabulary rejects.
export function renderProfile(src: string, options?: RenderOptions):
  { profile?: any, errors?: VetFinding[] } {
  const opts = options ?? {}
  const aontu = new Aontu(includeOpts(opts))
  const actx = aontu.ctx({ collect: true })
  const root: any = aontu.unify(src, { path: opts.path, collect: true }, actx)
  if (0 < actx.err.length || true === root?.isNil) {
    return { errors: [failureFinding(actx, opts.path, root)] }
  }
  const report = vet(PROFILE_VOCABULARY, hcanon(root))
  if ('valid' !== report.verdict) {
    return { errors: report.findings }
  }
  // The meet, keyed as render's is: the vocabulary requires `profile`,
  // so a value the vet admitted has one.
  const instance = new Aontu().generate(
    PROFILE_VOCABULARY + '\nprofile: ' + hcanon(root.peg.profile))
  return { profile: instance.profile }
}


// The instance's unit list, or none: `code` is the vocabulary's own
// key and is always there, `units` is not. One reader, so the fold,
// the trace and the coverage report all see the same list.
function unitList(instance: any): any[] {
  return Array.isArray(instance?.code?.units) ? instance.code.units : []
}


// The fold alone, over `generate()` output: the instance is
// `{code: {units: [...]}}` as the vocabulary shapes it, with its
// defaults filled -- which is what `render` hands over, and what a
// caller of this function is responsible for.
export function renderValue(instance: any, options?: RenderOptions): RenderReport {
  const opts = options ?? {}
  const errors: VetFinding[] = []
  const lossy: RenderLoss[] = []
  const units: RenderUnit[] = []
  const list: any[] = unitList(instance)

  const seen: string[] = []
  let selected = 0
  list.forEach((unit: any, i: number) => {
    const upath = '$.code.units.' + i
    const path: string = unit.path
    const lang: string = unit.lang

    // A UNIT PATH IS RELATIVE, DESCENDS, AND IS ITS OWN (RENDER.0.md
    // D8): an absolute path, a `..` segment or a repeat of another
    // unit's path is refused before anything is written.
    if (path.startsWith('/')) {
      errors.push(finding('render_path', 'parse', upath + '.path',
        'the unit path ' + path + ' is absolute.'))
      return
    }
    if (path.split('/').includes('..')) {
      errors.push(finding('render_path', 'parse', upath + '.path',
        'the unit path ' + path + ' climbs out of the output directory.'))
      return
    }
    if (seen.includes(path)) {
      errors.push(finding('render_path', 'parse', upath + '.path',
        'the unit path ' + path + ' repeats another unit\'s.'))
      return
    }
    seen.push(path)

    if (undefined !== opts.unit && opts.unit !== path) {
      return
    }
    selected++

    const decls: any[] = unit.decls
    const fragOnly = decls.every((d: any) => 'frag' === d.k || 'text' === d.k)
    const base = profileFor(lang, opts.profiles, fragOnly)
    if (undefined === base) {
      errors.push(finding('render_profile', 'parse', upath + '.lang',
        'no profile renders ' + lang + ': a declaration needs a lowering, and ' +
        'only fragments and text escapes render under aontu:lang/text.'))
      return
    }
    const profile = null == unit.profile ? base : mergeProfile(base, unit.profile)

    // THE LOWERING (D5, P5), when the profile names one: the unit's
    // header -- banner, package clause, imports -- and each declaration
    // as pieces the fold takes, a blank line between two lowered
    // declarations. A fragment or a text escape owns its own blanks.
    const family: string | undefined = profile.lowering
    const ctx: LowerCtx | undefined = undefined === family ? undefined
      : { profile, family, unit: path, lossy }

    let text = ''
    if (undefined !== ctx) {
      const header = lowerHeader(unit, instance?.code?.source, ctx)
      for (const piece of header) {
        text += foldPiece(piece, profile, path, upath, lossy, ctx)
      }
      if (0 < header.length && 0 < decls.length) {
        text += '\n'
      }
    }
    let lowered = false
    decls.forEach((decl: any, j: number) => {
      const dpath = upath + '.decls.' + j
      if ('frag' === decl.k) {
        lowered = false
        lossy.push({
          unit: path, path: dpath, tier: 2, construct: 'frag',
          reason: 'a fragment says nothing about ' + lang + ' syntax',
        })
        decl.of.forEach((piece: any, n: number) => {
          text += foldPiece(piece, profile, path, dpath + '.of.' + n, lossy, ctx)
        })
      }
      else if ('text' === decl.k) {
        lowered = false
        if (decl.lang !== lang) {
          errors.push(finding('render_lang', 'conflict', dpath + '.lang',
            'the text escape is ' + decl.lang + ' in a ' + lang + ' unit.'))
          return
        }
        lossy.push({
          unit: path, path: dpath, tier: 3, construct: 'text',
          reason: 'verbatim ' + lang + ': the renderer checks nothing in it',
        })
        text += decl.text
      }
      else if (undefined !== ctx) {
        if (lowered) {
          text += '\n'
        }
        for (const piece of lowerDecl(decl, dpath, ctx)) {
          text += foldPiece(piece, profile, path, dpath, lossy, ctx)
        }
        lowered = true
      }
      else {
        errors.push(finding('render_profile', 'parse', dpath + '.k',
          'a ' + decl.k + ' declaration has no lowering under the ' +
          profile.lang + ' profile.'))
      }
    })

    units.push({ path, lang, text })
  })

  if (undefined !== opts.unit && 0 === selected) {
    errors.push(finding('render_unit', 'reference', '$.code.units',
      'no unit has the path ' + opts.unit + '.'))
  }

  if (true === opts.strict) {
    for (const loss of lossy) {
      if (3 === loss.tier) {
        errors.push(finding('render_strict', 'conflict', loss.path,
          'the ' + loss.construct + ' in ' + loss.unit +
          ' is an opaque escape, refused under strict.'))
      }
    }
  }

  if (0 < errors.length) {
    return errorReport(errors)
  }
  return {
    verdict: 0 < lossy.length ? 'lossy' : 'ok',
    units,
    lossy,
  }
}
