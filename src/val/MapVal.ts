/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



import type {
  Val,
  ValMap,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  Context,
} from '../unify'



import {
  unite
} from '../op/op'



import { TOP } from '../val'
import { ConjunctVal } from './ConjunctVal'
import { Nil } from './Nil'
import { ValBase } from './ValBase'
// import { DisjunctVal } from './DisjunctVal'
// import { ListVal } from './ListVal'
// import { PrefVal } from './PrefVal'
// import { RefVal } from './RefVal'


class MapVal extends ValBase {
  isMapVal = true

  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(
    spec: {
      peg: ValMap
    },
    ctx?: Context
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new Error('MapVal spec.peg undefined')
    }

    let spread = (this.peg as any)[MapVal.SPREAD]
    delete (this.peg as any)[MapVal.SPREAD]

    if (spread) {
      if ('&' === spread.o) {
        // TODO: handle existing spread!
        this.spread.cj =
          Array.isArray(spread.v) ?
            1 < spread.v.length ?
              new ConjunctVal({ peg: spread.v }, ctx) :
              spread.v[0] :
            spread.v
      }
    }
  }


  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    // let mark = Math.random()

    let done: boolean = true
    let out: MapVal = TOP === peer ? this : new MapVal({ peg: {} }, ctx)

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj =
          // new ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)
          unite(ctx, out.spread.cj, peer.spread.cj)
        )
      )
    }


    out.dc = this.dc + 1

    let spread_cj = out.spread.cj || TOP

    // Always unify own children first
    for (let key in this.peg) {
      let keyctx = ctx.descend(key)
      let key_spread_cj = spread_cj.clone(keyctx)

      out.peg[key] = unite(keyctx, this.peg[key], key_spread_cj, 'map-own')
      done = (done && DONE === out.peg[key].dc)
    }


    if (peer instanceof MapVal) {
      let upeer: MapVal = (unite(ctx, peer, undefined, 'map-peer-map') as MapVal)

      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                unite(ctx.descend(peerkey), child, peerchild, 'map-peer')

        if (this.spread.cj) {
          let key_ctx = ctx.descend(peerkey)
          let key_spread_cj = spread_cj.clone(key_ctx)
          oval = out.peg[peerkey] =
            unite(key_ctx, out.peg[peerkey], key_spread_cj)
        }

        done = (done && DONE === oval.dc)
      }
    }
    else if (TOP !== peer) {
      return Nil.make(ctx, 'map', this, peer)
    }

    out.uh.push(peer.id)

    out.dc = done ? DONE : out.dc
    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as MapVal)
    out.peg = {}
    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        entry[1] instanceof ValBase ? entry[1].clone(ctx) : entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx)
    }
    return out
  }


  get canon() {
    let keys = Object.keys(this.peg)
    return this.errcanon() + '{' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
      '}'
  }


  gen(ctx?: Context) {
    let out: any = {}
    for (let p in this.peg) {
      out[p] = this.peg[p].gen(ctx)
    }
    return out
  }
}


export {
  MapVal
}
