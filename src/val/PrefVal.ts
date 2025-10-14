/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  descErr
} from '../err'

import {
  Context,
  unite,
} from '../unify'


import {
  Site
} from '../lang'



import {
  TOP,
} from '../val'
import { NilVal } from '../val/NilVal'
import { FeatureVal } from '../val/FeatureVal'


class PrefVal extends FeatureVal {
  isPrefVal = true

  superpeg: Val
  rank: number = 0

  constructor(
    spec: ValSpec,
    ctx?: Context
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
  unify(peer: Val, ctx: Context): Val {
    let done = true
    let out: Val = this
    let why = ''


    if (!this.peg.done) {
      const resolved = unite(ctx, this.peg, TOP, 'pref/resolve')
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
        let peg = unite(ctx, this.peg, peer.peg, 'pref-peer/' + this.id)
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

      out = unite(ctx, this.superpeg, peer, 'pref-super/' + this.id)
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


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as PrefVal)
    // out.pref = this.pref.clone(null, ctx)
    return out
  }


  get canon() {
    // return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
    return '*' + this.peg.canon
  }


  gen(ctx?: Context) {
    let val = this.peg

    if (val instanceof NilVal) {
      if (null == ctx) {
        throw new Error(val.msg)
      }
    }

    return val.gen(ctx)
  }
}



/*
function makeSuper(v: Val) {
  // let out: Val = new Nil()
  // let out: Val = TOP
  let out: Val = new TopVal()

  if (v instanceof NumberVal) {
    out = new ScalarKindVal({ peg: Number })
  }
  else if (v instanceof IntegerVal) {
    out = new ScalarKindVal({ peg: Integer })
  }
  else if (v instanceof StringVal) {
    out = new ScalarKindVal({ peg: String })
  }
  else if (v instanceof BooleanVal) {
    out = new ScalarKindVal({ peg: Boolean })
  }

  // console.log('MAKESUPER', v.canon, out.canon)
  return out
}
*/


export {
  PrefVal,
}
