/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import { inspect } from 'node:util'

import type {
  Val,
  ValMark,
  ValSpec,
} from '../type'


import {
  DONE,
  SPREAD,
} from '../type'


import {
  AontuContext,
} from '../ctx'

import {
  Site
} from '../site'


/*
import {
  top
} from './top'
*/



// function top() { return null as unknown as Val }


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

  id: number
  dc: number = 0
  path: string[] = []
  row: number = -1
  col: number = -1
  url: string = ''

  // Map of boolean flags.
  mark: ValMark = { type: false, hide: false }

  // Actual native value.
  peg: any = undefined

  // TODO: used for top level result - not great
  // err: Omit<any[], "push"> = []
  err: any[] = []
  explain: any[] | null = null

  uh: number[]

  // TODO: implement!
  // site: Site

  #ctx: any

  // TODO: Site needed in ctor
  constructor(spec: ValSpec, ctx?: AontuContext) {
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

    this.mark.type = !!spec.mark?.type
    this.mark.hide = !!spec.mark?.hide

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


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let cloneCtx

    let cut = this.path.indexOf('&')
    cut = -1 < cut ? cut + 1 : ctx.path.length
    cloneCtx = ctx.clone({
      path: ctx.path.concat(this.path.slice(cut))
    })

    let fullspec = {
      peg: this.peg,
      mark: { type: this.mark.type, hide: this.mark.hide },
      ...(spec ?? {})
    }

    let out = new (this as any)
      .constructor(fullspec, cloneCtx)

    out.row = spec?.row || this.row || -1
    out.col = spec?.col || this.col || -1
    out.url = spec?.url || this.url || ''

    // TODO: should not be needed - update all VAL ctors to handle spec.mark
    out.mark.type = this.mark.type && (fullspec.mark?.type ?? true)
    out.mark.hide = this.mark.hide && (fullspec.mark?.hide ?? true)

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
  unify(_peer: Val, _ctx: AontuContext): Val { return this }

  // TODO: indicate marks in some way that is ignored by reparse.
  // Need an annotation/taggins syntax? a:{}/type ?
  get canon(): string { return '' }


  errcanon(): string {
    return 0 === this.err.length ? '' : `<ERRS:${this.err.length}>`
  }


  gen(_ctx: AontuContext): any {
    return undefined
  }


  notdone() {
    this.dc = DONE === this.dc ? DONE : this.dc + 1
  }


  abstract superior(): Val
  /*
  superior(): Val {
    return top()
  }
  */

  [inspect.custom](_d: number, _o: any, _inspect: any): string {
    let s = ['<' + this.constructor.name.replace(/Val$/, '') + '/' + this.id]

    s.push('/' + this.path.join('.') + '/')

    s.push([
      DONE === this.dc ? 'D' : 'd' + this.dc,
      ...Object.entries(this.mark).filter(n => n[1]).map(n => n[0]).sort()
    ].filter(n => null != n).join(','))

    let insp = this.inspection(inspect)
    if (null != insp && '' != insp) {
      s.push('/' + insp)
    }

    s.push('/')

    if ('object' === typeof this.peg) {
      s.push(inspectpeg(this.peg))
    }
    else if ('function' === typeof this.peg) {
      s.push(this.peg.name)
    }
    else {
      s.push(this.peg)
    }

    s.push('>')

    const out = s.join('')

    return out
  }


  inspection(_inspect: Function) {
    return ''
  }

}


function inspectpeg(peg: any) {
  return pretty(!Array.isArray(peg) ? inspect(peg) :
    ('[' + peg.map(n => inspect(n)).join(',\n') + ']'))
}

function pretty(s: string) {
  return (
    (String(s))
      .replace(/\[Object: null prototype\]/g, '')
      .replace(/\s+/g, '')
  )
}


export {
  BaseVal,
}
