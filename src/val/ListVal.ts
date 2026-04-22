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
  items,
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
    out.site = this.site

    if (peer instanceof ListVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'PMC') }) : ctx) as ListVal
        exit = true
      }
      else {
        out.closed = out.closed || peer.closed
        out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
          null == peer.spread.cj ? out.spread.cj : (
            out.spread.cj =
            unite(te ? ctx.clone({ explain: ec(te, 'SPR') }) : ctx,
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
        const key_spread_cj = spread_cj.spreadClone(keyctx)
        const child = this.peg[key]

        propagateMarks(this, child)

        out.peg[key] =
          undefined === child ? key_spread_cj :
            child.isNil ? child :
              key_spread_cj.isNil ? key_spread_cj :
                key_spread_cj.isTop && child.done ? child :
                  child.isTop && key_spread_cj.done ? key_spread_cj :
                    unite(te ? keyctx.clone({ explain: ec(te, 'PEG:' + key) }) : keyctx,
                      child, key_spread_cj, 'list-own')

        done = (done && DONE === out.peg[key].dc)
      }

      const allowedKeys: string[] = this.closed ? Object.keys(this.peg) : []
      let bad: NilVal | undefined = undefined

      if (peer instanceof ListVal) {
        let upeer: ListVal = peer.done ? peer as ListVal : (unite(
          te ? ctx.clone({ explain: ec(te, 'PER') }) : ctx,
          peer, TOP, 'list-peer-list') as ListVal)

        // NOTE: peerkey is the index
        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !allowedKeys.includes(peerkey)) {
            bad = makeNilErr(ctx, 'closed', peerchild, undefined)
          }

          let child = out.peg[peerkey]

          const peerctx = ctx.descend(peerkey)

          let oval = out.peg[peerkey] =
            undefined === child ? peerchild :
              child.isTop && peerchild.done ? peerchild :
                child.isNil ? child :
                  peerchild.isNil ? peerchild :
                    unite(te ? peerctx.clone({ explain: ec(te, 'CHD') }) : peerctx,
                      child, peerchild, 'list-peer')

          if (this.spread.cj) {
            let key_spread_cj = spread_cj.spreadClone(peerctx)

            oval = out.peg[peerkey] =
              unite(te ? peerctx.clone({ explain: ec(te, 'PSP:' + peerkey) }) : peerctx,
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
        ;(out.uh ??= []).push(peer.id)

        out.dc = done ? DONE : out.dc
        propagateMarks(peer, out)
        propagateMarks(this, out)
      }
    }

    ctx.explain && explainClose(te, out)

    return out
  }


  // Spread clone: only deep-clone children that are path-dependent
  // (isFunc, isRef). Share all other children directly.
  // Spread clone: when all children are ScalarKindVal (simple type
  // constraints like `string`, `number`), share them directly to avoid
  // N x M allocations. ScalarKindVal is safe to share: it is immutable,
  // always done, never path-dependent, and never has marks mutated.
  // For anything more complex, fall back to full deep clone.
  spreadClone(ctx: AontuContext): Val {
    // B1: share directly when the spread tree has no path-dependent
    // leaves. See MapVal.spreadClone for rationale.
    if (!this.isPathDependent) return this

    let allScalarKind = true
    for (let key in this.peg) {
      if (!(this.peg[key] as any)?.isScalarKind) {
        allScalarKind = false
        break
      }
    }

    if (!allScalarKind) {
      return this.clone(ctx)
    }

    let out = (super.clone(ctx) as ListVal)

    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] = entry[1]
    }

    // Must create a new spread object to avoid mutating the original.
    out.spread = {
      cj: this.spread.cj ? this.spread.cj.spreadClone(ctx) : undefined,
    }

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

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
}




export {
  ListVal,
}
