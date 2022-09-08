/* Copyright (c) 2021-2022 Richard Rodger, MIT License */


import type {
  Val,
  ValMap,
  ValList,
} from '../type'

import {
  DONE,
  TOP,
} from '../type'

import {
  Context,
} from '../unify'


import {
  Site
} from '../lang'


import {
  unite
} from '../op/op'

import { Nil } from '../val/Nil'

import {
  ValBase,
} from '../val/ValBase'

import { ConjunctVal } from '../val/ConjunctVal'





class ListVal extends ValBase {
  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(peg: ValList, ctx?: Context) {
    super(peg, ctx)

    let spread = (this.peg as any)[ListVal.SPREAD]
    delete (this.peg as any)[ListVal.SPREAD]

    if (spread) {
      if ('&' === spread.o) {
        // TODO: handle existing spread!
        this.spread.cj =
          new ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx)
      }
    }
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let out: ListVal = TOP === peer ? this : new ListVal([], ctx)

    out.spread.cj = this.spread.cj

    if (peer instanceof ListVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj = new ConjunctVal([out.spread.cj, peer.spread.cj], ctx)
        )
      )
    }


    out.done = this.done + 1

    if (this.spread.cj) {
      out.spread.cj =
        DONE !== this.spread.cj.done ? unite(ctx, this.spread.cj) :
          this.spread.cj
    }

    let spread_cj = out.spread.cj || TOP

    // Always unify children first
    for (let key in this.peg) {
      out.peg[key] =
        unite(ctx.descend(key), this.peg[key], spread_cj)

      done = (done && DONE === out.peg[key].done)
    }

    if (peer instanceof ListVal) {
      let upeer: ListVal = (unite(ctx, peer) as ListVal)

      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                unite(ctx.descend(peerkey), child, peerchild)

        if (this.spread.cj) {
          out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
        }

        done = (done && DONE === oval.done)

      }
    }
    else if (TOP !== peer) {
      return Nil.make(ctx, 'map', this, peer)
    }

    out.done = done ? DONE : out.done
    return out
  }

  get canon() {
    let keys = Object.keys(this.peg)
    return '[' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        // NOTE: handle array non-index key vals
        // .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
        .map(k => [this.peg[k].canon]).join(',') +
      ']'
  }

  gen(ctx?: Context) {
    let out: any = this.peg.map((v: Val) => v.gen(ctx))
    // for (let p in this.peg) {
    //   out[p] = this.peg[p].gen(ctx)
    // }

    return out
  }
}




export {
  ListVal,
}
