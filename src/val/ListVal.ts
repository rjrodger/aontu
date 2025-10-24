/* Copyright (c) 2021-2022 Richard Rodger, MIT License */


import type {
  Val,
  ValList,
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

import {
  propagateMarks,
} from '../utility'

import {
  Site
} from '../lang'




import { TOP } from './TopVal'
import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { BagVal } from './BagVal'


class ListVal extends BagVal {
  isList = true

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

        // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
        // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
      }
    }
  }


  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let exit = false

    // NOTE: not a clone! needs to be constructed.
    let out: ListVal | NilVal = (peer.isTop ? this : new ListVal({ peg: [] }, ctx))

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    out.spread.cj = this.spread.cj

    if (peer instanceof ListVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, ctx) as ListVal
        exit = true
      }
      else {
        out.closed = out.closed || peer.closed
        out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
          null == peer.spread.cj ? out.spread.cj : (
            out.spread.cj =
            unite(ctx, out.spread.cj, peer.spread.cj, 'list-peer')
          )
        )
      }
    }


    if (!exit) {
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

      const allowedKeys: string[] = this.closed ? Object.keys(this.peg) : []
      let bad: NilVal | undefined = undefined

      if (peer instanceof ListVal) {
        let upeer: ListVal = (unite(ctx, peer, undefined, 'list-peer-list') as ListVal)

        // NOTE: peerkey is the index
        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !allowedKeys.includes(peerkey)) {
            bad = NilVal.make(ctx, 'closed', peerchild, undefined)
          }

          let child = out.peg[peerkey]

          let oval = out.peg[peerkey] =
            undefined === child ? peerchild :
              child.isNil ? child :
                peerchild.isNil ? peerchild :
                  unite(ctx.descend(peerkey), child, peerchild, 'list-peer')

          if (this.spread.cj) {
            let key_ctx = ctx.descend(peerkey)
            let key_spread_cj = spread_cj.clone(key_ctx)

            // out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
            oval = out.peg[peerkey] =
              // new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
              // done = false
              unite(key_ctx, out.peg[peerkey], key_spread_cj, 'list-spread')
          }

          done = (done && DONE === oval.dc)

        }
      }
      // else if (TOP !== peer) {
      else if (!peer.isTop) {
        out = NilVal.make(ctx, 'list', this, peer)
      }

      if (null != bad) {
        out = bad
      }

      if (!out.isNil) {
        out.uh.push(peer.id)

        out.dc = done ? DONE : out.dc
        propagateMarks(peer, out)
        propagateMarks(this, out)
      }
    }

    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as ListVal)
    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        (entry[1] as any)?.isVal ? (entry[1] as Val).clone(ctx, spec?.mark ? { mark: spec.mark } : {}) : entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {})
    }

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    // console.log('LISTVAL-CLONE', this.canon, '->', out.canon)
    return out
  }


  get canon() {
    // console.log('LISTVAL-CANON', this.optionalKeys)
    let keys = Object.keys(this.peg)
    return '' +
      // this.errcanon() +
      '[' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => this.optionalKeys.includes(k) ?
          k + '?:' + this.peg[k].canon :
          this.peg[k].canon).join(',') +
      ']'
  }

  gen(ctx?: Context) {
    let out: any = []
    if (this.mark.type || this.mark.hide) {
      return undefined
    }

    // console.log('LISTVAL-GEN', this.optionalKeys)

    for (let i = 0; i < this.peg.length; i++) {
      let val = this.peg[i].gen(ctx)
      if (undefined === val) {
        if (!this.optionalKeys.includes('' + i)) {
          return NilVal.make(ctx, 'required', this.peg[i], undefined)
        }
      }
      else {
        out.push(val)
      }

    }

    return out
  }
}




export {
  ListVal,
}
