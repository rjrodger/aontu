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

// Shared frozen empty array for lazy err initialization.
// Most Vals never accumulate errors, so this avoids one allocation per Val.
// Frozen to catch accidental mutation (e.g. push) - callers that need a
// mutable error array must create their own.
const EMPTY_ERR: any[] = Object.freeze([]) as unknown as any[]


let ID = 1000


abstract class Val {
  // Type-discriminator flags: defaults live on Val.prototype (see
  // bottom of this file). Each subclass overrides only its own
  // discriminator(s), so a plain Val instance writes zero flags.
  declare isVal: boolean

  declare isTop: boolean
  declare isNil: boolean
  declare isMap: boolean
  declare isList: boolean
  declare isScalar: boolean
  declare isScalarKind: boolean
  declare isRef: boolean
  declare isPref: boolean
  declare isVar: boolean
  declare isBag: boolean
  declare isSpread: boolean
  declare isNumber: boolean
  declare isInteger: boolean
  declare isString: boolean
  declare isBoolean: boolean
  declare isConjunct: boolean
  declare isDisjunct: boolean
  declare isJunction: boolean

  // Conjunct sort order. Lower values sort first in norm().
  declare cjo: number

  declare isOp: boolean
  declare isPlusOp: boolean

  declare isFunc: boolean
  declare isCloseFunc: boolean
  declare isCopyFunc: boolean
  declare isHideFunc: boolean
  declare isMoveFunc: boolean
  declare isKeyFunc: boolean
  declare isLowerFunc: boolean
  declare isOpenFunc: boolean
  declare isPathFunc: boolean
  declare isPrefFunc: boolean
  declare isSuperFunc: boolean
  declare isTypeFunc: boolean
  declare isUpperFunc: boolean

  declare isGenable: boolean

  id: number
  dc: number = 0
  path: string[] = []

  // Lazy site: allocated on first access via getter.
  // Saves one Site allocation per Val in hot paths where
  // site is replaced before first access (e.g. MapVal/ListVal.unify).
  private _site?: Site

  get site(): Site {
    return this._site ??= new Site()
  }

  set site(s: Site) {
    this._site = s
  }

  // Map of boolean flags.
  mark: ValMark = {
    type: false,
    hide: false,
  }

  // Actual native value.
  peg: any = undefined

  // Lazy err: shared empty array avoids allocation per Val.
  // Most Vals never accumulate errors. Only NilVal and top-level
  // results assign a real error array.
  err: any[] = EMPTY_ERR
  explain: any[] | null = null

  // Lazy uh: only allocated on first push in MapVal/ListVal.unify.
  uh?: number[]

  deps?: any

  #ctx: any

  // TODO: Site needed in ctor
  constructor(spec: ValSpec, ctx?: AontuContext) {
    this.#ctx = ctx

    this.peg = spec?.peg

    if (Array.isArray(this.peg)) {
      let spread = (this.peg as any)[SPREAD]
      if (this.peg.includes(undefined)) {
        this.peg = this.peg.filter(n => undefined !== n)
      }
      ;(this.peg as any)[SPREAD] = spread
    }

    // spec.path takes precedence over ctx.path: lets callers (notably
    // Val.clone) specify the target path without paying for a full
    // ctx.clone just to carry it.
    this.path = spec?.path ?? ctx?.path ?? []

    // TODO: make this work
    // this.id = spec?.id ?? (ctx ? ++ctx.vc : ++ID)
    this.id = ++ID

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
    let path = spec?.path
    if (null == path) {
      let cut = this.path.indexOf('&')
      cut = -1 < cut ? cut + 1 : ctx.path.length
      path = ctx.path.concat(this.path.slice(cut))
    }

    // Carry the target path via the spec instead of cloning ctx just
    // to hold it: the Val constructor now reads spec.path first. This
    // saves ~120k ctx.clone calls (two Object.create each) on a
    // foo-sdk-sized model.
    let fullspec = {
      peg: this.peg,
      mark: { type: this.mark.type, hide: this.mark.hide },
      ...(spec ?? {}),
      path,
    }

    let out = new (this as any)
      .constructor(fullspec, ctx)

    out.dc = this.done ? DONE : out.dc

    out.site.row = spec?.row ?? this.site.row ?? -1
    out.site.col = spec?.col ?? this.site.col ?? -1
    out.site.url = spec?.url ?? this.site.url ?? ''

    out.mark = Object.assign({}, this.mark, fullspec.mark ?? {})
    out.mark.type = this.mark.type && (fullspec.mark?.type ?? true)
    out.mark.hide = this.mark.hide && (fullspec.mark?.hide ?? true)

    return out
  }


