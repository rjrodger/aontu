/* Copyright (c) 2025 Richard Rodger, MIT License */

// SpreadVal represents a spread constraint (&:{...}).
// It owns all spread application logic — MapVal and ListVal know
// nothing about spreads. A parsed `{a:1, &:{x:2}}` becomes
// `ConjunctVal([MapVal({a:1}), SpreadVal({x:2})])`.
//
// SpreadVal.unify applies the constraint to a peer MapVal/ListVal
// by unifying each of the peer's children with a per-key clone of
// the spread constraint.

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

import { makeNilErr } from '../err'

import {
  top
} from './top'

import { FeatureVal } from './FeatureVal'
import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { MapVal } from './MapVal'
import { ListVal } from './ListVal'


class SpreadVal extends FeatureVal {
  isSpread = true
  isGenable = true
  cjo = 110000  // Sorts after MapVal/ListVal in ConjunctVal norm

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }


  unify(peer: Val, ctx: AontuContext): Val {
    peer = peer ?? top()

    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Spread', this, peer)

    let out: Val

    if (peer.isTop) {
      // Self-unify: spread is a constraint, not a value that converges.
      // Mark done to prevent fixpoint cycling.
      out = this
      out.dc = DONE
    }
    else if ((peer as any).isSpread) {
      // SpreadVal + SpreadVal: unify the two constraints
      const merged = unite(
        te ? ctx.clone({ explain: ec(te, 'SPR') }) : ctx,
        this.peg, peer.peg, 'spread-merge')
      out = new SpreadVal({ peg: merged }, ctx)
      out.dc = merged.done ? DONE : this.dc + 1
    }
    else if (peer.isMap) {
      // SpreadVal + MapVal: apply spread to each map key
      out = this.applyToMap(peer as any, ctx, te)
    }
    else if (peer.isList) {
      // SpreadVal + ListVal: apply spread to each list element
      out = this.applyToList(peer as any, ctx, te)
    }
    else if (peer.isConjunct) {
      // SpreadVal + ConjunctVal: unify with the conjunct.
      // The conjunct fold will place us last (high cjo).
      out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'SCJ') }) : ctx)
    }
    else {
      // SpreadVal + other: defer by wrapping in ConjunctVal
      out = new ConjunctVal({ peg: [peer, this] }, ctx)
      out.dc = this.dc + 1
    }

    // Track unresolved spread count.
    // cc=0: increment for spreads that don't vanish.
    // cc>0: decrement when a spread vanishes.
    if (0 === ctx.cc) {
      if (out.isSpread && !out.done) {
        ctx.sc++
      }
    }
    else if (ctx.sc > 0) {
      if (!(out.isSpread && !out.done)) {
        ctx.sc--
      }
    }

    ctx.explain && explainClose(te, out)
    return out
  }


  // Apply this spread constraint to each key in a MapVal.
  // Uses unite() per key with the correct descended context.
  applyToMap(map: MapVal, ctx: AontuContext, te: any): Val {
    const spread = this.peg

    const mapKeys = Object.keys(map.peg)

    // If map has no keys, preserve the spread for future merges.
    // Mark as DONE to prevent fixpoint cycling.
    if (mapKeys.length === 0) {
      const out = new ConjunctVal({ peg: [map, this] }, ctx)
      out.dc = DONE
      return out
    }

    const out = new MapVal({ peg: {} }, ctx)
    out.closed = map.closed
    out.optionalKeys = 0 < map.optionalKeys.length
      ? [...map.optionalKeys] : map.optionalKeys
    out.site = map.site

    let done = true

    for (const key of mapKeys) {
      const child = map.peg[key]
      const keyctx = ctx.descend(key)
      // Clone the spread for this key's context, then resolve any
      // path-dependent functions (key(), path(), etc.) by unifying
      // with TOP. This ensures the spread values are concrete before
      // being merged as peer keys into the child map.
      let key_spread = spread.spreadClone(keyctx)
      if (!key_spread.done) {
        key_spread = unite(keyctx, key_spread, top(), 'spread-resolve')
      }

      // Clear type/hide marks on the spread constraint — it constrains
      // but should not mark the children as type/hidden.
      key_spread.mark.type = false
      key_spread.mark.hide = false

      propagateMarks(map, child)

      out.peg[key] =
        undefined === child ? key_spread :
          child.isNil ? child :
            key_spread.isNil ? key_spread :
              key_spread.isTop && child.done ? child :
                child.isTop && key_spread.done ? key_spread :
                  unite(te ? keyctx.clone({ explain: ec(te, 'SK:' + key) }) : keyctx,
                    child, key_spread, 'spread-apply')

      done = done && (DONE === out.peg[key].dc)
    }

    out.dc = done ? DONE : map.dc + 1

    propagateMarks(map, out)
    // NOTE: do not propagate type/hide marks from the spread constraint
    // to the output — a type spread constrains children but doesn't
    // make them type-invisible.

    return out
  }


  // Apply this spread constraint to each element in a ListVal.
  applyToList(list: ListVal, ctx: AontuContext, te: any): Val {
    const spread = this.peg

    const listKeys = Object.keys(list.peg)

    if (listKeys.length === 0) {
      const out = new ConjunctVal({ peg: [list, this] }, ctx)
      out.dc = DONE
      return out
    }

    const out = new ListVal({ peg: [] }, ctx)
    out.closed = list.closed
    out.optionalKeys = 0 < list.optionalKeys.length
      ? [...list.optionalKeys] : list.optionalKeys
    out.site = list.site

    let done = true

    for (const key of listKeys) {
      const child = list.peg[key]
      const keyctx = ctx.descend(key)
      const key_spread = spread.spreadClone(keyctx)

      propagateMarks(list, child)

      out.peg[key as any] =
        undefined === child ? key_spread :
          child.isNil ? child :
            key_spread.isNil ? key_spread :
              key_spread.isTop && child.done ? child :
                child.isTop && key_spread.done ? key_spread :
                  unite(te ? keyctx.clone({ explain: ec(te, 'SL:' + key) }) : keyctx,
                    child, key_spread, 'spread-apply-list')

      done = done && (DONE === out.peg[key as any]?.dc)
    }

    out.dc = done ? DONE : list.dc + 1

    propagateMarks(list, out)

    return out
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    const out = new SpreadVal({
      peg: this.peg.clone(ctx, spec),
      ...(spec || {}),
    }, ctx)
    out.dc = this.done ? DONE : out.dc
    out.site = this.site
    return out
  }


  spreadClone(ctx: AontuContext): Val {
    if (!this.isPathDependent) return this
    return this.clone(ctx)
  }


  get canon(): string {
    // Use {&:...} for map spreads, [&:...] for list spreads, {&:X} for scalars
    const pc = this.peg.canon
    if (this.peg.isMap) return '{&:' + pc.slice(1, -1) + '}'   // {&:k:v,...}
    if (this.peg.isList) return '[&:' + pc.slice(1, -1) + ']'  // [&:v,...]
    return '{&:' + pc + '}'
  }


  gen(_ctx: AontuContext) {
    // Unresolved spread (never applied to a map/list) generates
    // as undefined — the spread is a constraint, not a value.
    return undefined
  }


  inspection() {
    return 'spread'
  }
}


export {
  SpreadVal,
}
