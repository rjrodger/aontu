/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { DONE, FST } from './type'


import {
  TOP
} from './val'

import {
  Lang
} from './lang'

import {
  unite
} from './op/op'


import { Nil } from './val/Nil'


type Path = string[]


class Context {
  root: Val   // Starting Val, root of paths.
  path: Path  // Path to current Val.
  err: Nil[]  // Nil error log of current unify.
  vc: number  // Val counter to create unique val ids.
  cc: number = -1
  var: Record<string, Val> = {}
  src?: string
  fs?: FST

  constructor(cfg: {
    root: Val,
    path?: Path,
    err?: Nil[],
    vc?: number,
    cc?: number,
    var?: Record<string, Val>
  }) {
    this.root = cfg.root
    this.path = cfg.path || []
    this.err = cfg.err || []

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc

    this.cc = null == cfg.cc ? this.cc : cfg.cc

    this.var = cfg.var || this.var
  }


  clone(cfg: {
    root?: Val,
    path?: Path,
    err?: Nil[],
  }): Context {
    return new Context({
      root: cfg.root || this.root,
      path: cfg.path,
      err: cfg.err || this.err,
      vc: this.vc,
      cc: this.cc,
      var: { ...this.var },
    })
  }


  descend(key: string): Context {
    return this.clone({
      root: this.root,
      path: this.path.concat(key),
    })
  }
}


class Unify {
  root: Val
  res: Val
  err: Nil[]
  cc: number
  lang: Lang

  constructor(root: Val | string, lang?: Lang, ctx?: Context) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    this.cc = 0
    this.root = root
    this.res = root
    this.err = root.err || []

    let res = root

    // Only unify if no syntax errors
    if (!(root as Nil).nil) {
      ctx = ctx || new Context({
        root: res,
        err: this.err,
      })

      let maxdc = 9 // 99
      for (; this.cc < maxdc && DONE !== res.done; this.cc++) {
        ctx.cc = this.cc
        res = unite(ctx, res, TOP)
        ctx = ctx.clone({ root: res })
      }
    }

    this.res = res
  }
}


export {
  Context,
  Path,
  Unify,
}
