/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValList,
  ValSpec,
} from '../type'

import {
  DONE,
  SPREAD,
} from '../type'

import { AontuContext } from '../ctx'
import { unite } from '../unify'

import {
  propagateMarks,
  explainOpen,
  ec,
  explainClose,
} from '../utility'

import { makeNilErr, AontuError } from '../err'


import {
  top
} from './top'

import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { BagVal } from './BagVal'
import { empty } from './Val'


class ListVal extends BagVal {
  isList = true

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(
    spec: {
      peg: ValList
    },
    ctx?: AontuContext
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new AontuError('ListVal spec.peg undefined')
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
  unify(peer: Val, ctx: AontuContext): Val {
    const TOP = top()
    peer = peer ?? TOP

    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'List', this, peer)
    let done: boolean = true
    let exit = false

    // NOTE: not a clone! needs to be constructed.
    let out: ListVal | NilVal = (peer.isTop ? this : new ListVal({ peg: [] }, ctx))

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    out.spread.cj = this.spread.cj

    if (peer instanceof ListVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, ctx.clone({ explain: ec(te, 'PMC') })) as ListVal
        exit = true
      }
      else {
        out.closed = out.closed || peer.closed
        out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
          null == peer.spread.cj ? out.spread.cj : (
            out.spread.cj =
            unite(ctx.clone({ explain: ec(te, 'SPR') }),
              out.spread.cj, peer.spread.cj, 'list-peer')
          )
        )
      }
    }


    if (!exit) {
      out.dc = this.dc + 1

      let spread_cj = out.spread.cj || TOP

      // Always unify children first
      for (let key in this.peg) {
        const keyctx = ctx.descend(key)
        const key_spread_cj = spread_cj.clone(keyctx)
        const child = this.peg[key]

        propagateMarks(this, child)

        out.peg[key] =
          undefined === child ? key_spread_cj :
            child.isNil ? child :
              key_spread_cj.isNil ? key_spread_cj :
                key_spread_cj.isTop && child.done ? child :
                  child.isTop && key_spread_cj.done ? key_spread_cj :
                    unite(keyctx.clone({ explain: ec(te, 'PEG:' + key) }),
                      child, key_spread_cj, 'list-own')

        done = (done && DONE === out.peg[key].dc)
      }

      const allowedKeys: string[] = this.closed ? Object.keys(this.peg) : []
      let bad: NilVal | undefined = undefined

      if (peer instanceof ListVal) {
        let upeer: ListVal = (unite(ctx.clone({ explain: ec(te, 'PER') }),
          peer, TOP, 'list-peer-list') as ListVal)

        // NOTE: peerkey is the index
        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !allowedKeys.includes(peerkey)) {
            bad = makeNilErr(ctx, 'closed', peerchild, undefined)
          }

          let child = out.peg[peerkey]

          let oval = out.peg[peerkey] =
            undefined === child ? peerchild :
              child.isTop && peerchild.done ? peerchild :
                child.isNil ? child :
                  peerchild.isNil ? peerchild :
                    unite(ctx.descend(peerkey).clone({ explain: ec(te, 'CHD') }),
                      child, peerchild, 'list-peer')

          if (this.spread.cj) {
            let key_ctx = ctx.descend(peerkey)
            let key_spread_cj = spread_cj.clone(key_ctx)

            oval = out.peg[peerkey] =
              unite(key_ctx.clone({ explain: ec(te, 'PSP:' + peerkey) }),
                out.peg[peerkey], key_spread_cj, 'list-spread')
          }

          propagateMarks(this, oval)

          done = (done && DONE === oval.dc)
        }
      }
      else if (!peer.isTop) {
        out = makeNilErr(ctx, 'list', this, peer)
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

    ctx.explain && explainClose(te, out)

    return out
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
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


  gen(ctx: AontuContext) {
    let out: any = []
    if (this.mark.type || this.mark.hide) {
      return undefined
    }

    for (let i = 0; i < this.peg.length; i++) {
      const child = this.peg[i]

      const optional = this.optionalKeys.includes('' + i)

      // Optional unresolved disjuncts are not an error, just dropped.
      if (child.isDisjunct && optional) {
        const dctx = ctx.clone({ err: [] })

        let cval = child.gen(dctx)

        if (undefined === cval) {
          continue
        }

        out.push(cval)
      }

      else if (child.isScalar
        || child.isMap
        || child.isList
        || child.isPref
        || child.isRef
        || child.isDisjunct
        || child.isNil
      ) {
        const cval = child.gen(ctx)

        if (optional && empty(cval)) {
          continue
        }

        out.push(cval)
      }
      else if (child.isNil) {
        ctx.adderr(child)
      }
      else if (!this.optionalKeys.includes('' + i)) {
        makeNilErr(
          ctx,
          this.closed ? 'listval_required' : 'listval_no_gen',
          child, undefined
        )
        break
      }

      // else optional so we can ignore it
    }

    return out
  }
}




export {
  ListVal,
}
