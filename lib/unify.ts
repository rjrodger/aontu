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



type Path = string[]

//type MapMap = { [name: string]: { [key: string]: any } }


class Context {
  root: Val
  path: Path
  err: Nil[]
  //map: MapMap

  constructor(cfg: {
    root: Val
    err?: Nil[],
    //map?: MapMap
  }) {
    this.root = cfg.root
    this.path = []
    this.err = cfg.err || []
    //this.map = cfg.map || { url: {} }
  }


  descend(key: string) {
    let cfg = {
      root: this.root,
      err: this.err,
      // map: this.map,
    }
    let ctx = new Context(cfg)
    ctx.err = this.err
    ctx.path = this.path.concat(key)
    return ctx
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
  // map: MapMap
  dc = 0
  lang: Lang

  constructor(root: Val | string, lang?: Lang) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    // console.log('ROOT', root.canon, root.url)

    this.root = root
    this.res = root
    this.err = []
    //this.map = {
    //  url: {}
    //}

    let res = root
    let ctx: Context
    while (this.dc < 111 && DONE !== res.done) {
      ctx = new Context({
        root: res,
        err: this.err,
        // map: this.map
      })
      res = res.unify(TOP, ctx)

      // console.log('U', this.dc, this.map)

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
