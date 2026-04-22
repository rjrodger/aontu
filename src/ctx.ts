/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type { Val, FST, AontuOptions } from './type'

import { DEFAULT_OPTS } from './type'


import { MapVal } from './val/MapVal'
import { ListVal } from './val/ListVal'
import { NilVal } from './val/NilVal'


import {
  descErr
} from './err'



type AontuContextConfig = {
  cc?: number
  err?: any[] // Omit<NilVal[], "push">
  explain?: any[] | boolean | null
  fs?: any
  path?: string[]
  root?: Val
  seen?: Record<string, number>
  seenI?: number
  src?: string
  srcpath?: string
  vars?: Record<string, Val>
  vc?: number
  collect?: boolean
  opts?: AontuOptions
  deps?: Record<string, any>
}


class AontuContext {
  root?: Val   // Starting Val, root of paths.
  path: string[]  // Path to current Val.
  vc: number  // Val counter to create unique val ids.
  cc: number = -1
  vars: Record<string, Val> = {}
  src?: string
  fs?: FST

  seenI: number
  seen: Record<string, number>

  collect: boolean

  // errlist: Omit<NilVal[], "push">  // Nil error log of current unify.
  err: any[]
  explain: any[] | null

  // TODO: separate options and context!!!
  srcpath?: string

  deps: Record<string, any>
  opts: AontuOptions

  _pathstr: string | undefined
  _pathidx: number | undefined
  _pathmap: Map<string, number>
  // Trie keyed by (parentIdx, key) -> { idx, path }. Serves two
  // jobs: (1) assign O(1) pathidx without rebuilding
  // `path.join('\x00')` for cycle-detection; (2) cache the
  // materialised path array so the same (parent, key) visited
  // across fixpoint passes reuses one array instead of re-concat.
  _pathTrie: Map<number, Map<string, { idx: number, path: string[] }>>
  _pathidxNext: { n: number }

  // Trial mode: set by DisjunctVal.unify while each member is tried
  // against the peer. When true, makeNilErr returns the shared
  // TRIAL_NIL sentinel instead of allocating a fresh NilVal, and
  // pushes TRIAL_NIL to ctx.err only once per trial (the caller's
  // `trialErr.length > 0` check still signals failure). See err.ts.
  _trialMode?: boolean

  // Per-parent descend cache: (key) -> already-descended child ctx.
  // ~48% of descends in foo-sdk repeat the same (parent, key) pair
  // (e.g. a MapVal.unify visits the same peer keys across fixpoint
  // passes). The child's prototype chain, path, and pathidx are
  // identical every time, and no code writes to a descended ctx
  // between visits — nothing mutates per-child state — so the
  // cached child is safe to reuse.
  _childCache?: Map<string, AontuContext>

  // Per-iteration cache for RefVal.find() clone results.
  // Key: "refId|targetId" — avoids repeated deep-clone + walk for
  // the same (ref, resolved-target) pair within one fixpoint pass.
  // Cleared at the start of each iteration (alongside `seen`).
  _refCloneCache?: Map<string, Val>

  // Per-iteration cache for unite() results when both operands are
  // done. Key: "aId|bId". Done Vals have no unresolved refs, so
  // their unification is path-independent and can be reused across
  // different tree positions. Cleared per fixpoint iteration.
  _uniteCache?: Map<string, Val>


  constructor(cfg: AontuContextConfig) {
    this.root = cfg.root
    this.path = [...(cfg.path ?? [])]
    this.src = cfg.src

    this.collect = cfg.collect ?? null != cfg.err

    this.err = cfg.err ?? []
    this.explain = Array.isArray(cfg.explain) ? cfg.explain : null

    this.fs = cfg.fs ?? null

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc

    this.cc = null == cfg.cc ? this.cc : cfg.cc

    this.vars = cfg.vars ?? this.vars
    this.seenI = cfg.seenI ?? 0
    this.seen = cfg.seen ?? {}

    this.srcpath = cfg.srcpath ?? undefined

    this.deps = cfg.deps ?? {}

    this._pathmap = new Map()
    this._pathTrie = new Map()
    this._pathidxNext = { n: 1 }  // 0 reserved for the root path
    this._pathidx = 0

    this.opts = DEFAULT_OPTS()
    this.addopts(cfg.opts)
  }


