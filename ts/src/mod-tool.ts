/* Copyright (c) 2025 Richard Rodger, MIT License */

// MODULE TOOLING (G6 phase 3, docs/capability-review/g6-distribution.md):
// the LOCAL half — `aontu mod tidy` and `aontu mod vendor`.
//
// Evaluation never touches the network, and neither does this: `tidy`
// resolves versions and rewrites the lockfile from what is already in
// the local stores, and `vendor` materialises the locked closure into
// the project. Fetching and publishing are the network half, and are
// not in this build (see the register).
//
// MINIMUM VERSION SELECTION, not a solver: each module declares the
// MINIMUM version of each dependency it needs, and the selected version
// is the maximum of those minima over the closure. Deterministic, and
// deterministic without backtracking — the lockfile CONFIRMS the
// resolution rather than determining it, which is why a tidy run can be
// re-run to the same bytes.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync,
  copyFileSync,
} from 'node:fs'
import { join as pathJoin, dirname as pathDirname } from 'node:path'

import { parseModuleRef, moduleDir, lockJson } from './mod'
import type { ModuleRef } from './mod'


// One entry of the lockfile, and of a tidy report.
export type ModLock = {
  // The module path and major, as an import spells it.
  mod: string
  // The selected version.
  v: string
  // The canon-hash of the module as it is in the local store.
  canon: string
  // The registry digest, carried over from a previous lockfile. Empty
  // when nothing has ever fetched this module: the OCI pin is the
  // registry's word, and only a fetch can hear it.
  oci: string
}

export type ModTidyReport = {
  verdict: 'ok' | 'missing'
  // The resolved closure, sorted by module.
  lock: ModLock[]
  // Modules named by a dependency but present in no local store, sorted.
  missing: string[]
}

export type ModVendorReport = {
  verdict: 'ok' | 'missing'
  // The modules materialised into `aon_vendor/`, sorted.
  vendored: string[]
  // Locked modules present in no store, sorted.
  missing: string[]
}


// What the tooling needs from the engine, injected for the reason
// ts/src/mod.ts's ModuleEval is: evaluating a module is what the
// evaluator does, and the tooling is a caller of it rather than a
// second implementation.
export type ModToolEval = (src: string, path: string) =>
  { gen: any, hash: string, canon: string }


export type ModToolOptions = {
  // The content-addressed user cache. Empty means no cache is
  // consulted, which is a store that misses rather than an error.
  cache?: string
  eval: ModToolEval
}


// The `dep` block a module file declares: import string -> version.
function declaredDeps(file: string, options: ModToolOptions):
  Record<string, string> {
  if (!existsSync(file)) {
    return {}
  }

  const gen: any = options.eval(readFileSync(file, 'utf8'), file).gen
  const dep = gen?.dep
  if (null == dep || 'object' !== typeof dep) {
    return {}
  }

  const out: Record<string, string> = {}
  for (const key of Object.keys(dep)) {
    const v = dep[key]?.v
    if ('string' === typeof v && '' !== v) {
      out[key] = v
    }
  }
  return out
}


// Numeric-dotted version order: `1.10.0` is above `1.9.0`, which
// STRING order gets wrong, and that is the whole reason this is not a
// `<` on the text. A part that is not a number compares as text, after
// every number — a pre-release tag is below no version and above none.
export function versionCompare(a: string, b: string): number {
  const ap = a.split('.')
  const bp = b.split('.')
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    // A part the shorter version does not have is ZERO, so `1.2` and
    // `1.2.0` are the same version -- which is what everyone means by
    // them, and what a lockfile rewritten from either must agree on.
    const x = ap[i] ?? '0'
    const y = bp[i] ?? '0'
    if (x === y) {
      continue
    }
    const xn = /^\d+$/.test(x)
    const yn = /^\d+$/.test(y)
    if (xn && yn) {
      return +x < +y ? -1 : 1
    }
    if (xn !== yn) {
      return xn ? -1 : 1
    }
    return x < y ? -1 : 1
  }
  return 0
}


// The directory a module is in, in the local stores: the project's
// vendor tree first, then the cache under the hash the lockfile pins.
function storeDir(
  root: string, ref: ModuleRef, hash: string, options: ModToolOptions,
): string | undefined {
  const stores = [moduleDir(pathJoin(root, 'aon_vendor'), ref)]
  if (null != options.cache && '' !== hash) {
    stores.push(pathJoin(options.cache, hash))
  }
  return stores.find((d) => existsSync(pathJoin(d, 'mod.aon')))
}


// The lockfile's entries, as written.
function readLock(root: string): Record<string, ModLock> {
  const file = pathJoin(root, 'mod-lock.aon')
  if (!existsSync(file)) {
    return {}
  }

  let lock: any
  try {
    lock = JSON.parse(lockJson(readFileSync(file, 'utf8')))
  }
  catch {
    return {}
  }

  const out: Record<string, ModLock> = {}
  for (const mod of Object.keys(lock?.lock ?? {})) {
    const e = lock.lock[mod]
    out[mod] = {
      mod,
      v: 'string' === typeof e?.v ? e.v : '',
      canon: 'string' === typeof e?.canon ? e.canon : '',
      oci: 'string' === typeof e?.oci ? e.oci : '',
    }
  }
  return out
}


