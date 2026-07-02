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
  walk,
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


// Structural snapshots of ref spreads (see MapVal.unify), keyed by the
// ref's canon + source site rather than object identity: spread
// application clones templates (and the refs inside them) freely, and a
// clone must find the snapshot its parse-origin ref captured on an early
// pass. The map lives on the unify root ctx (see Unify), so it persists
// across fixpoint passes and is GC'd with the run.
function spreadSnapKey(cj: any): string {
  return cj.canon + '~' + (cj.site?.row ?? -1) + ':' + (cj.site?.col ?? -1)
}

// Snapshot a path-dependent ref spread to its structural target once,
// while inner key()/path() funcs in the target are still unresolved (see
// the call site comments in MapVal.unify). Shared by the direct
// application path and the deferred-spread early-snapshot walk.
function snapshotRefSpread(cj: any, ctx: AontuContext): Val | undefined {
  let snapmap: Map<string, Val> | undefined = (ctx as any).snapmap
  if (undefined === snapmap) {
    // Direct Val.unify use without a Unify run: degrade to a ctx-local
    // map (snapshots then live only for that subtree, as before).
    snapmap = new Map()
    ; (ctx as any).snapmap = snapmap
  }
  const sk = spreadSnapKey(cj)
  let snap: Val | undefined = snapmap.get(sk)
  if (undefined === snap) {
    let tgt: Val | undefined = cj.find(ctx)
    // A ref to a type() resolves to its inner template — snapshot that,
    // so a type-wrapped ref behaves like a plain-map ref spread.
    if (tgt && (tgt as any).isTypeFunc) tgt = (tgt as any).peg?.[0]
    // Only snapshot a found, path-dependent target. If the target is not
    // present yet (it may be introduced by a later conjunct/merge), do
    // NOT cache — retry on the next fixpoint pass.
    if (tgt && tgt.isVal && tgt.isPathDependent) {
      snap = tgt.clone(ctx)
      // Clear TYPE marks on the snapshot (recursively): a type() template
      // constrains values but must not make the spread destination
      // type-invisible at any depth. HIDE marks are preserved.
      walk(snap, (_k: any, v: Val) => {
        v.mark.type = false
        return v
      })
      snapmap.set(sk, snap)
    }
  }
  return snap
}


class MapVal extends BagVal {
  isMap = true

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
    // console.log('MAPVAL-UNIFY', this.id, this.canon, peer.id, peer.canon)

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

