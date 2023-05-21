/* Copyright (c) 2021-2022 Richard Rodger, MIT License */



import type {
  Val,
} from '../type'

import {
  DONE,
  TOP,
} from '../type'

import {
  Context,
} from '../unify'


import {
  Site
} from '../lang'


import {
  unite
} from '../op/op'





abstract class ValBase implements Val {
  isVal = true

  id: number
  done: number = 0
  path: string[]
  row: number = -1
  col: number = -1
  url: string = ''

  top?: boolean

  // Actual native value.
  peg?: any

  // TODO: used for top level result - not great
  err?: any[]
  // deps?: any

  constructor(peg?: any, ctx?: Context) {
    this.peg = peg
    this.path = ctx?.path || []
    this.id = (ctx && ctx.vc++) || (9e9 + Math.floor(Math.random() * (1e9)))
  }

  same(peer: Val): boolean {
    // return this === peer
    return null == peer ? false : this.id === peer.id
  }

  clone(ctx?: Context): Val {
    let cloneCtx = ctx ? ctx.clone({
      path: ctx.path.concat(this.path.slice(ctx.path.length))
      // path: ctx.path.concat(this.path)
    }) : undefined

    let out = new (this as any).constructor(this.peg, cloneCtx)

    if (null == cloneCtx) {
      out.path = this.path.slice(0)
    }

    return out
  }

  get site(): Site {
    return new Site(this)
  }


  // TODO: can ctx be optional?
  abstract unify(peer: Val, ctx?: Context): Val
  abstract get canon(): string
  abstract gen(ctx?: Context): any
}




export {
  ValBase,
}
