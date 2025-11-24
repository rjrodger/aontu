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

let uc = 0

// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx: AontuContext, a: any, b: any, whence: string) => {
  const te = ctx.explain && explainOpen(ctx, ctx.explain, 'unite', a, b)

  let out = a
  let why = 'u'

  const saw =
    (a ? a.id + (a.done ? '' : '*') : '') + '~' + (b ? b.id + (b.done ? '' : '*') : '') +
    '@' + ctx.pathstr


  /*
  if (1 < ctx.seen[saw]) {
    console.log('UNITE-SAW', ctx.cc, saw, ctx.seen[saw], 1 < ctx.seen[saw] ? (a?.canon + ' ~ ' + b?.canon) : '')
    // console.trace()
    // process.exit()
  }
  */

  // NOTE: if this error occurs "unreasonably", attemp to avoid unnecesary unification
  // See for example PrefVal peg.id equality inspection.
  if (MAXCYCLE < ctx.seen[saw]) {
    // console.log('SAW', ctx.seen[saw], saw, a?.id, a?.canon, b?.id, b?.canon, ctx.cc)
    out = makeNilErr(ctx, 'unify_cycle', a, b)
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
          out = a.unify(b, ctx.clone({ explain: ec(te, 'CJ') }))
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

          out = b.unify(a, ctx.clone({ explain: ec(te, 'BW') }))
          unified = true
          why = 'bv'
        }

        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
          out = update(a, b)
          why = 'up'
        }

        else {
          out = a.unify(b, ctx.clone({ explain: ec(te, 'GN') }))
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
        let nout = out.unify(top(), ctx.clone({ explain: ec(te, 'ND') }))
        out = nout
        why += 'T'
      }

      // console.log('UNITE', why, a?.id, a?.canon, a?.done, b?.id, b?.canon, b?.done, '->', out?.id, out?.canon, out?.done)

      uc++
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
    this.err = ctx?.err ?? root.err ?? []
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
        res = unite(uctx.clone({ explain: ec(te, 'run') }), res, top(), 'unify')

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
