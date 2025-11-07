/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import { AontuContext } from '../ctx'
import { unite } from '../unify'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


import { top } from './top'

import { FeatureVal } from './FeatureVal'


class PrefVal extends FeatureVal {
  isPref = true

  superpeg: Val
  rank: number = 0

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    // this.pref = spec.pref || spec.peg

    // this.superpeg = makeSuper(spec.peg)

    if (spec.peg instanceof PrefVal) {
      this.rank = 1 + spec.peg.rank
    }

    this.superpeg = this.peg.superior()
    // console.log('PVC', this.peg.canon, this.superpeg.canon)
  }


  // PrefVal unify always returns a PrefVal
  // PrefVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: AontuContext): Val {
    peer = peer ?? top()

    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Pref', this, peer)
    let done = true
    let out: Val = this
    let why = ''


    if (!this.peg.done) {
      const resolved = unite(ctx.clone({ explain: ec(te, 'RES') }), this.peg, top(), 'pref/resolve')
      // console.log('PREF-RESOLVED', this.peg.canon, '->', resolved)
      this.peg = resolved
    }


    if (peer instanceof PrefVal) {
      why += 'pref-'
      if (this.rank < peer.rank) {
        out = this
        why += 'rank-win'
      }
      else if (peer.rank < this.rank) {
        out = peer
        why += 'rank-lose'
      }
      else {
        let peg = unite(ctx.clone({ explain: ec(te, 'PEER') }), this.peg, peer.peg, 'pref-peer/' + this.id)
        out = new PrefVal({ peg }, ctx)
        why += 'rank-same'
      }
    }
    else if (!peer.isTop) {
      why += 'super-'

      // if (this.superpeg instanceof Nil) {
      //   out = peer
      //   why += 'nil'
      // }
      // else {
      //   why += 'unify'

      out = unite(ctx.clone({ explain: ec(te, 'SUPER') }), this.superpeg, peer, 'pref-super/' + this.id)
      if (out.same(this.superpeg)) {
        out = this.peg
        why += 'same'
      }

      // }
    }
    else {
      why += 'none'
    }

    out.dc = done ? DONE : this.dc + 1

    // console.log('PREFVAL-OUT', why, this.canon, peer.canon, '->', out.canon, out.done)

    explainClose(te, out)

    return out
  }


  same(peer: Val): boolean {
    if (null == peer) {
      return false
    }

    let pegsame = (this.peg === peer.peg) ||
      (this.peg.isVal && this.peg.same(peer.peg))

    return pegsame
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as PrefVal)
    // out.pref = this.pref.clone(null, ctx)
    return out
  }


  get canon() {
    // return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
    return '*' + this.peg.canon
  }


  gen(ctx?: AontuContext) {
    let val = this.peg

    if (val.isNil) {
      if (null == ctx) {
        throw new Error(val.msg)
      }
    }

    return val.gen(ctx)
  }
}


export {
  PrefVal,
}
