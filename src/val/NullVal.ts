/* Copyright (c) 2025 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'



import { Nil } from './Nil'
import { ValBase } from './ValBase'


class NullVal extends ValBase {
  isNullVal = true

  constructor(
    spec: {
      peg: null
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    this.peg = null
  }


  unify(peer: Val, ctx: Context): Val {
    let out: Val

    if ((peer as any).isTop || (peer as NullVal).isNullVal) {
      out = this
    }
    else {
      out = Nil.make(ctx, 'null', this, peer)
    }

    return out
  }


  same(peer: Val): boolean {
    return null == peer ? false : peer instanceof NullVal && this.peg === peer.peg
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as NullVal)
    return out
  }


  get canon() {
    return '' + this.peg
  }


  gen(_ctx?: Context) {
    return null
  }
}


export {
  NullVal,
}
