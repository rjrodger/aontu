/* Copyright (c) 2021-2022 Richard Rodger, MIT License */


import type {
  Val,
  ValList,
  ValSpec,
} from '../type'

import {
  DONE,
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




import { TOP } from '../val'
import { ConjunctVal } from '../val/ConjunctVal'
import { DisjunctVal } from '../val/DisjunctVal'
import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
import { PrefVal } from '../val/PrefVal'
import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'





class ListVal extends ValBase {
  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(
    spec: {
      peg: ValList
    },
    ctx?: Context
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new Error('ListVal spec.peg undefined')
    }

    let spread = (this.peg as any)[ListVal.SPREAD]
    delete (this.peg as any)[ListVal.SPREAD]

    if (spread) {
      if ('&' === spread.o) {
        // TODO: handle existing spread!
        let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
        this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
      }
    }
  }


  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let out: ListVal = TOP === peer ? this : new ListVal({ peg: [] }, ctx)

    out.spread.cj = this.spread.cj

    if (peer instanceof ListVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj =
          new ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)
        )
      )
    }


    out.done = this.done + 1

    // if (this.spread.cj) {
    //   out.spread.cj =
    //     DONE !== this.spread.cj.done ? unite(ctx, this.spread.cj) :
    //       this.spread.cj
    // }

    let spread_cj = out.spread.cj || TOP

    // Always unify children first
    for (let key in this.peg) {
      let keyctx = ctx.descend(key)
      let key_spread_cj = spread_cj.clone(null, keyctx)

      out.peg[key] = unite(keyctx, this.peg[key], key_spread_cj, 'list-own')
      done = (done && DONE === out.peg[key].done)
    }


    if (peer instanceof ListVal) {
      let upeer: ListVal = (unite(ctx, peer, undefined, 'list-peer-list') as ListVal)

      // NOTE: peerkey is the index
      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                unite(ctx.descend(peerkey), child, peerchild, 'list-peer')

        if (this.spread.cj) {
          let key_ctx = ctx.descend(peerkey)
          let key_spread_cj = spread_cj.clone(null, key_ctx)

          // out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
          out.peg[peerkey] =
            new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
          done = false

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


  clone(spec?: ValSpec, ctx?: Context): Val {
    let out = (super.clone(spec, ctx) as ListVal)
    out.peg = this.peg.map((entry: Val) => entry.clone(null, ctx))
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(null, ctx)
    }
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
