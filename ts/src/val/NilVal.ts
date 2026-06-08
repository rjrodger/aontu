/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  AontuContext,
} from '../ctx'


import { Val, EMPTY_ERR } from './Val'

import { AontuError, descErr } from '../err'


class NilVal extends Val {
  isNil = true
  isGenable = true

  nil = true
  why: any
  primary?: Val
  secondary?: Val
  msg: string = ''
  attempt?: string
  details?: Record<string, any>

  // TODO: include Val generating nil, thus capture type

  // A Nil is an error - should not happen - unify failed
  // refactor ,make(spec,ctx)
  static make = (
    ctx?: AontuContext,
    why?: any,
    av?: Val,
    bv?: Val,
    attempt?: string,
    details?: Record<string, any>
  ) => {
    let nil = new NilVal({ why }, ctx)

    nil.attempt = attempt
    nil.details = details

    // Terms later in same file are considered the primary error location.
    if (null != av) {
      nil.site.row = av.site.row
      nil.site.col = av.site.col
      nil.site.url = av.site.url

      nil.primary = av
      nil.path = av.path

      if (null != bv) {
        nil.secondary = bv

        let bv_loc_wins =
          (nil.site.url === bv.site.url) && (
            (nil.site.row < bv.site.row) ||
            (nil.site.row === bv.site.row && nil.site.col < bv.site.col)
          )

        if (bv_loc_wins) {
          nil.site.row = bv.site.row
          nil.site.col = bv.site.col
          nil.site.url = bv.site.url
          nil.primary = bv
          nil.secondary = av
          nil.path = bv.path
        }
      }
    }

    if (ctx) {
      ctx.adderr(nil)
    }

    return nil
  }


  constructor(
    spec?: {
      why?: string
      msg?: string
      err?: NilVal | NilVal[] | Error | Error[]
    } | string,
    ctx?: AontuContext
  ) {
    super(spec && 'string' !== typeof spec ? spec : {}, ctx)

    if (spec && 'object' === typeof spec) {
      this.why = spec?.why
      this.msg = 'string' === typeof spec?.msg ? spec.msg : this.msg
      this.err = spec ?
        Array.isArray(spec.err) ? [...spec.err] :
          null != spec.err ? [spec.err] :
            EMPTY_ERR : EMPTY_ERR
    }

    // Nil is always DONE, by definition.
    this.dc = DONE
  }


  unify(_peer: Val, _ctx: AontuContext) {
    return this
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as NilVal)
    out.why = this.why

    // Should these clone?
    // out.primary = this.primary?.clone()
    // out.secondary = this.secondary?.clone()
    out.primary = this.primary
    out.secondary = this.secondary

    out.msg = this.msg
    return out
  }


  // TODO: custom canon? useful for unknown function errors
  get canon() {
    return 'nil'
  }


  gen(ctx: AontuContext) {
    // Unresolved nil cannot be generated, so always an error.

    this.why = this.why ?? 'nil_gen'
    ctx.adderr(this)

    if (!ctx.collect) {
      if (null == this.msg || '' === this.msg) {
        descErr(this, ctx)
      }
      const err = new AontuError(this.msg, [this])
      throw err
    }

    return undefined
  }


  superior(): Val {
    return this
  }


  inspection() {
    return this.why
  }

}


// Shared sentinel for transient "this unification branch failed"
// markers. Used by DisjunctVal.unify to flag failed member trials
// (and to dedup results) without allocating a fresh NilVal per
// failure. The sentinel is filtered out before the disjunct result
// is constructed, so its .why / .site / .primary fields are never
// inspected by user-visible code.
//
// Do NOT use this sentinel for errors that may surface: those need
// real NilVals with proper site/path info for descErr formatting.
const TRIAL_NIL = new NilVal({ why: '|:trial-nil' })


export {
  NilVal,
  TRIAL_NIL,
}
