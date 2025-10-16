/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
  SPREAD,
} from '../type'

import {
  Context,
  unite,
} from '../unify'



import { TOP } from './TopVal'
import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { BagVal } from './BagVal'


class MapVal extends BagVal {
  isMap = true

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

    let spread = (this.peg as any)[SPREAD]
    delete (this.peg as any)[SPREAD]

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
    let exit = false

    // NOTE: not a clone! needs to be constructed.
    let out: MapVal | NilVal = (peer.isTop ? this : new MapVal({ peg: {} }, ctx))

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, ctx) as MapVal
        exit = true
      }

      // ensure determinism of unification
      else if (this.closed && peer.closed) {
        const peerkeys = Object.keys(peer.peg)
        const selfkeys = Object.keys(this.peg)

        if (
          peerkeys.length < selfkeys.length
          || (peerkeys.length === selfkeys.length
            && peerkeys.join('~') < selfkeys.join('~')
          )
        ) {
          out = peer.unify(this, ctx) as MapVal
          exit = true
        }

      }

      if (!exit) {
        out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
          null == peer.spread.cj ? out.spread.cj : (
            out.spread.cj =
            unite(ctx, out.spread.cj, peer.spread.cj, 'map-self')
          )
        )
      }
    }

    if (!exit) {
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

      const allowedKeys: string[] = this.closed ? Object.keys(this.peg) : []
      let bad: NilVal | undefined = undefined

      if (peer instanceof MapVal) {
        let upeer: MapVal = (unite(ctx, peer, undefined, 'map-peer-map') as MapVal)

        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !allowedKeys.includes(peerkey)) {
            bad = NilVal.make(ctx, 'closed', peerchild, undefined)
          }

          // key optionality is additive
          if (upeer.optionalKeys.includes(peerkey) && !out.optionalKeys.includes(peerkey)) {
            out.optionalKeys.push(peerkey)
          }

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
        out = NilVal.make(ctx, 'map', this, peer)
      }

      if (null != bad) {
        out = bad
      }

      if (!out.isNil) {
        out.uh.push(peer.id)

        out.dc = done ? DONE : out.dc
        out.type = this.type || peer.type
      }
    }

    // console.log('MAPVAL-OUT', this.id, this.closed, this.canon, 'P=', (peer as any).closed, peer.canon, '->', (out as any).closed, out.canon)

    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as MapVal)
    out.peg = {}
    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        (entry[1] as any)?.isVal ? (entry[1] as Val).clone(ctx, { type: spec?.type }) : entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx, { type: spec?.type })
    }

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    // console.log('MAPVAL-CLONE', this.canon, '->', out.canon)
    return out
  }


  get canon() {
    let keys = Object.keys(this.peg)
    return '' +
      // this.errcanon() +
      // (this.type ? '<type>' : '') +
      // (this.id + '=') +
      '{' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => [JSON.stringify(k) +
          (this.optionalKeys.includes(k) ? '?' : '') +
          ':' + this.peg[k].canon]).join(',') +
      '}'
  }


  gen(ctx?: Context) {
    let out: any = {}
    if (this.type) {
      return undefined
    }

    for (let p in this.peg) {
      if (this.peg[p].type) {
        continue
      }

      let val = this.peg[p].gen(ctx)
      if (undefined === val) {
        if (!this.optionalKeys.includes(p)) {
          return NilVal.make(ctx, 'required', this.peg[p], undefined)
        }
      }
      else {
        out[p] = val
      }
    }

    return out
  }
}


export {
  MapVal
}
