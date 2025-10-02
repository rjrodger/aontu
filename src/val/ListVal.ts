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
  unite,
} from '../unify'


import {
  Site
} from '../lang'




import { TOP } from '../val'
import { ConjunctVal } from './ConjunctVal'
import { Nil } from './Nil'
import { BaseVal } from './BaseVal'
// import { DisjunctVal } from './DisjunctVal'
// import { MapVal } from './MapVal'
// import { PrefVal } from './PrefVal'
// import { RefVal } from './RefVal'





class ListVal extends BaseVal {
  isListVal = true

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
        this.spread.cj =
          Array.isArray(spread.v) ?
            1 < spread.v.length ?
              new ConjunctVal({ peg: spread.v }, ctx) :
              spread.v :
            spread.v

        // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
        // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
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
          // new ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)
          unite(ctx, out.spread.cj, peer.spread.cj)
        )
      )
    }


    out.dc = this.dc + 1

    // if (this.spread.cj) {
    //   out.spread.cj =
    //     DONE !== this.spread.cj.dc ? unite(ctx, this.spread.cj) :
    //       this.spread.cj
    // }

    let spread_cj = out.spread.cj || TOP

    // Always unify children first
    for (let key in this.peg) {
      let keyctx = ctx.descend(key)
      let key_spread_cj = spread_cj.clone(keyctx)

      out.peg[key] = unite(keyctx, this.peg[key], key_spread_cj, 'list-own')
      done = (done && DONE === out.peg[key].dc)
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
          let key_spread_cj = spread_cj.clone(key_ctx)

          // out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
          oval = out.peg[peerkey] =
            // new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
            // done = false
            unite(key_ctx, out.peg[peerkey], key_spread_cj)
        }

        done = (done && DONE === oval.dc)

      }
    }
    else if (TOP !== peer) {
      return Nil.make(ctx, 'map', this, peer)
    }

    out.dc = done ? DONE : out.dc
    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as ListVal)
    out.peg = this.peg.map((entry: Val) => entry.clone(ctx))
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx)
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
        .map(k => [this.peg[k].canon]).join(',') +
      ']'
  }

  gen(ctx?: Context) {
    let out: any = this.peg.map((v: Val) => v.gen(ctx))

    return out
  }
}




export {
  ListVal,
}
