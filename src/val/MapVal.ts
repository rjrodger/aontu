/* Copyright (c) 2021-2025 Richard Rodger, MIT License */



import type {
  Val,
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

import { makeNilErr } from '../err'

import {
  top
} from './top'


import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { BagVal } from './BagVal'
import { empty } from './Val'


class MapVal extends BagVal {
  isMap = true

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)

    if (null == this.peg) {
      throw new Error('MapVal spec.peg undefined')
    }

    this.mark.type = !!spec.mark?.type
    this.mark.hide = !!spec.mark?.hide

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
  unify(peer: Val, ctx: AontuContext): Val {
    const TOP = top()
    peer = peer ?? TOP
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Map', this, peer)

    let done: boolean = true
    let exit = false

    // NOTE: not a clone! needs to be constructed.
    let out: MapVal | NilVal = (peer.isTop ? this : new MapVal({ peg: {} }, ctx))

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      if (!this.closed && peer.closed) {
        out = peer.unify(this, ctx.clone({ explain: ec(te, 'PMC') })) as MapVal
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
          out = peer.unify(this, ctx.clone({ explain: ec(te, 'SPC') })) as MapVal
          exit = true
        }

      }

      if (!exit) {
        out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
          null == peer.spread.cj ? out.spread.cj : (
            out.spread.cj =
            unite(ctx.clone({ explain: ec(te, 'SPR') }), out.spread.cj, peer.spread.cj, 'map-self')
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
                      child, key_spread_cj, 'map-own')

        done = (done && DONE === out.peg[key].dc)
      }

      const allowedKeys: string[] = this.closed ? Object.keys(this.peg) : []
      let bad: NilVal | undefined = undefined

      if (peer instanceof MapVal) {
        let upeer: MapVal = (unite(ctx.clone({ explain: ec(te, 'PER') }),
          peer, TOP, 'map-peer-map') as MapVal)

        for (let peerkey in upeer.peg) {
          let peerchild = upeer.peg[peerkey]

          if (this.closed && !allowedKeys.includes(peerkey)) {
            bad = makeNilErr(ctx, 'closed', peerchild, undefined)
          }

          // key optionality is additive
          if (upeer.optionalKeys.includes(peerkey) && !out.optionalKeys.includes(peerkey)) {
            out.optionalKeys.push(peerkey)
          }

          let child = out.peg[peerkey]

          let oval = out.peg[peerkey] =
            undefined === child ? peerchild :
              child.isTop && peerchild.done ? peerchild :
                child.isNil ? child :
                  peerchild.isNil ? peerchild :
                    unite(ctx.descend(peerkey).clone({ explain: ec(te, 'CHD') }),
                      child, peerchild, 'map-peer')

          if (this.spread.cj) {
            let key_ctx = ctx.descend(peerkey)
            let key_spread_cj = spread_cj.clone(key_ctx)
            oval = out.peg[peerkey] =
              unite(key_ctx.clone({ explain: ec(te, 'PSP:' + peerkey) }),
                oval, key_spread_cj, 'map-peer-spread')
          }

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
        out.uh.push(peer.id)

        out.dc = done ? DONE : out.dc
        propagateMarks(peer, out)
        propagateMarks(this, out)
      }
    }

    // console.log('MAPVAL-OUT', this.id, this.closed, this.canon, 'P=', (peer as any).closed, peer.canon, '->', (out as any).closed, out.canon)

    ctx.explain && explainClose(te, out)

    return out
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as MapVal)
    out.peg = {}
    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        (entry[1] as any)?.isVal ? (entry[1] as Val).clone(ctx, spec?.mark ? { mark: spec.mark } : {}) : entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {})
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
      // (this.mark.type ? '<type>' : '') +
      // (this.id + '=') +
      '{' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => [
          JSON.stringify(k) +
          (this.optionalKeys.includes(k) ? '?' : '') +
          ':' +
          (this.peg[k]?.canon ?? this.peg[k])
        ])
        .join(',') +
      '}'
  }


  inspection(inspect: Function) {
    return this.spread.cj ? '&:' + inspect(this.spread.cj) : ''
  }


  gen(ctx: AontuContext) {
    let out: any = {}
    if (this.mark.type || this.mark.hide) {
      return undefined
    }

    for (let p in this.peg) {
      const child = this.peg[p]
      if (child.mark.type || child.mark.hide) {
        continue
      }

      const optional = this.optionalKeys.includes(p)

      if (child.isScalar
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

        out[p] = cval
      }
      else if (!optional) {
        makeNilErr(
          ctx,
          this.closed ? 'mapval_required' : 'mapval_no_gen',
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
  MapVal
}
