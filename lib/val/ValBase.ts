/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



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
  err: any[] = []
  // deps?: any


  constructor(spec: ValSpec, ctx?: Context) {
    this.peg = spec?.peg
    this.path = ctx?.path || []
    this.id = (9e9 + Math.floor(Math.random() * (1e9)))
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.id === peer.id
  }


  clone(spec?: ValSpec, ctx?: Context): Val {
    let cloneCtx = ctx ? ctx.clone({
      path: ctx.path.concat(this.path.slice(ctx.path.length))
    }) : undefined

    let out = new (this as any)
      .constructor(spec || { peg: this.peg }, cloneCtx)

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
