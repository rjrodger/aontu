/* Copyright (c) 2022-2025 Richard Rodger, MIT License */

import { inspect } from 'node:util'

import type { AontuContext } from '../ctx'

import {
  Site
} from '../site'


type ValMark = {
  type: boolean,
  hide: boolean,

  // Custom marks must have _ prefix.
  [name: `_${string}`]: boolean,
}

type ValSpec = {
  peg?: any,
  mark?: Partial<ValMark>,
  kind?: any,
  row?: number,
  col?: number,
  url?: string,
  path?: string[],
  id?: number,
  src?: string,

  // NilVal specific
  why?: string,
  msg?: string,
  err?: any[] | any,

  // RefVal specific
  absolute?: boolean,
  prefix?: boolean,
}



const DONE = -1

const SPREAD = Symbol('spread')


let ID = 1000


abstract class Val {
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
  site: Site = new Site()

  // Map of boolean flags.
  mark: ValMark = { type: false, hide: false }

  // Actual native value.
  peg: any = undefined

  // TODO: used for top level result - not great
  // err: Omit<any[], "push"> = []
  err: any[] = []
  explain: any[] | null = null

  uh: number[]

  deps?: any

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

    let path = spec?.path
    if (null == path) {
      let cut = this.path.indexOf('&')
      cut = -1 < cut ? cut + 1 : ctx.path.length
      path = ctx.path.concat(this.path.slice(cut))
    }
    // console.log('CLONE', path, this.canon)
    // console.trace()

    cloneCtx = ctx.clone({ path })

    let fullspec = {
      peg: this.peg,
      mark: { type: this.mark.type, hide: this.mark.hide },
      ...(spec ?? {})
    }

    let out = new (this as any)
      .constructor(fullspec, cloneCtx)

    out.site.row = spec?.row ?? this.site.row ?? -1
    out.site.col = spec?.col ?? this.site.col ?? -1
    out.site.url = spec?.url ?? this.site.url ?? ''

    // TODO: should not be needed - update all VAL ctors to handle spec.mark
    out.mark.type = this.mark.type && (fullspec.mark?.type ?? true)
    out.mark.hide = this.mark.hide && (fullspec.mark?.hide ?? true)

    return out
  }


  place(v: Val) {
    v.site.row = this.site.row
    v.site.col = this.site.col
    v.site.url = this.site.url
    return v
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


  [inspect.custom](d: number, _opts: any, _inspect: any) {
    return this.inspect(d)
  }

  inspect(d?: number): string {
    d = null == d ? -1 : d
    let s = ['<' + this.constructor.name.replace(/Val$/, '') + '/' + this.id]

    s.push('/' + this.path.join('.') + '/')

    s.push([
      DONE === this.dc ? 'D' : 'd' + this.dc,
      ...Object.entries(this.mark).filter(n => n[1]).map(n => n[0]).sort()
    ].filter(n => null != n).join(','))

    // let insp = this.inspection(inspect)
    let insp = this.inspection(1 + d)
    if (null != insp && '' != insp) {
      s.push('/' + insp)
    }

    s.push('/')

    if (null != this.peg && 'object' === typeof this.peg &&
      (Object.entries(this.peg)[0]?.[1] as any)?.isVal) {
      s.push(inspectpeg(this.peg, 1 + d))
    }
    else if ('function' === typeof this.peg) {
      s.push(this.peg.name)
    }
    else {
      s.push(this.peg?.toString?.() ?? '')
    }

    s.push('>')

    const out = s.join('')

    return out
  }


  inspection(d?: number) {
    return ''
  }

}


function inspectpeg(peg: any, d: number) {
  const indent = '  '.repeat(d)
  return pretty(Array.isArray(peg) ?
    ('[' + peg.map(n => '\n  ' + indent + (n.inspect?.(d) ?? n)).join(',') +
      '\n' + indent + ']') :
    ('{' +
      Object.entries(peg).map((n: any) =>
        '\n  ' + indent + n[0] + ': ' + // n[1].inspect(d)
        (n[1].inspect(d) ?? '' + n[1])
      ).join(',') +
      '\n' + indent + '}')
  )
}

function pretty(s: string) {
  return (
    (String(s))
      .replace(/\[Object: null prototype\]/g, '')
    // .replace(/([^\n]) +/g, '$1')
  )
}


function empty(o: any) {
  return (
    (Array.isArray(o) && 0 === o.length)
    || (null != o && 'object' === typeof o && 0 === Object.keys(o).length)
    || false
  )
}



export type {
  ValMark,
  ValSpec,
}

export {
  Val,
  DONE,
  SPREAD,
  empty
}