  // Shallow clone for spread constraints: creates a new Val with the
  // correct path context but shares non-path-dependent children.
  // Override in MapVal/ListVal to avoid deep-cloning simple children.
  spreadClone(ctx: AontuContext): Val {
    return this.clone(ctx)
  }


  // True if this Val's unification result depends on its own `path`
  // — i.e. the tree contains a RefVal, KeyFuncVal, PathFuncVal,
  // MoveFuncVal, or SuperFuncVal. Used by MapVal/ListVal.spreadClone
  // to share the spread constraint across keys when it's safe.
  // Lazy + cached: the answer is a function of the Val's immutable
  // structure, so we compute once per Val.
  _isPathDependent?: boolean
  get isPathDependent(): boolean {
    if (this._isPathDependent !== undefined) return this._isPathDependent
    let dep =
      this.isRef || this.isKeyFunc || this.isPathFunc ||
      this.isMoveFunc || this.isSuperFunc
    if (!dep) {
      const peg = this.peg
      if (Array.isArray(peg)) {
        for (let i = 0; i < peg.length; i++) {
          const c = peg[i]
          if (c && c.isVal && c.isPathDependent) { dep = true; break }
        }
      }
      else if (peg != null && typeof peg === 'object') {
        for (const k in peg) {
          const c = (peg as any)[k]
          if (c && c.isVal && c.isPathDependent) { dep = true; break }
        }
      }
      if (!dep) {
        const spreadCj = (this as any).spread?.cj as Val | undefined
        if (spreadCj && spreadCj.isPathDependent) dep = true
      }
    }
    this._isPathDependent = dep
    return dep
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

    s.push('/@' + this.site?.row + ',' + this.site?.col)

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

    if (this.peg?.isVal) {
      s.push(this.peg.inspect(1 + d))
    }
    else if (null != this.peg && 'object' === typeof this.peg &&
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


  inspection(_d?: number) {
    return ''
  }

}


// Prototype-level defaults for Val's type-discriminator flags.
// Keeping these on the prototype (instead of per-instance class-field
// initializers) removes ~35 property writes from every Val construction
// and eliminates the corresponding hidden-class transitions. Subclasses
// override only the flags that differ, via their own class-field
// initializers (e.g. `MapVal.isMap = true`).
Object.assign(Val.prototype, {
  isVal: true,

  isTop: false,
  isNil: false,
  isMap: false,
  isList: false,
  isScalar: false,
  isScalarKind: false,
  isRef: false,
  isPref: false,
  isVar: false,
  isBag: false,
  isSpread: false,
  isNumber: false,
  isInteger: false,
  isString: false,
  isBoolean: false,
  isConjunct: false,
  isDisjunct: false,
  isJunction: false,

  cjo: 99999,

  isOp: false,
  isPlusOp: false,

  isFunc: false,
  isCloseFunc: false,
  isCopyFunc: false,
  isHideFunc: false,
  isMoveFunc: false,
  isKeyFunc: false,
  isLowerFunc: false,
  isOpenFunc: false,
  isPathFunc: false,
  isPrefFunc: false,
  isSuperFunc: false,
  isTypeFunc: false,
  isUpperFunc: false,

  isGenable: false,
})


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
  EMPTY_ERR,
  empty
}
