/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { AontuContext } from './ctx'

import { DONE } from './type'


import { NilVal } from './val/NilVal'

import {
  Lang
} from './lang'


import {
  explainOpen, ec, explainClose,
} from './utility'


import {
  top
} from './val/valutil'



// TODO: relation to unify loops?
const MAXCYCLE = 9

let uc = 0

// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx: AontuContext, a: any, b: any, whence: string, explain?: any[]) => {
  const te = ctx.explain && explainOpen(ctx, explain, 'unite', a, b)

  let out = a
  let why = 'u'

  const saw = (a ? a.id + (a.done ? '' : '*') : '') + '~' + (b ? b.id + (b.done ? '' : '*') : '')

  if (MAXCYCLE < ctx.seen[saw]) {
    out = NilVal.make(ctx, 'cycle', a, b)
  }
  else {
    ctx.seen[saw] = 1 + (ctx.seen[saw] ?? 0)

    try {

      let unified = false

      if (b && (!a || a.isTop)) {
        out = b
        why = 'b'
      }

      else if (a && (!b || b.isTop)) {
        out = a
        why = 'a'
      }

      else if (a && b && !b.isTop) {
        if (a.isNil) {
          out = update(a, b)
          why = 'an'
        }
        else if (b.isNil) {
          out = update(b, a)
          why = 'bn'
        }
        else if (a.isConjunct) {
          out = a.unify(b, ctx, ec(te, 'CJ'))
          unified = true
          why = 'acj'
        }
        else if (
          b.isConjunct
          || b.isDisjunct
          || b.isRef
          || b.isPref
          || b.isFunc
        ) {

          out = b.unify(a, ctx, ec(te, 'BW'))
          unified = true
          why = 'bv'
        }

        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
          out = update(a, b)
          why = 'up'
        }

        else {
          out = a.unify(b, ctx, ec(te, 'GN'))
          unified = true
          why = 'ab'
        }
      }

      if (!out || !out.unify) {
        out = NilVal.make(ctx, 'unite', a, b, whence + '/nil')
        why += 'N'
      }

      if (DONE !== out.dc && !unified) {
        let nout = out.unify(top(), ctx, ec(te, 'ND'))
        out = nout
        why += 'T'
      }

      uc++
    }
    catch (err: any) {
      // TODO: handle unexpected
      out = NilVal.make(ctx, 'internal', a, b)
    }
  }

  explain && explainClose(te, out)

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


/*
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

  // errlist: Omit<NilVal[], "push">  // Nil error log of current unify.
  err: any[]
  explain: any[] | null

  // TODO: separate options and context!!!
  srcpath?: string

  constructor(cfg: {
    root: Val
    path?: Path
    srcpath?: string,
    err?: any[]
    explain?: any[] | null
    vc?: number
    cc?: number
    var?: Record<string, Val>
    src?: string
    seenI?: number
    seen?: Record<string, number>
    collect?: boolean
    fs?: any
  }) {
    this.root = cfg.root
    this.path = cfg.path || []
    this.src = cfg.src

    this.collect = cfg.collect ?? null != cfg.err
    this.err = cfg.err ?? []
    this.explain = cfg.explain ?? null

    this.fs = cfg.fs ?? null

    // Multiple unify passes will keep incrementing Val counter.
    this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc

    this.cc = null == cfg.cc ? this.cc : cfg.cc

    this.var = cfg.var ?? this.var
    this.seenI = cfg.seenI ?? 0
    this.seen = cfg.seen ?? {}

    this.srcpath = cfg.srcpath ?? undefined
  }


  clone(cfg: {
    root?: Val,
    path?: Path,
    err?: any[]
  }): Context {
    const ctx = Object.create(this)
    ctx.path = cfg.path ?? this.path
    ctx.root = cfg.root ?? this.root
    ctx.var = Object.create(this.var)

    ctx.err = cfg.err ?? ctx.err

    return ctx
  }

  descend(key: string): Context {
    return this.clone({
      root: this.root,
      path: this.path.concat(key),
    })
  }


  adderr(err: NilVal, whence?: string) {
    this.err.push(err)
    if (null == err.msg || '' == err.msg) {
      descErr(err, this)
    }
  }


  errmsg() {
    // return this.errlist
    return this.err
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
*/

class Unify {
  root: Val
  res: Val
  // err: Omit<NilVal[], "push">
  err: any[]
  explain: any[] | null
  cc: number
  lang: Lang

  constructor(root: Val | string, lang?: Lang, ctx?: AontuContext | any, src?: any) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    if ('string' !== typeof src) {
      src = ''
    }

    this.cc = 0
    this.root = root
    this.res = root
    this.err = ctx?.err ?? root.err ?? []
    this.explain = ctx?.explain ?? root.explain ?? null

    let res = root
    let uctx: AontuContext

    // Only unify if no syntax errors
    if (!(root as NilVal).nil) {
      if (ctx instanceof AontuContext) {
        uctx = ctx
      }
      else {
        uctx = new AontuContext({
          ...(ctx || {}),
          root: res,
          err: this.err,
          explain: this.explain,
          src,
        })
      }

      // TODO: messy
      // uctx.seterr(this.err)
      uctx.err = this.err
      uctx.explain = this.explain

      const explain = null == ctx?.explain ? undefined : ctx?.explain
      const te = explain && explainOpen(uctx, explain, 'root', res)

      // NOTE: if true === res.done already, then this loop never needs to run.
      let maxcc = 9 // 99
      for (; this.cc < maxcc && DONE !== res.dc; this.cc++) {
        // console.log('CC', this.cc, res.canon)
        uctx.cc = this.cc
        res = unite(uctx, res, top(), 'unify', explain && ec(te, 'run'))

        if (0 < uctx.err.length) {
          break
        }

        uctx = uctx.clone({ root: res })
      }

      explain && explainClose(te, res)
    }

    this.res = res
  }
}




export {
  Unify,
  unite,
}
