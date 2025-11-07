/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import {
  explainOpen,
  explainClose,
} from '../utility'

import { makeNilErr } from '../err'

// import { BaseVal } from './BaseVal'
import { FeatureVal } from './FeatureVal'


// A ScalarKind for integers. Number includes floats.
class Integer { }

// A ScalarKind for null.
class Null { }


type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


// class ScalarKindVal extends BaseVal {
class ScalarKindVal extends FeatureVal {
  isScalarKind = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new Error('ScalarKindVal spec.peg undefined')
    }

    this.dc = DONE
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'ScalarKind', this, peer)

    const peerIsScalarVal = peer.isScalar
    const peerIsScalarKind = (peer as ScalarKindVal).isScalarKind

    let out: Val = this

    if (peerIsScalarVal) {
      let peerKind = (peer as any).kind

      if (peerKind === this.peg) {
        out = peer
      }
      else if (Number === this.peg && Integer === peerKind) {
        out = peer
      }
      else {
        out = makeNilErr(ctx, 'no-scalar-unify', this, peer)
      }
    }
    else if (peerIsScalarKind) {
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
        out = makeNilErr(ctx, 'scalar-type', this, peer)
      }
    }
    else {
      out = makeNilErr(ctx, 'not-scalar-type', this, peer)
    }

    ctx.explain && explainClose(te, out)

    // console.log('SCALARKINDVAL', this.canon.peer.canon, '->', out.canon)
    return out
  }


  get canon() {
    let ctor = (this.peg as any)
    return ctor.name.toLowerCase()
  }


  same(peer: any): boolean {
    let out = peer?.isScalarKind ? this.peg === peer?.peg : super.same(peer)
    return out
  }


}


export {
  Integer,
  Null,
  ScalarConstructor,
  ScalarKindVal,
}
