/* Copyright (c) 2021 Richard Rodger, MIT License */

import {
  DONE,
  TOP,
  Val,
  RefVal,
  MapVal,
} from './val'

import {
  AontuLang as parse
} from './lang'


class Context {
  root: MapVal
  constructor(cfg: any) {
    this.root = cfg.root
  }

  find(ref: RefVal) {

    // TODO: relative paths
    if (ref.absolute) {
      let node: MapVal = this.root
      let pI = 0
      for (; pI < ref.parts.length && node instanceof MapVal; pI++) {
        let part = ref.parts[pI]
        node = node.val[part]
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
  dc = 0

  constructor(root: Val | string) {
    if ('string' === typeof root) {
      root = parse(root)
    }

    this.root = root
    this.res = root

    let res = root
    let ctx: Context
    while (this.dc < 111 && DONE !== res.done) {
      ctx = new Context({ root: res })
      res = res.unify(TOP, ctx)
      this.dc++
    }

    this.res = res
  }
}


export {
  Context,
  Unify,
}
