/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type {
  Val,
} from '../type'

import {
  DONE,
} from '../type'

import {
  Context,
} from '../unify'


import { ValBase } from '../val/ValBase'




class Nil extends ValBase {
  nil = true
  why: any
  primary?: Val
  secondary?: Val
  msg: string = ''

  // TODO: include Val generating nil, thus capture type

  // A Nil is an error - should not happen - unify failed
  static make = (ctx?: Context, why?: any, av?: Val, bv?: Val) => {
    let nil = new Nil(why, ctx)

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
      ctx.err.push(nil)
    }

    return nil
  }


  constructor(why?: any, ctx?: Context) {
    super(null, ctx)
    this.why = why

    // Nil is always DONE, by definition.
    this.done = DONE
  }


  unify(_peer: Val, _ctx: Context) {
    return this
  }


  clone(ctx?: Context): Val {
    let out = (super.clone(ctx) as Nil)
    out.why = this.why
    out.primary = this.primary?.clone()
    out.secondary = this.secondary?.clone()
    out.msg = this.msg
    return out
  }


  get canon() {
    return 'nil'
  }

  gen(_ctx?: Context) {
    throw new Error('Nil-gen: ' + this.why)
    return undefined
  }
}

export {
  Nil,
}
