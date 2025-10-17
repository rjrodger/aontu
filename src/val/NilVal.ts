/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  descErr
} from '../err'

import {
  Context,
} from '../unify'


import { BaseVal } from './BaseVal'



class NilVal extends BaseVal {
  isNil = true

  nil = true
  why: any
  primary?: Val
  secondary?: Val
  msg: string = ''
  attempt?: string

  // TODO: include Val generating nil, thus capture type

  // A Nil is an error - should not happen - unify failed
  // refactor ,make(spec,ctx)
  static make = (ctx?: Context, why?: any, av?: Val, bv?: Val, attempt?: string) => {
    let nil = new NilVal({ why }, ctx)
    nil.attempt = attempt
    // TODO: this should be done lazily, for multiple terms

    // Terms later in same file are considered the primary error location.
    if (null != av) {
      nil.row = av.row
      nil.col = av.col
      nil.url = av.url

      nil.primary = av

      if (null != bv) {
        nil.secondary = bv

        let bv_loc_wins =
          (nil.url === bv.url) && (
            (nil.row < bv.row) ||
            (nil.row === bv.row && nil.col < bv.col)
          )

        if (bv_loc_wins) {
          nil.row = bv.row
          nil.col = bv.col
          nil.url = bv.url
          nil.primary = bv
          nil.secondary = av
        }
      }
    }

    if (ctx) {
      ctx.adderr(nil, 'nil-make:' + why)
    }

    return nil
  }


  constructor(
    spec?: {
      why?: string
      msg?: string
      err?: NilVal | NilVal[] | Error | Error[]
    } | string,
    ctx?: Context
  ) {
    super(spec && 'string' !== typeof spec ? spec : {}, ctx)

    if (spec && 'object' === typeof spec) {
      this.why = spec?.why
      this.msg = 'string' === typeof spec?.msg ? spec.msg : this.msg
      this.err = spec ? (Array.isArray(spec.err) ? [...spec.err] : [spec.err]) : []
    }

    // Nil is always DONE, by definition.
    this.dc = DONE
  }


  unify(_peer: Val, _ctx: Context) {
    return this
  }


  clone(ctx: Context, spec?: ValSpec): Val {
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


  get canon() {
    return 'nil'
  }

  gen(ctx?: Context) {
    // Unresolved nil cannot be generated, so always an error.

    ///descErr(this, ctx)

    if (Array.isArray(ctx?.err)) {
      // ctx.err.push(this)
      ctx.adderr(this)
    }
    else {
      const err: any = new Error(this.msg)
      err.aontu = true
      throw err
    }

    return undefined
  }


  superior(): Val {
    return this
  }

}


export {
  NilVal,
}
