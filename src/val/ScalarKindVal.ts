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
import { BaseVal } from './BaseVal'



// A ScalarType for integers. Number includes floats.
class Integer { }


type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarKindVal extends BaseVal {
  isScalarKindVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new Error('ScalarKindVal spec.peg undefined')
    }

    this.dc = DONE
  }

  unify(peer: any, ctx?: Context): Val {
    if (peer?.isScalarVal) {
      if (peer.type === this.peg) {
        return peer
      }
      else if (Number === this.peg && Integer === peer.type) {
        return peer
      }
      return Nil.make(ctx, 'no-scalar-unify', this, peer)
    }
    else {
      if (peer?.isScalarTypeVal) {
        if (Number === this.peg && Integer === peer.peg) {
          return peer
        }
        else if (Number === peer.peg && Integer === this.peg) {
          return this
        }
      }
      return Nil.make(ctx, 'scalar-type', this, peer)
    }
  }

  get canon() {
    let ctor = (this.peg as any)
    return ctor.name.toLowerCase()
  }

  same(peer: any): boolean {
    let out = peer?.isScalarTypeVal ? this.peg === peer?.peg : super.same(peer)
    return out
  }

  // gen(_ctx?: Context) {
  //   return undefined
  // }

}


export {
  Integer,
  ScalarConstructor,
  ScalarKindVal,
}
