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
  unite,
} from '../unify'



import { TOP } from '../val'
import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { BaseVal } from './BaseVal'


class MapVal extends BaseVal {
  isMapVal = true

  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new Error('MapVal spec.peg undefined')
    }

    this.type = !!spec.type

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

    // console.log('MAPVAL-ctor', this.type, spec)
  }


  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    // let mark = Math.random()

    let done: boolean = true
    // let out: MapVal = TOP === peer ? this : new MapVal({ peg: {} }, ctx)
    let out: MapVal = peer.isTop ? this : new MapVal({ peg: {} }, ctx)
    // console.log('MAPVAL-START', this.id, this.canon, peer.canon, '->', out.canon)

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj =
          unite(ctx, out.spread.cj, peer.spread.cj, 'map-self')
        )
      )
    }

    out.dc = this.dc + 1

    // let newtype = this.type || peer.type

    let spread_cj = out.spread.cj ?? TOP

    // Always unify own children first
    for (let key in this.peg) {
      let keyctx = ctx.descend(key)
      let key_spread_cj = spread_cj.clone(keyctx)

      // this.peg[key].type = newtype = this.peg[key].type || newtype

      this.peg[key].type = this.peg[key].type || this.type

      out.peg[key] = unite(keyctx, this.peg[key], key_spread_cj, 'map-own')

      // out.peg[key].type = newtype = out.peg[key].type || newtype

      done = (done && DONE === out.peg[key].dc)
      // console.log('MAPVAL-OWN', this.id, this.type, 'k=' + key, this.peg[key].canon, key_spread_cj.canon, '->', out.peg[key].canon)
    }


    if (peer instanceof MapVal) {
      let upeer: MapVal = (unite(ctx, peer, undefined, 'map-peer-map') as MapVal)

      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof NilVal ? child :
              peerchild instanceof NilVal ? peerchild :
                unite(ctx.descend(peerkey), child, peerchild, 'map-peer')

        if (this.spread.cj) {
          let key_ctx = ctx.descend(peerkey)
          let key_spread_cj = spread_cj.clone(key_ctx)
          oval = out.peg[peerkey] =
            // unite(key_ctx, out.peg[peerkey], key_spread_cj, 'map-peer-spread')
            unite(key_ctx, oval, key_spread_cj, 'map-peer-spread')
        }

        oval.type = this.type || oval.type

        // console.log('MAPVAL-PEER', peerkey, child?.canon, peerchild?.canon, '->', oval)
        done = (done && DONE === oval.dc)
      }
    }
    // else if (TOP !== peer) {
    else if (!peer.isTop) {
      return NilVal.make(ctx, 'map', this, peer)
    }

    out.uh.push(peer.id)

    out.dc = done ? DONE : out.dc
    out.type = this.type || peer.type

    // console.log('MAPVAL-OUT', this.id, this.canon, peer.canon, '->', out.canon)

    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as MapVal)
    out.peg = {}
    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        entry[1] instanceof BaseVal ? entry[1].clone(ctx, { type: spec?.type }) : entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx, { type: spec?.type })
    }

    // console.log('MAPVAL-CLONE', this.canon, '->', out.canon)
    return out
  }


  get canon() {
    let keys = Object.keys(this.peg)
    return this.errcanon() +
      // (this.type ? '<type>' : '') +
      // (this.id + '=') +
      '{' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
      '}'
  }


  gen(ctx?: Context) {
    let out: any = {}
    if (this.type) {
      // out.$TYPE = true
      return undefined
    }

    for (let p in this.peg) {
      out[p] = this.peg[p].gen(ctx)
    }

    return out
  }
}


export {
  MapVal
}
