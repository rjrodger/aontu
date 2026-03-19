/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { AontuContext } from './ctx'

import { DONE } from './type'

import { makeNilErr } from './err'

import { NilVal } from './val/NilVal'

import {
  Lang
} from './lang'


import {
  explainOpen, ec, explainClose,
} from './utility'


import {
  top
} from './val/top'


// TODO: FIX: false positive when too many top unifications
const MAXCYCLE = 999

// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx: AontuContext, a: any, b: any, whence: string) => {
  const te = ctx.explain && explainOpen(ctx, ctx.explain, 'unite', a, b)

  let out = a
  let why = 'u'

  // Cycle-detection key. Use numeric path index for speed; fall back to
  // full string key when debug is enabled so the saw value is human-readable.
  const saw = ctx.opts.debug
    ? (a ? a.id + (a.done ? '' : '*') : '') + '~' +
      (b ? b.id + (b.done ? '' : '*') : '') + '@' + ctx.pathstr
    : (a ? a.id + (a.done ? 'd' : '') : 0) + '~' +
      (b ? b.id + (b.done ? 'd' : '') : 0) + '~' + ctx.pathidx

  // NOTE: if this error occurs "unreasonably", attemp to avoid unnecesary unification
  // See for example PrefVal peg.id equality inspection.
  const sawCount = ctx.seen[saw] ?? 0
  if (MAXCYCLE < sawCount) {
    // console.log('SAW', sawCount, saw, a?.id, a?.canon, b?.id, b?.canon, ctx.cc)
    out = makeNilErr(ctx, 'unify_cycle', a, b)
  }
  else {
    ctx.seen[saw] = sawCount + 1

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
          out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'CJ') }) : ctx)
          unified = true
          why = 'acj'
        }
        else if (a.isExpect) {
          out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'AE') }) : ctx)
          unified = true
          why = 'ae'
        }
        else if (
          b.isConjunct
          || b.isDisjunct
          || b.isRef
          || b.isPref
          || b.isFunc
          || b.isExpect
        ) {

          out = b.unify(a, te ? ctx.clone({ explain: ec(te, 'BW') }) : ctx)
          unified = true
          why = 'bv'
        }

        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
          out = update(a, b)
          why = 'up'
        }

        else {
          out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'GN') }) : ctx)
          unified = true
          why = 'ab'
        }
      }

      if (!out || !out.unify) {
        out = makeNilErr(ctx, 'unite', a, b, whence + '/nil')
        why += 'N'
      }

      // console.log('UNITE-DONE', out.id, out.canon, out.done)

      // if (DONE !== out.dc && !unified) {
      if (!out.done && !unified) {
        let nout = out.unify(top(), te ? ctx.clone({ explain: ec(te, 'ND') }) : ctx)
        out = nout
        why += 'T'
      }

      // console.log('UNITE', why, a?.id, a?.canon, a?.done, b?.id, b?.canon, b?.done, '->', out?.id, out?.canon, out?.done)
    }
    catch (err: any) {
      // console.log(err)
      // TODO: handle unexpected
      out = makeNilErr(ctx, 'internal', a, b)
    }
  }

  ctx.explain && explainClose(te, out)

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


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
    // Always use a fresh array for mutable error collection to avoid
    // mutating the shared EMPTY_ERR singleton on Val instances.
    this.err = ctx?.err ?? (root.err.length > 0 ? root.err : [])
    this.explain = ctx?.explain ?? root.explain ?? null

    let res = root
    let uctx: AontuContext

    // Only unify if no syntax errors
    if (!(root as NilVal).isNil) {
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
        uctx.seen = {}
        res = unite(te ? uctx.clone({ explain: ec(te, 'run') }) : uctx, res, top(), 'unify')

        if (0 < uctx.err.length) {
          break
        }

        uctx = uctx.clone({ root: res })
      }

      uctx.explain && explainClose(te, res)
    }

    this.res = res
  }
}




export {
  Unify,
  unite,
}
