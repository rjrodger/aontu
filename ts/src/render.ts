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
}


const VOCABULARY = '@"aontu:code"'
const TEXT_PROFILE = '@"aontu:lang/text"'
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

  // COLLECT MODE, so a syntax error arrives on the context rather than
  // as a throw (the jsonschema and vet precedent; no try/catch, for
  // the reason those verbs have none).
  const actx = aontu.ctx({ collect: true })
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
  return renderValue(instance, opts)
}


// The bundled text profile, evaluated once: the profile of a unit
// whose declarations are fragments and text escapes only.
let textProfile: any = undefined

function bundledText(): any {
  if (undefined === textProfile) {
    textProfile = new Aontu().generate(TEXT_PROFILE).profile
  }
  return textProfile
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
  if ('text' === lang || fragOnly) {
    return bundledText()
  }
  return undefined
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
function pad(profile: any, at: number): string {
  return profile.indent.unit.repeat(profile.indent.width * at)
}

function line(profile: any, at: number, text: string): string {
  return ('' === text ? '' : pad(profile, at)) + text + '\n'
}

function inline(piece: any): string {
  return 'string' === typeof piece ? piece : piece.name
}

function foldPiece(
  piece: any, profile: any, unit: string, path: string, lossy: RenderLoss[]
): string {
  if ('string' === typeof piece) {
    return line(profile, 0, piece)
  }
  if ('line' === piece.k) {
    return line(profile, piece.at ?? 0, piece.of.map(inline).join(''))
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


// The fold alone, over `generate()` output: the instance is
// `{code: {units: [...]}}` as the vocabulary shapes it, with its
// defaults filled -- which is what `render` hands over, and what a
// caller of this function is responsible for.
export function renderValue(instance: any, options?: RenderOptions): RenderReport {
  const opts = options ?? {}
  const errors: VetFinding[] = []
  const lossy: RenderLoss[] = []
  const units: RenderUnit[] = []
  const list: any[] = Array.isArray(instance?.code?.units) ? instance.code.units : []

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

    let text = ''
    decls.forEach((decl: any, j: number) => {
      const dpath = upath + '.decls.' + j
      if ('frag' === decl.k) {
        lossy.push({
          unit: path, path: dpath, tier: 2, construct: 'frag',
          reason: 'a fragment says nothing about ' + lang + ' syntax',
        })
        decl.of.forEach((piece: any, n: number) => {
          text += foldPiece(piece, profile, path, dpath + '.of.' + n, lossy)
        })
      }
      else if ('text' === decl.k) {
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