// The lockfile TEXT: canonical Aontu, one line, keys sorted. Built as
// source and canonicalised by the engine rather than printed by hand,
// so "canonical form" means what the language means by it and cannot
// drift from it.
export function lockText(entries: ModLock[], options: ModToolOptions): string {
  const parts = entries.map((e) =>
    JSON.stringify(e.mod) + ':{' +
    '"canon":' + JSON.stringify(e.canon) + ',' +
    '"oci":' + JSON.stringify(e.oci) + ',' +
    '"v":' + JSON.stringify(e.v) + '}')
  // Canonicalised by the ENGINE rather than printed by hand, so
  // "canonical form" means what the language means by it and cannot
  // drift from it. For a map of scalars that canon is also JSON, which
  // is what lets the resolver read a pin back without an evaluator
  // (ts/src/mod.ts lockHash).
  return options.eval('{"lock":{' + parts.join(',') + '}}', 'mod-lock.aon').canon
}


// `aontu mod tidy`: resolve the closure by MVS and rewrite the lockfile.
export function modTidy(root: string, options: ModToolOptions): ModTidyReport {
  const previous = readLock(root)
  const selected: Record<string, string> = {}
  const missing: string[] = []

  // The closure, breadth-first from the project's own declarations. A
  // module already selected at a version at least as high contributes
  // nothing new, which is what makes this terminate without a cycle
  // check: the selected version only ever rises.
  let frontier = declaredDeps(pathJoin(root, 'mod.aon'), options)
  for (; 0 < Object.keys(frontier).length;) {
    const next: Record<string, string> = {}

    for (const mod of Object.keys(frontier)) {
      const want = frontier[mod]
      const have = selected[mod]
      if (null != have && 0 <= versionCompare(have, want)) {
        continue
      }
      selected[mod] = want

      const ref = parseModuleRef(mod)
      if (undefined === ref) {
        // A dependency key that is not a module path names nothing this
        // resolver can find, which is the same answer as a module that
        // is not there.
        missing.push(mod)
        continue
      }

      const dir = storeDir(root, ref, previous[mod]?.canon ?? '', options)
      if (undefined === dir) {
        missing.push(mod)
        continue
      }

      const deps = declaredDeps(pathJoin(dir, 'mod.aon'), options)
      for (const key of Object.keys(deps)) {
        const bid = next[key]
        if (null == bid || 0 > versionCompare(bid, deps[key])) {
          next[key] = deps[key]
        }
      }
    }

    frontier = next
  }

  const lock: ModLock[] = []
  for (const mod of Object.keys(selected).sort()) {
    if (missing.includes(mod)) {
      continue
    }
    const ref = parseModuleRef(mod) as ModuleRef
    const dir = storeDir(root, ref, previous[mod]?.canon ?? '', options) as string
    const main = pathJoin(dir, mainOf(dir, options))
    lock.push({
      mod,
      v: selected[mod],
      // RECOMPUTED, never carried over: the pin is what the module in
      // this store MEANS, and a tidy that copied the old hash forward
      // would pin what it used to mean.
      canon: existsSync(main) ?
        options.eval(readFileSync(main, 'utf8'), main).hash : '',
      // Carried over: the OCI digest is the registry's word about the
      // bytes it served, and nothing local can hear it.
      oci: previous[mod]?.oci ?? '',
    })
  }

  const uniqueMissing = [...new Set(missing)].sort()
  if (0 === uniqueMissing.length) {
    writeFileSync(pathJoin(root, 'mod-lock.aon'),
      LOCK_HEADER + lockText(lock, options) + '\n')
  }

  return {
    verdict: 0 === uniqueMissing.length ? 'ok' : 'missing',
    lock,
    missing: uniqueMissing,
  }
}


// The generated-file header. A lockfile is machine-written, and the
// file says so where an editor will see it.
const LOCK_HEADER =
  '# mod-lock.aon (generated by `aontu mod tidy`; do not edit)\n'


// The entry file a module declares, or the default. `dir` is always a
// STORE directory, and `storeDir` only answers one that holds a
// `mod.aon` -- so there is no missing-file arm to take here.
function mainOf(dir: string, options: ModToolOptions): string {
  const file = pathJoin(dir, 'mod.aon')
  const gen: any = options.eval(readFileSync(file, 'utf8'), file).gen
  const main = gen?.mod?.main
  return 'string' === typeof main && '' !== main ? main : 'main.aon'
}


// `aontu mod vendor`: materialise the locked closure into `aon_vendor/`.
export function modVendor(root: string, options: ModToolOptions):
  ModVendorReport {
  const locked = readLock(root)
  const vendored: string[] = []
  const missing: string[] = []

  for (const mod of Object.keys(locked).sort()) {
    const ref = parseModuleRef(mod)
    if (undefined === ref) {
      missing.push(mod)
      continue
    }

    const from = storeDir(root, ref, locked[mod].canon, options)
    if (undefined === from) {
      missing.push(mod)
      continue
    }

    const to = moduleDir(pathJoin(root, 'aon_vendor'), ref)
    if (from !== to) {
      copyTree(from, to)
    }
    vendored.push(mod)
  }

  return {
    verdict: 0 === missing.length ? 'ok' : 'missing',
    vendored,
    missing: missing.sort(),
  }
}


// A whole module directory, copied. Modules are source trees — that is
// what an OCI layer holds — so this walks rather than reading one file.
function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from).sort()) {
    const src = pathJoin(from, name)
    const dst = pathJoin(to, name)
    if (statSync(src).isDirectory()) {
      copyTree(src, dst)
    }
    else {
      mkdirSync(pathDirname(dst), { recursive: true })
      copyFileSync(src, dst)
    }
  }
}
