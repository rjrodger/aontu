/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { DONE, } from './type'


import {
  TOP
} from './val'

import {
  Lang
} from './lang'

import {
  unite
} from './op/op'





// import { MapVal } from '../lib/val/MapVal'
// import { RefVal } from '../lib/val/RefVal'
import { Nil } from '../lib/val/Nil'


type Path = string[]



class Context {
  root: Val   // Starting Val, root of paths.
  path: Path  // Path to current Val.
  err: Nil[]  // Nil error log of current unify.
  vc: number  // Val counter to create unique val ids.
  cc: number = -1

  constructor(cfg: {
    root: Val,
    path?: Path,
    err?: Nil[],
    vc?: number,
    cc?: number,
    // uc?: number,
  }) {
    this.root = cfg.root
    this.path = cfg.path || []
    this.err = cfg.err || []

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc

    this.cc = null == cfg.cc ? this.cc : cfg.cc
    // this.uc = null == cfg.uc ? this.uc : cfg.uc
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
      // uc: this.uc,
    })
  }


  descend(key: string): Context {
    return this.clone({
      root: this.root,
      path: this.path.concat(key),
    })
  }


  // TODO: move to RefVal
  /*
  xfind(ref: RefVal) {
    // TODO: relative paths
    // if (this.root instanceof MapVal && ref.absolute) {

    // NOTE: path *to* the ref, not the ref itself!
    let fullpath = ref.path

    if (ref.absolute) {
      fullpath = ref.parts.slice(1) // ignore '$' at start
    }
    else {
      fullpath = fullpath.concat(ref.parts)
    }

    console.log('FP', ref.absolute, ref.parts, fullpath)

    let node = this.root
    let pI = 0
    for (; pI < ref.parts.length; pI++) {
      let part = ref.parts[pI]
      if (node instanceof MapVal) {
        node = node.peg[part]
      }
      else {
        // console.log(
        //   'FIND', ref.parts, pI, node.constructor.name,
        //   node.peg.map(
        //     (n: any) =>
        //       n.constructor.name + ':' + n.done +
        //       ' {' + Object.keys(n.peg) + '}'
        //   )
        // )
        break;
      }
    }

    if (pI === ref.parts.length) {
      return node
    }
    }
    */
}


class Unify {
  root: Val
  res: Val
  err: Nil[]
  cc: number
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


    let maxdc = 9 // 99
    for (this.cc = 0; this.cc < maxdc && DONE !== res.done; this.cc++) {
      // console.log('\n\nRES', this.dc)
      // console.log('\n\nRES', this.dc, res.canon)
      // console.dir(res, { depth: null })
      ctx.cc = this.cc
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
