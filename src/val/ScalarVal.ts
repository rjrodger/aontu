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
import { ValBase } from './ValBase'
import { ScalarConstructor } from './ScalarTypeVal'


class ScalarVal<T> extends ValBase {
  type: any
  isScalarVal = true

  constructor(
    spec: {
      peg: T,
      type: ScalarConstructor
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    this.type = spec.type
    this.dc = DONE
  }

  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, {
      peg: this.peg,
      type: this.type,
      ...(spec || {})
    }) as RefVal)
    return out
  }

  unify(peer: any, ctx?: Context): Val {
    // Exactly equal scalars are handled in op/unite
    if (peer?.isScalarTypeVal) {
      return peer.unify(this, ctx)
    }
    else if (peer.top) {
      return this
    }
    return Nil.make(ctx, 'scalar', this, peer)
  }

  get canon() {
    return (this.peg as any).toString()
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
