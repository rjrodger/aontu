/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValList,
  ValSpec,
} from '../type'

import {
  DONE,
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

import { NilVal } from './NilVal'
import { BagVal } from './BagVal'
import { empty } from './Val'


class ListVal extends BagVal {
  isList = true
  _canonCache?: string

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
    out.optionalKeys = 0 < this.optionalKeys.length ? [...this.optionalKeys] : this.optionalKeys
    out.site = this.site

    if (peer instanceof ListVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'PMC') }) : ctx) as ListVal
        exit = true
      }
      else {
        out.closed = out.closed || peer.closed
      }
    }


    if (!exit) {
      out.dc = this.dc + 1

      // Fast path: self-unify with TOP.
      if (peer.isTop) {
        let allChildrenDone = true
        for (let key in this.peg) {
          if (DONE !== this.peg[key]?.dc) {
            allChildrenDone = false
            break
          }
        }
        if (allChildrenDone) {
          out.dc = DONE
          ctx.explain && explainClose(te, out)
          return out
        }
      }

      // Unify own children
      for (let key in this.peg) {
        const keyctx = ctx.descend(key)
        const child = this.peg[key]

        propagateMarks(this, child)

        out.peg[key] =
          undefined === child ? top() :
            child.isNil ? child :
              child.done ? child :
                unite(te ? keyctx.clone({ explain: ec(te, 'PEG:' + key) }) : keyctx,
                  child, top(), 'list-own')

        done = (done && DONE === out.peg[key].dc)
      }

      let bad: NilVal | undefined = undefined

      if (peer instanceof ListVal) {
        let upeer: ListVal = peer.done ? peer as ListVal : (unite(
          te ? ctx.clone({ explain: ec(te, 'PER') }) : ctx,
          peer, TOP, 'list-peer-list') as ListVal)

        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !(peerkey in this.peg)) {
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


  // Spread clone: share path-independent children directly, clone
  // only path-dependent ones. See MapVal.spreadClone for rationale.
  spreadClone(ctx: AontuContext): Val {
    if (!this.isPathDependent) return this

    let out = (super.clone(ctx) as ListVal)

    for (let entry of Object.entries(this.peg)) {
      const child = entry[1] as Val
      out.peg[entry[0]] = child?.isPathDependent
        ? child.clone(ctx, { mark: {} })
        : child
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
    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    // console.log('LISTVAL-CLONE', this.canon, '->', out.canon)
    return out
  }


  get canon() {
    if (this._canonCache !== undefined) return this._canonCache
    // console.log('LISTVAL-CANON', this.optionalKeys)
    let keys = Object.keys(this.peg)
    const c = '' +
      // this.errcanon() +
      '[' +
      keys
        .map(k => this.optionalKeys.includes(k) ?
          k + '?:' + this.peg[k].canon :
          this.peg[k].canon).join(',') +
      ']'
    if (this.done) this._canonCache = c
    return c
  }
}




export {
  ListVal,
}
