/* Copyright (c) 2021 Richard Rodger, MIT License */



import {
  DONE,
  TOP,
  Val,
  RefVal,
  MapVal,
} from './val'

import {
  Lang
} from './lang'



type Path = string[]


class Context {
  root: MapVal
  path: Path

  constructor(cfg: any) {
    this.root = cfg.root
    this.path = []
  }


  descend(key: string) {
    let cfg = { root: this.root }
    let ctx = new Context(cfg)
    ctx.path = this.path.concat(key)
    return ctx
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
  lang: Lang

  constructor(root: Val | string, lang?: Lang) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
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
  Path,
  Unify,
}
