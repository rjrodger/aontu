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

import { NilVal } from './NilVal'
import { BaseVal } from './BaseVal'
import { ScalarVal } from './ScalarVal'



// A ScalarKind for integers. Number includes floats.
class Integer { }

// A ScalarKind for null.
class Null { }


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


  unify(peer: Val, ctx: Context): Val {
    const peerIsScalarVal = (peer as ScalarVal).isScalarVal
    const peerIsScalarKindVal = (peer as ScalarKindVal).isScalarKindVal

    let out: Val = this

    if (peerIsScalarVal) {
      let peerKind = (peer as ScalarVal).kind

      if (peerKind === this.peg) {
        out = peer
      }
      else if (Number === this.peg && Integer === peerKind) {
        out = peer
      }
      else {
        out = NilVal.make(ctx, 'no-scalar-unify', this, peer)
      }
    }
    else if (peerIsScalarKindVal) {
      if (Number === this.peg && Integer === peer.peg) {
        out = peer
      }
      else if (Number === peer.peg && Integer === this.peg) {
        out = this
      }
      else if (this.peg === peer.peg) {
        out = this
      }
      else {
        out = NilVal.make(ctx, 'scalar-type', this, peer)
      }
    }
    else {
      out = NilVal.make(ctx, 'not-scalar-type', this, peer)
    }

    // console.log('SCALARKINDVAL', this.canon.peer.canon, '->', out.canon)
    return out
  }


  get canon() {
    let ctor = (this.peg as any)
    return ctor.name.toLowerCase()
  }


  same(peer: any): boolean {
    let out = peer?.isScalarKindVal ? this.peg === peer?.peg : super.same(peer)
    return out
  }

}


export {
  Integer,
  Null,
  ScalarConstructor,
  ScalarKindVal,
}
