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
  explain?: any[]
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


  constructor(cfg: AontuContextConfig) {
    this.root = cfg.root
    this.path = [...(cfg.path ?? [])]
    this.src = cfg.src

    this.collect = cfg.collect ?? null != cfg.err

    this.err = cfg.err ?? []
    this.explain = cfg.explain ?? null

    this.fs = cfg.fs ?? null

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc

    this.cc = null == cfg.cc ? this.cc : cfg.cc

    this.vars = cfg.vars ?? this.vars
    this.seenI = cfg.seenI ?? 0
    this.seen = cfg.seen ?? {}

    this.srcpath = cfg.srcpath ?? undefined

    this.deps = cfg.deps ?? {}

    this.opts = DEFAULT_OPTS()
    this.addopts(cfg.opts)
  }


  clone(cfg: {
    root?: Val,
    path?: string[],
    err?: any[],
    explain?: any[]
  }): AontuContext {
    const ctx = Object.create(this)
    ctx.path = cfg.path ?? this.path
    ctx.root = cfg.root ?? this.root
    ctx.var = Object.create(this.vars)

    ctx.err = cfg.err ?? ctx.err
    ctx.explain = cfg.explain ?? ctx.explain

    return ctx
  }

  descend(key: string): AontuContext {
    return this.clone({
      root: this.root,
      path: this.path.concat(key),
    })
  }


  addopts(opts?: AontuOptions) {
    if (null != opts) {
      Object.assign(this.opts, opts)
    }

    this.collect = (this.opts.collect ?? null != this.opts.err) ?? this.collect
    this.err = this.opts.err ?? this.err
    this.fs = this.opts.fs ?? this.fs
    this.explain = this.opts.explain ?? this.explain

    this.src = ('string' === typeof this.opts.src ? this.opts.src : undefined) ?? this.src

    // TODO: rename srcpath to file
    this.srcpath = this.opts.path ?? this.srcpath
  }


  adderr(err: NilVal) {
    if (!this.err.includes(err)) {
      this.err.push(err)
    }
    if (null == err.msg || '' == err.msg) {
      descErr(err, this)
    }
  }


  errmsg() {
    // return this.errlist
    return this.err
      .map((err: any) => err?.msg)
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
}



export {
  AontuContext,
  AontuContextConfig
}
