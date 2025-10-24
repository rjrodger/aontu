/* Copyright (c) 2021-2024 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'


import {
  DONE,
  SPREAD,
} from '../type'


import {
  Context,
} from '../unify'

import {
  Site
} from '../lang'



let ID = 1000


abstract class BaseVal implements Val {
  isVal = true

  isTop = false
  isNil = false
  isMap = false
  isList = false
  isScalar = false
  isScalarKind = false
  isRef = false
  isPref = false
  isVar = false
  isBag = false
  isNumber = false
  isInteger = false
  isString = false
  isBoolean = false
  isConjunct = false
  isDisjunct = false
  isJunction = false

  isOp = false
  isPlusOp = false

  isFunc = false
  isCloseFunc = false
  isCopyFunc = false
  isKeyFunc = false
  isLowerFunc = false
  isOpenFunc = false
  isPrefFunc = false
  isSuperFunc = false
  isTypeFunc = false
  isUpperFunc = false


  id: number
  dc: number = 0
  path: string[] = []
  row: number = -1
  col: number = -1
  url: string = ''

  // Map of boolean flags.
  mark: Record<string, boolean> = {}

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

    if (Array.isArray(this.peg)) {
      let spread = (this.peg as any)[SPREAD]
      this.peg = this.peg.filter(n => undefined !== n)
        ; (this.peg as any)[SPREAD] = spread
    }

    this.path = ctx?.path || []

    // TODO: make this work
    // this.id = spec?.id ?? (ctx ? ++ctx.vc : ++ID)
    this.id = ++ID

    this.uh = []

    this.mark.type = !!spec.type
    this.mark.hide = !!spec.hide

    // console.log('BV', this.id, this.constructor.name, this.peg?.canon)
  }


  ctx() {
    return this.#ctx
  }


  get done() {
    return this.dc === DONE
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.id === peer.id
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let cloneCtx

    let cut = this.path.indexOf('&')
    cut = -1 < cut ? cut + 1 : ctx.path.length
    cloneCtx = ctx.clone({
      path: ctx.path.concat(this.path.slice(cut))
    })

    let fullspec = { peg: this.peg, type: this.mark.type, hide: this.mark.hide, ...(spec ?? {}) }

    let out = new (this as any)
      .constructor(fullspec, cloneCtx)

    out.row = spec?.row || this.row || -1
    out.col = spec?.col || this.col || -1
    out.url = spec?.url || this.url || ''

    // TODO: should not be needed - update all VAL ctors to handle spec.type
    out.mark.type = this.mark.type && fullspec.type
    out.mark.hide = this.mark.hide && fullspec.hide

    return out
  }


  // TODO: should use Site
  place(v: Val) {
    v.row = this.row
    v.col = this.col
    v.url = this.url
    return v
  }


  // TODO: make Site work
  get site(): Site {
    return new Site(this)
  }

  // NOTE: MUST not mutate! Val immutability is a critical assumption. 
  unify(_peer: Val, _ctx?: Context): Val { return this }

  get canon(): string { return '' }


  errcanon(): string {
    return 0 === this.err.length ? '' : `<ERRS:${this.err.length}>`
  }


  gen(_ctx: Context): any {
    return undefined
  }


  notdone() {
    this.dc = DONE === this.dc ? DONE : this.dc + 1
  }


  abstract superior(): Val

}

export {
  BaseVal,
}
