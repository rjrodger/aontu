/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { DONE, FST } from './type'


import {
  TOP,
  MapVal,
  ListVal,
  NilVal,
} from './val'

import {
  Lang
} from './lang'

import {
  descErr
} from './err'


type Path = string[]

// TODO: relation to unify loops?
const MAXCYCLE = 9

let uc = 0

// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx: Context, a: any, b: any, whence: string) => {
  const ac = a?.canon
  const bc = b?.canon

  let out = a
  let why = 'u'

  const saw = (a ? a.id + (a.done ? '' : '*') : '') + '~' + (b ? b.id + (b.done ? '' : '*') : '')
  // console.log('SAW', saw)

  if (MAXCYCLE < ctx.seen[saw]) {
    out = NilVal.make(ctx, 'cycle', a, b)
  }
  else {
    ctx.seen[saw] = 1 + (ctx.seen[saw] ?? 0)

    try {

      let unified = false

      // if (b && (TOP === a || !a)) {
      if (b && (!a || a.isTop)) {
        out = b
        why = 'b'
      }

      // else if (a && (TOP === b || !b)) {
      else if (a && (!b || b.isTop)) {
        out = a
        why = 'a'
      }

      // else if (a && b && TOP !== b) {
      else if (a && b && !b.isTop) {
        if (a.isNil) {
          out = update(a, b)
          why = 'an'
        }
        else if (b.isNil) {
          out = update(b, a)
          why = 'bn'
        }
        else if (a.isConjunctVal) {
          out = a.unify(b, ctx)
          unified = true
          why = 'acj'
        }
        else if (
          b.isConjunctVal
          || b.isDisjunct
          || b.isRefVal
          || b.isPrefVal
          || b.isFuncVal
        ) {

          out = b.unify(a, ctx)
          unified = true
          why = 'bv'
        }

        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
          out = update(a, b)
          why = 'up'
        }

        else {
          out = a.unify(b, ctx)
          unified = true
          why = 'ab'
        }
      }

      if (!out || !out.unify) {
        out = NilVal.make(ctx, 'unite', a, b, whence + '/nil')
        why += 'N'
      }

      if (DONE !== out.dc && !unified) {
        let nout = out.unify(TOP, ctx)
        // console.log('UNITE-NOTDONE', out.canon, '->', nout.canon)
        out = nout
        why += 'T'
      }

      uc++

      // TODO: KEEP THIS! print in debug mode! push to ctx.log?
      /*
      // console.log(
        'U',
        ('' + ctx.cc).padStart(2),
        ('' + uc).padStart(4),
        (whence || '').substring(0, 16).padEnd(16),
        why.padEnd(6),
        ctx.path.join('.').padEnd(16),
        (a || '').constructor.name.substring(0, 3),
        '&',
        (b || '').constructor.name.substring(0, 3),
        '|',
        '  '.repeat(ctx.path.length),
        a?.canon, '&', b?.canon, '->', out.canon)
      */

    }
    catch (err: any) {
      // console.log(err)
      out = NilVal.make(ctx, 'internal', a, b)
    }
  }

  // console.log('UNITE', ctx.cc, whence, a?.id + '=' + ac, b?.id + '=' + bc, '->', out?.canon, 'W=' + why, 'E=', out?.err)

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


class Context {
  root: Val   // Starting Val, root of paths.
  path: Path  // Path to current Val.
  // err: Omit<Nil[], "push">  // Nil error log of current unify.
  vc: number  // Val counter to create unique val ids.
  cc: number = -1
  var: Record<string, Val> = {}
  src?: string
  fs?: FST

  seenI: number
  seen: Record<string, number>

  collect: boolean

  #errlist: Omit<NilVal[], "push">  // Nil error log of current unify.

  constructor(cfg: {
    root: Val
    path?: Path
    err?: Omit<NilVal[], "push">
    vc?: number
    cc?: number
    var?: Record<string, Val>
    src?: string
    seenI?: number
    seen?: Record<string, number>
    collect?: boolean
  }) {
    this.root = cfg.root
    this.path = cfg.path || []
    // this.err = cfg.err || []
    this.src = cfg.src

    this.collect = cfg.collect ?? null != cfg.err
    this.#errlist = cfg.err || []

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc

    this.cc = null == cfg.cc ? this.cc : cfg.cc

    this.var = cfg.var || this.var

    this.seenI = cfg.seenI ?? 0
    this.seen = cfg.seen ?? {}
  }


  clone(cfg: {
    root?: Val,
    path?: Path,
    err?: Omit<NilVal[], "push">,
  }): Context {
    return new Context({
      root: cfg.root || this.root,
      path: cfg.path,
      err: cfg.err || this.#errlist,
      vc: this.vc,
      cc: this.cc,
      var: { ...this.var },
      src: this.src,
      seenI: this.seenI,
      seen: this.seen,
      collect: this.collect,
    })
  }


  descend(key: string): Context {
    return this.clone({
      root: this.root,
      path: this.path.concat(key),
    })
  }


  get err() {
    let a: any = [...this.#errlist]
    a.push = () => {
      throw new Error('ERR-PUSH')
    }
    return a
  }


  adderr(err: NilVal, whence?: string) {
    ; (this.#errlist as any).push(err)
    if (null == err.msg || '' == err.msg) {
      descErr(err, this)
    }
  }


  errmsg() {
    return this.#errlist
      .map((err: any) => err?.msg)
      .filter(msg => null != msg)
      .join('\n------\n')
  }


  find(path: string[]): Val | undefined {
    let node: Val | undefined = this.root
    let pI = 0
    for (; pI < path.length; pI++) {
      let part = path[pI]

      if (node instanceof MapVal) {
        node = node.peg[part]
      }
      else if (node instanceof ListVal) {
        node = node.peg[part]
      }
      else {
        break;
      }
    }

    if (pI < path.length) {
      node = undefined
    }

    return node
  }
}


class Unify {
  root: Val
  res: Val
  err: Omit<NilVal[], "push">
  cc: number
  lang: Lang

  constructor(root: Val | string, lang?: Lang, ctx?: Context, src?: string) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    this.cc = 0
    this.root = root
    this.res = root
    this.err = root.err || []

    let res = root
    let uctx = ctx

    // Only unify if no syntax errors
    if (!(root as NilVal).nil) {
      uctx = uctx ?? new Context({
        root: res,
        err: this.err,
        src,
      })

      let maxcc = 9 // 99
      for (; this.cc < maxcc && DONE !== res.dc; this.cc++) {
        // console.log('CC', this.cc, res.canon)
        uctx.cc = this.cc
        res = unite(uctx, res, TOP, 'unify')
        uctx = uctx.clone({ root: res })
      }
    }

    // console.log('CC-END', uctx?.cc, uctx?.err)

    this.res = res
  }
}


export {
  Context,
  Path,
  Unify,
  unite,
}
