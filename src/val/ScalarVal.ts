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
    if (peer.isScalarKind) {
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
    return peer?.isScalar ? peer.peg === this.peg : super.same(peer)
  }


  gen(_ctx?: AontuContext) {
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
