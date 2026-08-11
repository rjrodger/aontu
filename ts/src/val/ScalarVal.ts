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

import {
  explainOpen,
  explainClose,
} from '../utility'

import { makeNilErr } from '../err'

import { Val } from './Val'
import { ScalarKindVal } from './ScalarKindVal'



class ScalarVal extends Val {
  kind: any

  isScalar = true
  isGenable = true

  src: string

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.kind = spec.kind
    this.src = spec.src ?? ''
    this.dc = DONE
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = super.clone(ctx, {
      peg: this.peg,
      kind: this.kind,
      ...(spec || {})
    })

    return out
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Scalar', this, peer)

    let out: Val

    // Exactly equal scalars are handled in unify.unite
    if (peer.isScalarKind || (peer as any).isConstraint) {
      out = peer.unify(this, ctx)
    }
    else if (peer.isTop) {
      out = this
    }
    else {
      out = makeNilErr(ctx, 'scalar_' +
        ((peer as any).kind === this.kind ? 'value' : 'kind'), this, peer)
    }

    // console.log('SCALAR', this.canon, peer.canon, '->', out.canon)

    explainClose(te, out)

    return out
  }


  get canon() {
    return null === this.peg ? 'null' :
      undefined === this.peg ? 'undefined' :
        (this.peg as any).toString()
  }


  same(peer: any): boolean {
    // Two concrete scalars are the same only when KIND and value both
    // match. Comparing peg alone is a leftover from before integer and
    // number were distinct kinds; without the kind test `1|1.0` would
    // collapse to a single alternative and `(1|1.0) & 1.0` could pick
    // the integer.
    return peer?.isScalar ?
      (peer.kind === this.kind && this.samePeg(peer.peg)) :
      super.same(peer)
  }


  // Value comparison for this leaf's peg (D2: identity is kind AND
  // value, NEVER the identity of the object holding the value). `===` is
  // right for every peg that is a primitive -- including a bigint, where
  // two separately built copies of the same number compare equal -- and
  // wrong for a peg that is an object, so BigDecimalVal overrides it.
  samePeg(peg: any): boolean {
    return peg === this.peg
  }


  gen(_ctx?: AontuContext) {
    // Normalize negative zero to 0 for deterministic output (JSON has
    // no -0, and the Go port produces 0).
    return Object.is(this.peg, -0) ? 0 : this.peg
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
