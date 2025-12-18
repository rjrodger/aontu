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

import { unite } from '../unify'

import {
  propagateMarks,
  explainOpen,
  ec,
  explainClose,
} from '../utility'

import { makeNilErr } from '../err'

import { Val } from './Val'
import { FeatureVal } from './FeatureVal'


class ExpectVal extends FeatureVal {
  isExpect = true

  peer?: Val
  parent?: Val
  key?: string

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }

  unify(peer: Val, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Expect', this, peer)

    let out = this

    if (!peer.isTop) {
      this.peer = undefined === this.peer ? peer :
        unite(ctx.clone({ explain: ec(te, 'PEER') }), this.peer, peer, 'expect-peer')

      const peeru =
        unite(ctx.clone({ explain: ec(te, 'EXPECT') }), this.peer, this.peg, 'expect-self')

      if (peeru.isGenable) {
        out = peeru
      }
    }

    out.dc = DONE

    ctx.explain && explainClose(te, out)

    return out
  }


  gen(ctx: AontuContext) {
    // Unresolved expect cannot be generated, so always an error.
    let nil = makeNilErr(
      ctx,
      'expect',
      this.peg,
      this.peer
    )

    return undefined
  }


  inspection(d?: number) {
    return 'key=' + this.key +
      ',peg=' + this.peg?.inspect(d) +
      ',peer=' + this.peer?.inspect(d) +
      ',parent=' + this.parent?.inspect(d)
  }

}


export {
  ExpectVal,
}
