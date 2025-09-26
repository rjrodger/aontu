/* Copyright (c) 2021-2024 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'


import {
  Context,
} from '../unify'


import {
  Site
} from '../lang'


let ID = 0


class ValBase implements Val {
  isVal = true

  id: number
  done: number = 0
  path: string[] = []
  row: number = -1
  col: number = -1
  url: string = ''

  top: boolean = false

  // Actual native value.
  peg: any = undefined

  // TODO: used for top level result - not great
  err: Omit<any[], "push"> = []
  // deps?: any

  uh: number[]

  // TODO: implement!
  // site: Site

  #ctx: any

  // TODO: Site needed in ctor
  constructor(spec: ValSpec, ctx?: Context) {
    this.#ctx = ctx

    this.peg = spec?.peg
    this.path = ctx?.path || []
    // this.id = (9e9 + Math.floor(Math.random() * (1e9)))
    this.id = ++ID // (9e9 + Math.floor(Math.random() * (1e5)))
    this.uh = []
  }


  ctx() {
    return this.#ctx
  }

  same(peer: Val): boolean {
    return null == peer ? false : this.id === peer.id
  }


  clone(spec?: ValSpec, ctx?: Context): Val {
    let cloneCtx

    if (ctx) {
      let cut = this.path.indexOf('&')
      cut = -1 < cut ? cut + 1 : ctx.path.length
      cloneCtx = ctx.clone({
        path: ctx.path.concat(this.path.slice(cut))
      })
    }

    let out = new (this as any)
      .constructor(spec || { peg: this.peg }, cloneCtx)

    out.row = spec?.row || this.row || -1
    out.col = spec?.col || this.col || -1
    out.url = spec?.url || this.url || ''

    if (null == cloneCtx) {
      out.path = this.path.slice(0)
    }

    return out
  }


  get site(): Site {
    return new Site(this)
  }

  unify(_peer: Val, _ctx?: Context): Val { return this }
  get canon(): string { return '' }
  gen(_ctx?: Context): any { return null }

}

export {
  ValBase,
}
