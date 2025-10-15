/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
} from '../type'

import {
  DONE,
} from '../type'

import {
  Context,
} from '../unify'

import {
  Site
} from '../lang'


// There can be only one.
class TopVal implements Val {
  static SPREAD = Symbol('spread')

  isVal = true
  isTop = true
  isNil = false
  isMap = false
  isList = false

  id = 0
  dc = DONE
  path: string[] = []
  row = -1
  col = -1
  url = ''

  top = true
  type = false

  // Actual native value.
  peg: any = undefined

  // TODO: used for top level result - not great
  err: Omit<any[], "push"> = []

  uh: number[] = []

  #ctx: any = undefined

  constructor() {
    // TOP is always DONE, by definition.
    this.dc = DONE
  }

  get done() {
    return this.dc === DONE
  }

  ctx() {
    return this.#ctx
  }

  same(peer: Val): boolean {
    // return this === peer
    return peer.isTop
  }

  place(v: Val) {
    v.row = this.row
    v.col = this.col
    v.url = this.url
    return v
  }

  get site(): Site {
    return new Site(this)
  }

  notdone() {
    this.dc = DONE === this.dc ? DONE : this.dc + 1
  }

  unify(peer: Val, _ctx?: Context): Val {
    return peer
  }

  get canon() { return 'top' }

  clone(_ctx: Context, _spec?: any) {
    return this
  }

  gen(_ctx?: Context) {
    return undefined
  }

  superior(): Val {
    return this
  }

}


const TOP = new TopVal()


export {
  TOP,
  TopVal,
}
