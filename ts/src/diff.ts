/* Copyright (c) 2025 Richard Rodger, MIT License */
import { includeOpts } from './utility'


import { Aontu } from './aontu'
import type { TrustOptions } from './type'
import { anchorAt } from './vet'
import type { VetFinding } from './vet'
import { cmpCodePoint } from './keyorder'
import { hcanon } from './hcanon'
import { evalFailure } from './query'


export type DiffKind = 'added' | 'removed' | 'changed'

export type DiffChange = {
  kind: DiffKind
  // The canon on each side, absent where there is no value.
  left?: string
  path: string
  right?: string
}

export type DiffReport = {
  changes: DiffChange[]
  findings: VetFinding[]
  ok: boolean
  same: boolean
}

export type DiffOptions = {
  leftPath?: string
  rightPath?: string
  // Compare at this path of both documents, rather than at the root.
  at?: string

  trust?: TrustOptions

  // Extensions additionally read as text (the CLI's `--text-ext`).
  // Rides beside `trust` because it is the other half of what an
  // include may read.
  textExt?: string[]
}


function pathText(parts: string[]): string {
  return '$' + (0 < parts.length ? '.' + parts.join('.') : '')
}


function walk(
  left: any, right: any, parts: string[], out: DiffChange[]): void {
  if (null == left) {
    out.push({ kind: 'added', path: pathText(parts), right: hcanon(right) })
    return
  }
  if (null == right) {
    out.push({ kind: 'removed', left: hcanon(left), path: pathText(parts) })
    return
  }

  const bothMaps = true === left.isMap && true === right.isMap
  const bothLists = true === left.isList && true === right.isList
  if (bothMaps || bothLists) {
    const lc = null == left.spread.cj ? undefined : hcanon(left.spread.cj)
    const rc = null == right.spread.cj ? undefined : hcanon(right.spread.cj)
    if (lc !== rc) {
      out.push({
        kind: null == lc ? 'added' : null == rc ? 'removed' : 'changed',
        ...(null == lc ? {} : { left: lc }),
        path: pathText(parts.concat('&')),
        ...(null == rc ? {} : { right: rc }),
      })
    }
    flag(left.closed, right.closed, parts, 'closed', out)
    flag(left.mark?.type, right.mark?.type, parts, 'type', out)
    flag(left.mark?.hide, right.mark?.hide, parts, 'hide', out)

    const keys = bothMaps
      ? [...new Set([
        ...Object.keys(left.peg), ...Object.keys(right.peg),
      ])].sort(cmpCodePoint)
      : [...new Set([
        ...Object.keys(left.peg), ...Object.keys(right.peg),
      ])].sort((a, b) => Number(a) - Number(b))
    for (const k of keys) {
      walk(left.peg[k], right.peg[k], parts.concat(k), out)
    }
    return
  }

  const lh = hcanon(left)
  const rh = hcanon(right)
  if (lh !== rh) {
    out.push({ kind: 'changed', left: lh, path: pathText(parts), right: rh })
  }
}


// One boolean attribute of a bag, as a pseudo-key: `$.a.&closed` says
// the map at `$.a` was closed (or opened) without saying anything
// about its keys.
function flag(
  left: any, right: any, parts: string[], name: string,
  out: DiffChange[]): void {
  const l = true === left
  const r = true === right
  if (l !== r) {
    out.push({
      kind: 'changed',
      left: String(l),
      path: pathText(parts.concat('&' + name)),
      right: String(r),
    })
  }
}


function evalSide(
  aontu: Aontu, src: string, path: string | undefined, at: string | undefined,
): { node?: any, finding?: VetFinding } {
  const ctx = aontu.ctx({ collect: true })
  const parseOpts = null == path ? undefined : { path }
  const root: any = aontu.unify(src, parseOpts, ctx)
  if (0 < ctx.err.length) {
    // The query surface's own fold: a document that does not stand up
    // has no meaning to compare, and the engine's diagnosis is the
    // report.
    return { finding: evalFailure(ctx) }
  }
  const node: any = null == at ? root : anchorAt(root, at)
  if (null == node) {
    return {
      finding: {
        code: 'no_path',
        class: 'reference',
        severity: 'error',
        path: at as string,
        message: `The path ${at} names nothing in this document.`,
        sites: [],
      },
    }
  }
  return { node }
}


export function diff(
  leftSrc: string, rightSrc: string, opts?: DiffOptions): DiffReport {
  const options = opts ?? {}
  const aontu = new Aontu(includeOpts(options))

  const l = evalSide(aontu, leftSrc, options.leftPath, options.at)
  const r = evalSide(aontu, rightSrc, options.rightPath, options.at)
  const findings = [l.finding, r.finding].filter(Boolean) as VetFinding[]
  if (0 < findings.length) {
    return { changes: [], findings, ok: false, same: false }
  }

  const changes: DiffChange[] = []
  walk(l.node, r.node, [], changes)
  return { changes, findings: [], ok: true, same: 0 === changes.length }
}
