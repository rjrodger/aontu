/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
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
} from '../utility'

import { makeNilErr, AontuError } from '../err'

import {
  top
} from './top'


import { NilVal } from './NilVal'
import { BagVal } from './BagVal'


class MapVal extends BagVal {
  isMap = true
  _canonCache?: string

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new AontuError('MapVal spec.peg undefined')
    }

    this.mark.type = !!spec.mark?.type
    this.mark.hide = !!spec.mark?.hide
  }


  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: AontuContext): Val {
    // console.log('MAPVAL-UNIFY', this.id, this.canon, peer.id, peer.canon)

    const TOP = top()
    peer = peer ?? TOP

    // Fast path: both maps done, no spreads, peer's keys are a
    // subset of this's keys with the same child references, and
    // neither side has type/hide marks. No new information.
    if (this.done && peer instanceof MapVal && peer.done
        && !this.mark.type && !this.mark.hide
        && !peer.mark.type && !peer.mark.hide) {
      let canSkip = true
      for (const k in peer.peg) {
        if (this.peg[k] !== peer.peg[k]) {
          canSkip = false
          break
        }
      }
      if (canSkip) return this
    }

    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Map', this, peer)

    let done: boolean = true
    let exit = false

    // NOTE: not a clone! needs to be constructed.
    let out: MapVal | NilVal = (peer.isTop ? this : new MapVal({ peg: {} }, ctx))

    out.closed = this.closed
    out.optionalKeys = 0 < this.optionalKeys.length ? [...this.optionalKeys] : this.optionalKeys
    out.site = this.site

    if (peer instanceof MapVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'PMC') }) : ctx) as MapVal
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
          out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'SPC') }) : ctx) as MapVal
          exit = true
        }
      }
    }


    if (!exit) {
      out.dc = this.dc + 1

      // Fast path: self-unify with TOP.
      // If all children are already done, the map is fully converged.
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
        const child = this.peg[key]
        const keyctx = ctx.descend(key)

        propagateMarks(this, child)

        out.peg[key] =
          undefined === child ? top() :
            child.isNil ? child :
              child.done ? child :
                unite(te ? keyctx.clone({ explain: ec(te, 'KEY:' + key) }) : keyctx,
                  child, top(), 'map-own')

        done = (done && DONE === out.peg[key].dc)
      }

      let bad: NilVal | undefined = undefined

      if (peer instanceof MapVal) {
        let upeer: MapVal = peer.done ? peer as MapVal : (unite(
          te ? ctx.clone({ explain: ec(te, 'PER') }) : ctx,
          peer, TOP, 'map-peer-map') as MapVal)

        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !(peerkey in this.peg)) {
            bad = makeNilErr(ctx, 'closed', peerchild, undefined)
          }

          // key optionality is additive
          if (0 < upeer.optionalKeys.length
              && upeer.optionalKeys.includes(peerkey)
              && !out.optionalKeys.includes(peerkey)) {
            out.optionalKeys.push(peerkey)
          }

          let child = out.peg[peerkey]

          const peerctx = ctx.descend(peerkey)

          let oval = out.peg[peerkey] =
            undefined === child ? this.handleExpectedVal(peerkey, peerchild, this, ctx) :
                child.isTop && peerchild.done ? peerchild :
                  child.isNil ? child :
                    peerchild.isNil ? peerchild :
                      unite(te ? peerctx.clone({ explain: ec(te, 'CHD') }) : peerctx,
                        child, peerchild, 'map-peer')

          propagateMarks(this, oval)

          done = (done && DONE === oval.dc)
        }
      }
      else if (!peer.isTop) {
        out = makeNilErr(ctx, 'map', this, peer)
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


  // Optimized clone for use as a spread constraint: share
  // path-independent children, clone only path-dependent ones.
  spreadClone(ctx: AontuContext): Val {
    if (!this.isPathDependent) return this

    let out = (super.clone(ctx) as MapVal)
    out.peg = {}

    for (let entry of Object.entries(this.peg)) {
      const child = entry[1] as Val
      if (child?.isVal && child.isPathDependent) {
        out.peg[entry[0]] = child.clone(ctx, { path: [...out.path, entry[0]] })
      }
      else if (child?.isVal) {
        const wrapper = Object.create(child)
        wrapper.mark = { ...child.mark }
        out.peg[entry[0]] = wrapper
      }
      else {
        out.peg[entry[0]] = child
      }
    }

    out.closed = this.closed
    out.optionalKeys = 0 < this.optionalKeys.length ? [...this.optionalKeys] : this.optionalKeys

    return out
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as MapVal)
    out.peg = {}

    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        (entry[1] as any)?.isVal ?
          (entry[1] as Val).clone(ctx, {
            mark: spec?.mark ?? {},
            path: [...out.path, entry[0]]
          }) :
          entry[1]
    }

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    return out
  }


  get canon() {
    if (this._canonCache !== undefined) return this._canonCache
    let keys = Object.keys(this.peg).sort()
    const c = '' +
      '{' +
      keys
        .map(k => [
          JSON.stringify(k) +
          (this.optionalKeys.includes(k) ? '?' : '') +
          ':' +
          (this.peg[k]?.canon ?? this.peg[k])
        ])
        .join(',') +
      '}'
    if (this.done) this._canonCache = c
    return c
  }


  inspection(_d?: number) {
    return ''
  }

}


export {
  MapVal,
}
