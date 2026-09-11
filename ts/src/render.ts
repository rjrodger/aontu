/* Copyright (c) 2025 Richard Rodger, MIT License */


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

export type RenderLoss = {
  unit: string
  path: string
  tier: 1 | 2 | 3
  construct: string
  reason: string
}

export type RenderTrace = {
  unit: string
  piece: string
  node: string
  rule: string
}

export type RenderCoverage = {
  // Every model path a reference resolved to, in walk order: what the
  // render READ.
  read: string[]
  // Dead model: the SHALLOWEST model paths no read reached. A path
  // whose subtree holds a read is not named; its unread children are.
  dead: string[]
  unruled: { unit: string, path: string }[]
}

export type RenderReport = {
  verdict: RenderVerdict
  units: RenderUnit[]
  // Per unit and path. Empty on `error`.
  lossy: RenderLoss[]
  errors?: VetFinding[]
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
  profiles?: any[]
  // Render only the unit at this path.
  unit?: string
  strict?: boolean
  trace?: boolean
  // Compute the coverage report, which needs the trace and turns it on.
  coverage?: boolean
  coverageAt?: string
}


const VOCABULARY = '@"aontu:code"'
// The bundled profiles, by lang: aontu:render/lang/<lang>.
const BUNDLED_LANGS = ['go', 'markdown', 'text', 'typescript']
const PROFILE_VOCABULARY = '@"aontu:render"'


function finding(
  code: string, cls: string, path: string, message: string
): VetFinding {
  return { code, class: cls as any, severity: 'error', path, message, sites: [] }
}


function errorReport(errors: VetFinding[]): RenderReport {
  return { verdict: 'error', units: [], lossy: [], errors }
}


export function render(src: string, options?: RenderOptions): RenderReport {
  const opts = options ?? {}
  const aontu = new Aontu(includeOpts(opts))

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

  const value = hcanon(node)
  const report = vet(VOCABULARY, value)
  if ('valid' !== report.verdict) {
    return errorReport(report.findings)
  }

  const codeVal: any = node.peg.aontu?.peg?.Code
  const instance = new Aontu().generate(
    VOCABULARY + (undefined === codeVal ? '' : '\naontu: Code: ' + hcanon(codeVal)))
  const folded = renderValue(instance, opts)

  if (rec && 'error' !== folded.verdict) {
    const marks = emitted(node)
    const trace = traceOf(marks, instance, folded.units)
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


function traceOf(marks: { path: string, mark: any }[], instance: any,
  units: RenderUnit[]): RenderTrace[] {
  const pre: { at: string, path: string }[] = []
  unitList(instance).forEach((u: any, i: number) => {
    if (units.some((r) => r.path === u.path)) {
      pre.push({ at: '$.aontu.Code.units.' + i, path: u.path })
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


function coverOf(root: any, node: any, reads: Set<string>,
  opts: RenderOptions, marks: { path: string, mark: any }[], instance: any,
  units: RenderUnit[]): RenderCoverage | undefined {
  // THE ANCHOR IS THE ONE render() ALREADY FOUND, so the namespace
  // under it is named without asking a second time: `--at` is resolved
  // before the vet, and an anchor that named nothing never reached here.
  const codeAddr = addr(node.path.concat('aontu'))

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
      const a = '$.aontu.Code.units.' + i + '.decls.' + j
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

// A bundled profile, evaluated once: the meet of aontu:render/lang/<lang>
// with the vocabulary, so its defaults are in it.
function bundledProfile(lang: string): any {
  if (!BUNDLED_LANGS.includes(lang)) {
    return undefined
  }
  if (undefined === bundled[lang]) {
    bundled[lang] = new Aontu().generate('@"aontu:render/lang/' + lang + '"').aontu.render.Lang
  }
  return bundled[lang]
}


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
    PROFILE_VOCABULARY + '\naontu: render: Lang: ' +
    hcanon(root.peg.aontu.peg.render.peg.Lang))
  return { profile: instance.aontu.render.Lang }
}


// The instance's unit list, or none: `code` is the vocabulary's own
// key and is always there, `units` is not. One reader, so the fold,
// the trace and the coverage report all see the same list.
function unitList(instance: any): any[] {
  return Array.isArray(instance?.aontu?.Code?.units) ?
    instance.aontu.Code.units : []
}


export function renderValue(instance: any, options?: RenderOptions): RenderReport {
  const opts = options ?? {}
  const errors: VetFinding[] = []
  const lossy: RenderLoss[] = []
  const units: RenderUnit[] = []
  const list: any[] = unitList(instance)

  const seen: string[] = []
  let selected = 0
  list.forEach((unit: any, i: number) => {
    const upath = '$.aontu.Code.units.' + i
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
        'only fragments and text escapes render under aontu:render/lang/text.'))
      return
    }
    const profile = null == unit.profile ? base : mergeProfile(base, unit.profile)

    const family: string | undefined = profile.lowering
    const ctx: LowerCtx | undefined = undefined === family ? undefined
      : { profile, family, unit: path, lossy }

    let text = ''
    if (undefined !== ctx) {
      const header = lowerHeader(unit, instance?.aontu?.Code?.source, ctx)
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
    errors.push(finding('render_unit', 'reference', '$.aontu.Code.units',
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
