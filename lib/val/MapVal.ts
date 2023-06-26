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
import { ConjunctVal } from '../val/ConjunctVal'
import { DisjunctVal } from '../val/DisjunctVal'
import { ListVal } from '../val/ListVal'
import { Nil } from '../val/Nil'
import { PrefVal } from '../val/PrefVal'
import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'


class MapVal extends ValBase {
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

    // console.log('MC', this.id, peg, spread)

    if (spread) {
      if ('&' === spread.o) {
        // TODO: handle existing spread!
        this.spread.cj =
          Array.isArray(spread.v) ?
            1 < spread.v.length ?
              new ConjunctVal({ peg: spread.v }, ctx) :
              spread.v[0] :
            spread.v
        // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
        // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
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


    out.done = this.done + 1

    let spread_cj = out.spread.cj || TOP

    // Always unify own children first
    for (let key in this.peg) {
      let keyctx = ctx.descend(key)
      let key_spread_cj = spread_cj.clone(null, keyctx)

      // console.log('M0', this.id, mark, Object.keys(this.peg).join('~'),
      //   'p=', this.path.join('.'),
      //   'k=', key, peer.top || peer.constructor.name,
      //   'pp=', this.peg[key].path.join('.'),
      //   this.peg[key].canon,
      //   'sp=', key_spread_cj.path.join('.'),
      //   key_spread_cj.canon)

      // if (1000000000 === this.id) {
      //   console.dir(key_spread_cj, { depth: null })
      // }

      out.peg[key] = unite(keyctx, this.peg[key], key_spread_cj, 'map-own')
      done = (done && DONE === out.peg[key].done)
    }


    if (peer instanceof MapVal) {
      let upeer: MapVal = (unite(ctx, peer, undefined, 'map-peer-map') as MapVal)

      for (let peerkey in upeer.peg) {
        // console.log('M1', this.id, mark, Object.keys(this.peg).join('~'),
        //   'pk=', peerkey)

        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                unite(ctx.descend(peerkey), child, peerchild, 'map-peer')

        if (this.spread.cj) {
          let key_ctx = ctx.descend(peerkey)
          let key_spread_cj = spread_cj.clone(null, key_ctx)

          oval = out.peg[peerkey] =
            // new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
            // done = false
            unite(key_ctx, out.peg[peerkey], key_spread_cj)
        }
        // else {
        done = (done && DONE === oval.done)
        // }
      }
    }
    else if (TOP !== peer) {
      return Nil.make(ctx, 'map', this, peer)
    }

    out.done = done ? DONE : out.done
    return out
  }


  clone(spec?: ValSpec, ctx?: Context): Val {
    let out = (super.clone(spec, ctx) as MapVal)
    out.peg = {}
    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        entry[1] instanceof ValBase ? entry[1].clone(null, ctx) : entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(null, ctx)
    }
    return out
  }


  get canon() {
    let keys = Object.keys(this.peg)
    return '{' +
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