      if (!exit) {
        // Combine two spread constraints. Identical templates (same canon)
        // collapse to one: re-unifying them resolves key()/path() at the
        // shared intermediate path, producing spurious values (f1bb1063).
        // Distinct templates are unified in place — unite is idempotent,
        // whereas deferring the distinct case into a fresh ConjunctVal (as
        // f1bb1063 did) re-wraps every fixpoint pass, growing the conjunct
        // without bound and non-terminating on real models (the apidef +
        // sdkgen entity schemas each contribute a `&:` spread with name:key(),
        // combined here). unite resolves key()/path() at each destination via
        // spreadClone below, so nested + sibling key() cases stay correct
        // (test/spec/spread-nested-key, spread-key-all).
        out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
          null == peer.spread.cj ? out.spread.cj :
            out.spread.cj.canon === peer.spread.cj.canon ? out.spread.cj :
              unite(te ? ctx.clone({ explain: ec(te, 'SPR') }) : ctx,
                out.spread.cj, peer.spread.cj, 'map-self')
        )
      }
    }
    else {
      // console.log('MAPVAL-PEER-OTHER', this.id, this.canon, this.done, peer.id, peer.canon, peer.done)
    }


    if (!exit) {
      out.dc = this.dc + 1

      // let newtype = this.type || peer.type

      let spread_cj = out.spread.cj ?? TOP

      // Snapshot a path-dependent *ref* spread to its structural target
      // once (while inner key()/path() funcs are still unresolved), so
      // later fixpoint passes don't re-resolve the ref against the mutated
      // tree and capture the target's own resolved key()/path() literals,
      // which would leak the source key into the spread destination.
      if (spread_cj.isRef && (spread_cj as any).find) {
        const snap = snapshotRefSpread(spread_cj, ctx)
        if (snap) spread_cj = snap
      }

      // A type() used as a spread applies as its inner template: emit the
      // (constrained) values at each destination rather than marking the
      // destination as a type. I.e. `&:type({k:key(),x:number})` behaves
      // like the non-type spread `&:{k:key(),x:number}` — key() resolves
      // to the destination key, kinds constrain, fields are emitted.
      if ((spread_cj as any).isTypeFunc) {
        spread_cj = (spread_cj as any).peg?.[0] ?? TOP
      }

      // Always unify own children first
      for (let key in this.peg) {
        const child = this.peg[key]
        const keyctx = ctx.descend(key)

        propagateMarks(this, child)

        // Apply the spread constraint ONCE per child (marked with the
        // constraint's id below): the first application merges the
        // template into the child (with key()/path() placeholders that
        // resolve in place on later passes), so the constraint content
        // is inside the child from then on and only self-unification is
        // needed to progress it. Re-applying on every fixpoint pass and
        // every conjunct-fold step is the identity (unite is idempotent)
        // but costs O(keys) deep template clones per pass on large
        // models — the dominant cost on generated-SDK model trees.
        let oval: Val
        if (undefined !== child && !spread_cj.isTop
          && (child as any)._spr === (spread_cj as any).id) {
          oval = child.done ? child :
            unite(te ? keyctx.clone({ explain: ec(te, 'KEY:' + key) }) : keyctx,
              child, TOP, 'map-own')
          ; (oval as any)._spr = (spread_cj as any).id
        }
        else {
          const key_spread_cj = spread_cj.spreadClone(keyctx)

          oval =
            undefined === child ? key_spread_cj :
              child.isNil ? child :
                key_spread_cj.isNil ? key_spread_cj :
                  key_spread_cj.isTop && child.done ? child :
                    child.isTop && key_spread_cj.done ? key_spread_cj :
                      unite(te ? keyctx.clone({ explain: ec(te, 'KEY:' + key) }) : keyctx,
                        child, key_spread_cj, 'map-own')

          if (!spread_cj.isTop && !oval.isNil) {
            ; (oval as any)._spr = (spread_cj as any).id
          }
        }

        out.peg[key] = oval

        done = (done && DONE === oval.dc)
      }

      const allowedKeys: string[] = this.closed ? Object.keys(this.peg) : []
      let bad: NilVal | undefined = undefined

      if (peer instanceof MapVal) {
        let upeer: MapVal = peer.done ? peer as MapVal : (unite(
          te ? ctx.clone({ explain: ec(te, 'PER') }) : ctx,
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

          const peerctx = ctx.descend(peerkey)

          let oval = out.peg[peerkey] =
            undefined === child ? this.handleExpectedVal(peerkey, peerchild, this, ctx) :
              child.isTop && peerchild.done ? peerchild :
                child.isNil ? child :
                  peerchild.isNil ? peerchild :
                    unite(te ? peerctx.clone({ explain: ec(te, 'CHD') }) : peerctx,
                      child, peerchild, 'map-peer')

          if (this.spread.cj) {
            // Same apply-once discipline as the own-key loop: once the
            // constraint is merged into the value (marked with the
            // constraint's id), later passes only self-unify.
            if ((oval as any)._spr !== (spread_cj as any).id) {
              let key_spread_cj = spread_cj.spreadClone(peerctx)

              oval = out.peg[peerkey] =
                unite(te ? peerctx.clone({ explain: ec(te, 'PSP:' + peerkey) }) : peerctx,
                  oval, key_spread_cj, 'map-peer-spread')

              if (!spread_cj.isTop && !oval.isNil) {
                ; (oval as any)._spr = (spread_cj as any).id
              }
            }
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
        ;(out.uh ??= []).push(peer.id)

        out.dc = done ? DONE : out.dc
        propagateMarks(peer, out)
        propagateMarks(this, out)
      }
    }

    // console.log(
    //   'MAPVAL-OUT', out.canon,
    //   '\n  SELF', this,
    //   '\n  PEER', peer,
    //   '\n  OUT', out,
    //   '\n  FROM', (out as any).spread.cj
    // )

    ctx.explain && explainClose(te, out)

    return out
  }


  // Spread clone: return a Val usable as the per-key spread constraint.
  //
  // Three tiers:
  //   1. tree is path-independent (no RefVal/KeyFuncVal/PathFuncVal/
  //      MoveFuncVal/SuperFuncVal anywhere below): return `this` directly.
  //      Nothing in the unify path mutates the spread root, and no
  //      child depends on its own stored .path, so sharing is safe.
  //   2. top-level children are all ScalarKindVal: shallow clone
  //      (share children, fresh MapVal wrapper).
  //   3. otherwise: full deep clone via `this.clone(ctx)`.
  //
  // Tier 1 handles the foo-sdk common case of simple type-constraint
  // spreads like `&:{active: *true | boolean, version: *'0.0.1' | string}`,
  // which are cloned thousands of times per run.
  spreadClone(ctx: AontuContext): Val {
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

    let out = (super.clone(ctx) as MapVal)
    out.peg = {}

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
    let out = (super.clone(ctx, spec) as MapVal)
    out.peg = {}

    for (let entry of Object.entries(this.peg)) {
      out.peg[entry[0]] =
        (entry[1] as any)?.isVal ?
          // (entry[1] as Val).clone(ctx, spec?.mark ? { mark: spec.mark } : {}) :
          (entry[1] as Val).clone(ctx, {
            mark: spec?.mark ?? {},
            path: [...out.path, entry[0]]
          }) :
          entry[1]
    }
    if (this.spread.cj) {
      out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {})
    }

    out.closed = this.closed
    out.optionalKeys = [...this.optionalKeys]

    // out.from = this.from

    // console.log('MAPVAL-CLONE', this.canon, '->', out.canon)
    return out
  }


  get canon() {
    // Keys are emitted alphabetically so the canonical form is
    // independent of insertion/unification order (and matches the Go
    // port, whose JSON marshaling also sorts keys).
    let keys = Object.keys(this.peg).sort()
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
      '}' // + '<' + (this.mark.hide ? 'H' : '') + '>'

  }


  inspection(d?: number) {
    return this.spread.cj ? '&:' + this.spread.cj.inspect(null == d ? 0 : d + 1) : ''
  }

}


export {
  MapVal
}
