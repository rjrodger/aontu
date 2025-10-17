/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

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


import { NilVal } from './NilVal'
import { RefVal } from './RefVal'
import { BaseVal } from './BaseVal'
import { ScalarKindVal } from './ScalarKindVal'



class ScalarVal extends BaseVal {
  kind: any
  isScalar = true


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


  unify(peer: Val, ctx: Context): Val {
    // Exactly equal scalars are handled in unify.unite
    if (peer.isScalarKind) {
      return peer.unify(this, ctx)
    }
    else if (peer.isTop) {
      return this
    }

    return NilVal.make(ctx, 'scalar', this, peer)
  }


  get canon() {
    return null === this.peg ? 'null' :
      undefined === this.peg ? 'undefined' :
        (this.peg as any).toString()
  }


  same(peer: any): boolean {
    return peer?.isScalar ? peer.peg === this.peg : super.same(peer)
  }


  gen(_ctx?: Context) {
    return this.peg
  }


  superior() {
    return this.place(new ScalarKindVal({
      peg: this.kind
    }))
  }

}


export {
  ScalarVal,
}
