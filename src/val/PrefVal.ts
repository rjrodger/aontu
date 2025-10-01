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
} from '../unify'


import {
  Site
} from '../lang'


import {
  unite
} from '../op/op'



import {
  ScalarTypeVal,
  IntegerVal,
  NumberVal,
  StringVal,
  BooleanVal,
  Integer,
} from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
// import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'


class PrefVal extends ValBase {
  isPrefVal = true

  // pref: Val
  superpeg: Val
  rank: number = 0

  constructor(
    spec: {
      peg: any,
      // pref?: any
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    // this.pref = spec.pref || spec.peg

    this.superpeg = makeSuper(spec.peg)

    if (spec.peg instanceof PrefVal) {
      this.rank = 1 + spec.peg.rank
    }

    // console.log('SP', this.superpeg)
  }

  // PrefVal unify always returns a PrefVal
  // PrefVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: Context): Val {
    let done = true
    let out: Val = this

    // if (peer instanceof PrefVal) {
    //   out = new PrefVal(
    //     {
    //       peg: unite(ctx, this.peg, peer.peg, 'Pref000'),
    //       pref: unite(ctx, this.pref, peer.pref, 'Pref010'),
    //     },
    //     ctx
    //   )
    // }

    // else {
    //   out = new PrefVal(
    //     {
    //       // TODO: find a better way to drop Nil non-errors
    //       peg: unite(ctx?.clone({ err: [] }), this.peg, peer, 'Pref020'),
    //       pref: unite(ctx?.clone({ err: [] }), this.pref, peer, 'Pref030'),
    //     },
    //     ctx
    //   )
    // }

    // done = done && DONE === out.peg.dc &&
    //   (null != (out as PrefVal).pref ? DONE === (out as PrefVal).pref.dc : true)

    // if (out.peg instanceof Nil) {
    //   out = (out as PrefVal).pref
    // }
    // else if ((out as PrefVal).pref instanceof Nil) {
    //   out = out.peg
    // }

    if (peer instanceof PrefVal) {
      if (this.rank < peer.rank) {
        return this
      }
      else if (peer.rank < this.rank) {
        return peer
      }
      else {
        let peg = unite(ctx, this.peg, peer.peg, 'pref-peer/' + this.id)
        out = new PrefVal({ peg }, ctx)
        // out = Nil.make(ctx, 'pref', this, peer)
      }
    }
    else if (!peer.top) {
      // out = Nil.make(ctx, 'pref', this, peer)

      if (this.superpeg instanceof Nil) {
        out = peer
      }
      else {
        out = unite(ctx, this.superpeg, peer, 'pref-super/' + this.id)
        // console.log('QQQ', out.canon)
        // if (out instanceof Nil) {
        //   out = Nil.make(ctx, '*super', this, peer)
        // }
        // if (!(out instanceof Nil)) {
        if (out.same(this.superpeg)) {
          return this.peg
        }
      }
    }

    out.dc = done ? DONE : this.dc + 1

    return out
  }


  same(peer: Val): boolean {
    if (null == peer) {
      return false
    }

    let pegsame = (this.peg === peer.peg) ||
      (this.peg instanceof ValBase && this.peg.same(peer.peg))

    // let prefsame = peer instanceof PrefVal &&
    //   ((this.pref === peer.pref) ||
    //     (this.pref instanceof ValBase && this.pref.same(peer.pref)))

    // return pegsame && prefsame

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
    // let val = !(this.pref instanceof Nil) ? this.pref :
    //   (!(this.peg instanceof Nil) ? this.peg :
    //     this.pref)

    let val = this.peg

    if (val instanceof Nil) {
      // descErr(val, ctx)

      if (ctx) {
        // ctx.err.push(val)
        ctx.adderr(val)
      }
      else {
        throw new Error(val.msg)
      }
    }

    return val.gen(ctx)
  }
}


function makeSuper(v: Val) {
  // return v.superior() - apply * deeply into maps etc
  if (v instanceof NumberVal) {
    return new ScalarTypeVal({ peg: Number })
  }
  else if (v instanceof IntegerVal) {
    return new ScalarTypeVal({ peg: Integer })
  }
  else if (v instanceof StringVal) {
    return new ScalarTypeVal({ peg: String })
  }
  else if (v instanceof BooleanVal) {
    return new ScalarTypeVal({ peg: Boolean })
  }
  else {
    return new Nil()
  }
}


export {
  PrefVal,
}
