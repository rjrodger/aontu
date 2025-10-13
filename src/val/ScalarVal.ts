/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  Context,
} from '../unify'

import { Nil } from './Nil'
import { RefVal } from './RefVal'
import { BaseVal } from './BaseVal'



class ScalarVal extends BaseVal {
  kind: any
  isScalarVal = true


  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    this.kind = spec.kind
    this.dc = DONE
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, {
      peg: this.peg,
      kind: this.kind,
      ...(spec || {})
    }) as RefVal)
    return out
  }


  unify(peer: any, ctx?: Context): Val {
    // Exactly equal scalars are handled in unify.unite
    if (peer.isScalarKindVal) {
      return peer.unify(this, ctx)
    }
    else if (peer.top) {
      return this
    }
    return Nil.make(ctx, 'scalar', this, peer)
  }


  get canon() {
    return null === this.peg ? 'null' :
      undefined === this.peg ? 'undefined' :
        (this.peg as any).toString()
  }


  same(peer: any): boolean {
    return peer?.isScalarVal ? peer.peg === this.peg : super.same(peer)
  }


  gen(_ctx?: Context) {
    return this.peg
  }
}


export {
  ScalarVal,
}
