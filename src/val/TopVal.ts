/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import { inspect } from 'node:util'

import type {
  Val,
  ValMark,
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
  isScalar = false
  isScalarKind = false
  isConjunct = false
  isDisjunct = false
  isJunction = false
  isPref = false
  isRef = false
  isVar = false
  isNumber = false
  isInteger = false
  isString = false
  isBoolean = false
  isBag = false
  isOp = true
  isPlusOp = true

  isFunc = false
  isCloseFunc = false
  isCopyFunc = false
  isHideFunc = false
  isMoveFunc = false
  isKeyFunc = false
  isLowerFunc = false
  isOpenFunc = false
  isPathFunc = false
  isPrefFunc = false
  isSuperFunc = false
  isTypeFunc = false
  isUpperFunc = false

  id = 0
  dc = DONE
  path: string[] = []
  row = -1
  col = -1
  url = ''

  top = true

  // Map of boolean flags.
  mark: ValMark = { type: false, hide: false }

  // Actual native value.
  peg: any = undefined

  // TODO: used for top level result - not great
  // err: Omit<any[], "push"> = []
  err: any[] = []
  explain: any[] | null = null

  uh: number[] = []

  #ctx: any = undefined

  constructor() {
    // TOP is always DONE, by definition.
    this.dc = DONE
    this.mark.type = false
    this.mark.hide = false
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


  [inspect.custom](_d: number, _o: any, _inspect: any) {
    let s = ['<' + this.constructor.name.replace(/Val$/, '') + '/' + this.id]

    s.push('/' + this.path.join('.') + '/')

    s.push([
      this.dc,
      ...Object.entries(this.mark).filter(n => n[1]).map(n => n[0]).sort()
    ].filter(n => null != n).join(','))

    s.push('>')

    return s.join('')
  }

}


const TOP = new TopVal()


export {
  TOP,
  TopVal,
}
