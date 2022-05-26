/* Copyright (c) 2021 Richard Rodger, MIT License */



import {
  DONE,
  TOP,
  Val,
  RefVal,
  MapVal,
  Nil,
} from './val'

import {
  Lang
} from './lang'

import {
  unite
} from './op/op'


type Path = string[]



class Context {
  root: Val   // Starting Val, root of paths.
  path: Path  // Path to current Val.
  err: Nil[]  // Nil error log of current unify.
  vc: number  // Val counter to create unique val ids.

  constructor(cfg: {
    root: Val
    err?: Nil[],
    vc?: number
  }) {
    this.root = cfg.root
    this.path = []
    this.err = cfg.err || []

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc
  }


  clone(cfg: {
    root?: Val,
    path?: Path,
    err?: Nil[],
  }): Context {
    return new Context({
      root: cfg.root || this.root,
      err: cfg.err || this.err,
      vc: this.vc,
    })
  }


  descend(key: string): Context {
    return this.clone({
      root: this.root,
      path: this.path.concat(key),
    })
  }


  find(ref: RefVal) {

    // TODO: relative paths
    if (this.root instanceof MapVal && ref.absolute) {
      let node: MapVal = this.root
      let pI = 0
      for (; pI < ref.parts.length && node instanceof MapVal; pI++) {
        let part = ref.parts[pI]
        node = node.peg[part]
      }

      if (pI === ref.parts.length) {
        return node
      }
    }
  }
}


class Unify {
  root: Val
  res: Val
  err: Nil[]
  dc: number
  lang: Lang

  constructor(root: Val | string, lang?: Lang) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    this.root = root
    this.res = root
    this.err = []

    let res = root
    let ctx: Context = new Context({
      root: res,
      err: this.err,
    })


    // TODO: derive maxdc from res deterministically
    // perhaps parse should count intial vals, paths, etc?


    let maxdc = 999
    for (this.dc = 0; this.dc < maxdc && DONE !== res.done; this.dc++) {
      res = unite(ctx, res, TOP)
      ctx = ctx.clone({ root: res })
    }


    this.res = res
  }
}


export {
  Context,
  Path,
  Unify,
}