  clone(cfg: {
    root?: Val,
    path?: string[],
    err?: any[],
    collect?: boolean,
    explain?: any[] | boolean | null
  }): AontuContext {
    const ctx = Object.create(this)
    ctx.path = cfg.path ?? this.path
    ctx.root = cfg.root ?? this.root
    ctx.var = Object.create(this.vars)

    ctx.collect = null != cfg.collect ? !!cfg.collect : ctx.collect
    ctx.err = cfg.err ?? ctx.err
    ctx.explain = Array.isArray(cfg.explain) ? cfg.explain : ctx.explain

    ctx._pathstr = undefined
    // Path didn't move unless cfg.path was supplied, so pathidx stays
    // valid in the common case. For cfg.path-override (4 calls per
    // run, fixpoint advances) fall back to the join-based lookup.
    if (cfg.path !== undefined) {
      ctx._pathidx = undefined
    }

    return ctx
  }

  descend(key: string): AontuContext {
    // C3: reuse the child ctx from a previous descend with the same
    // (parent, key). Saves one Object.create + several property
    // writes per hit; ~48% hit rate on foo-sdk.
    //
    // NB: must use hasOwnProperty here — plain `this._childCache`
    // would walk the prototype chain and read the *parent's* cache
    // (ctxs are created via Object.create(parent)), so keys would
    // cross-contaminate between sibling branches.
    let childCache: Map<string, AontuContext> | undefined
    if (Object.prototype.hasOwnProperty.call(this, '_childCache')) {
      childCache = this._childCache
      const cached = childCache!.get(key)
      if (cached !== undefined) return cached
    }
    else {
      childCache = new Map()
      this._childCache = childCache
    }

    const ctx = Object.create(this)
    ctx._pathstr = undefined

    // Trie doubles as both pathidx assignment and path-array cache.
    // (parent_pathidx, key) uniquely identifies a descended path,
    // and is visited many times across fixpoint passes. Caching the
    // materialised array lets descend share references instead of
    // allocating a fresh concat every time.
    const parentIdx = this._pathidx!
    let childMap = this._pathTrie.get(parentIdx)
    if (childMap === undefined) {
      childMap = new Map()
      this._pathTrie.set(parentIdx, childMap)
    }
    let entry = childMap.get(key)
    if (entry === undefined) {
      entry = { idx: this._pathidxNext.n++, path: this.path.concat(key) }
      childMap.set(key, entry)
    }
    ctx._pathidx = entry.idx
    ctx.path = entry.path

    childCache!.set(key, ctx)
    return ctx
  }


  addopts(opts?: AontuOptions) {
    if (null != opts) {
      Object.assign(this.opts, opts)
    }

    this.collect = this.opts.collect ?? (null != this.opts.err || this.collect)
    this.err = this.opts.err ?? this.err
    this.deps = this.opts.deps ?? this.deps
    this.fs = this.opts.fs ?? this.fs
    this.explain = this.opts.explain ?? this.explain

    this.src = ('string' === typeof this.opts.src ? this.opts.src : undefined) ?? this.src

    // TODO: rename srcpath to file
    this.srcpath = this.opts.path ?? this.srcpath
  }


  adderr(err: NilVal) {
    if (null != err && err.isNil) {
      if (null == err.primary) {
        err.primary = err
      }

      if (!this.err.includes(err)) {
        this.err.push(err)
      }
      // NOTE: error message formatting is deferred to errmsg() / NilVal.gen.
      // Many NilVals are transient (disjunct member trials, etc.) and never
      // surface to the user — eager descErr was a major hot path.
    }
  }


  errmsg() {
    // return this.errlist
    return this.err
      .map((err: any) => (err && (null == err.msg || '' === err.msg)
        ? (descErr(err, this), err.msg)
        : err?.msg))
      .filter(msg => null != msg)
      .join('\n------\n')
  }


  find(path: string[]): Val | undefined {
    let node: Val | undefined = this.root
    let pI = 0
    for (; pI < path.length; pI++) {
      let part = path[pI]

      if (node instanceof MapVal) {
        node = node.peg[part]
      }
      else if (node instanceof ListVal) {
        node = node.peg[part]
      }
      else {
        break;
      }
    }

    if (pI < path.length) {
      node = undefined
    }

    return node
  }


  get pathidx(): number {
    if (undefined === this._pathidx) {
      const key = this.path.join('\x00')
      let idx = this._pathmap.get(key)
      if (undefined === idx) {
        idx = this._pathmap.size
        this._pathmap.set(key, idx)
      }
      this._pathidx = idx
    }
    return this._pathidx
  }


  get pathstr() {
    return this._pathstr ??
      (this._pathstr = this.path.map(p => p.replaceAll('.', '\\.')).join('.'))
  }
}



export {
  AontuContext,
  AontuContextConfig
}
