"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const err_1 = require("../err");
const top_1 = require("./top");
const ConjunctVal_1 = require("./ConjunctVal");
const BagVal_1 = require("./BagVal");
// Structural snapshots of ref spreads (see MapVal.unify), keyed by the
// ref's canon + source site rather than object identity: spread
// application clones templates (and the refs inside them) freely, and a
// clone must find the snapshot its parse-origin ref captured on an early
// pass. The map lives on the unify root ctx (see Unify), so it persists
// across fixpoint passes and is GC'd with the run.
function spreadSnapKey(cj) {
    return cj.canon + '~' + (cj.site?.row ?? -1) + ':' + (cj.site?.col ?? -1);
}
// Snapshot a path-dependent ref spread to its structural target once,
// while inner key()/path() funcs in the target are still unresolved (see
// the call site comments in MapVal.unify). Shared by the direct
// application path and the deferred-spread early-snapshot walk.
function snapshotRefSpread(cj, ctx) {
    let snapmap = ctx.snapmap;
    if (undefined === snapmap) {
        // Direct Val.unify use without a Unify run: degrade to a ctx-local
        // map (snapshots then live only for that subtree, as before).
        snapmap = new Map();
        ctx.snapmap = snapmap;
    }
    const sk = spreadSnapKey(cj);
    let snap = snapmap.get(sk);
    if (undefined === snap) {
        let tgt = cj.find(ctx);
        // A ref to a type() resolves to its inner template — snapshot that,
        // so a type-wrapped ref behaves like a plain-map ref spread.
        if (tgt && tgt.isTypeFunc)
            tgt = tgt.peg?.[0];
        // Only snapshot a found, path-dependent target. If the target is not
        // present yet (it may be introduced by a later conjunct/merge), do
        // NOT cache — retry on the next fixpoint pass.
        if (tgt && tgt.isVal && tgt.isPathDependent) {
            snap = tgt.clone(ctx);
            // Clear TYPE marks on the snapshot (recursively): a type() template
            // constrains values but must not make the spread destination
            // type-invisible at any depth. HIDE marks are preserved.
            (0, utility_1.walk)(snap, (_k, v) => {
                v.mark.type = false;
                return v;
            });
            snapmap.set(sk, snap);
        }
    }
    return snap;
}
class MapVal extends BagVal_1.BagVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMap = true;
        if (null == this.peg) {
            throw new err_1.AontuError('MapVal spec.peg undefined');
        }
        this.mark.type = !!spec.mark?.type;
        this.mark.hide = !!spec.mark?.hide;
        let spread = this.peg[type_1.SPREAD];
        delete this.peg[type_1.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    Array.isArray(spread.v) ?
                        1 < spread.v.length ?
                            new ConjunctVal_1.ConjunctVal({ peg: spread.v }, ctx) :
                            spread.v[0] :
                        spread.v;
            }
        }
        // console.log('MAPVAL-ctor', this.type, spec)
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        // console.log('MAPVAL-UNIFY', this.id, this.canon, peer.id, peer.canon)
        const TOP = (0, top_1.top)();
        peer = peer ?? TOP;
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Map', this, peer);
        let done = true;
        let exit = false;
        // NOTE: not a clone! needs to be constructed.
        let out = (peer.isTop ? this : new MapVal({ peg: {} }, ctx));
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        out.spread.cj = this.spread.cj;
        out.site = this.site;
        if (peer instanceof MapVal) {
            if (!this.closed && peer.closed) {
                out = peer.unify(this, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PMC') }) : ctx);
                exit = true;
            }
            // ensure determinism of unification
            else if (this.closed && peer.closed) {
                const peerkeys = Object.keys(peer.peg);
                const selfkeys = Object.keys(this.peg);
                if (peerkeys.length < selfkeys.length
                    || (peerkeys.length === selfkeys.length
                        && peerkeys.join('~') < selfkeys.join('~'))) {
                    out = peer.unify(this, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SPC') }) : ctx);
                    exit = true;
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
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj :
                    out.spread.cj.canon === peer.spread.cj.canon ? out.spread.cj :
                        (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SPR') }) : ctx, out.spread.cj, peer.spread.cj, 'map-self'));
            }
        }
        else {
            // console.log('MAPVAL-PEER-OTHER', this.id, this.canon, this.done, peer.id, peer.canon, peer.done)
        }
        if (!exit) {
            out.dc = this.dc + 1;
            // let newtype = this.type || peer.type
            let spread_cj = out.spread.cj ?? TOP;
            // Snapshot a path-dependent *ref* spread to its structural target
            // once (while inner key()/path() funcs are still unresolved), so
            // later fixpoint passes don't re-resolve the ref against the mutated
            // tree and capture the target's own resolved key()/path() literals,
            // which would leak the source key into the spread destination.
            if (spread_cj.isRef && spread_cj.find) {
                const snap = snapshotRefSpread(spread_cj, ctx);
                if (snap)
                    spread_cj = snap;
            }
            // A type() used as a spread applies as its inner template: emit the
            // (constrained) values at each destination rather than marking the
            // destination as a type. I.e. `&:type({k:key(),x:number})` behaves
            // like the non-type spread `&:{k:key(),x:number}` — key() resolves
            // to the destination key, kinds constrain, fields are emitted.
            if (spread_cj.isTypeFunc) {
                spread_cj = spread_cj.peg?.[0] ?? TOP;
            }
            // Always unify own children first
            for (let key in this.peg) {
                const child = this.peg[key];
                const keyctx = ctx.descend(key);
                (0, utility_1.propagateMarks)(this, child);
                // Apply the spread constraint ONCE per child (marked with the
                // constraint's id below): the first application merges the
                // template into the child (with key()/path() placeholders that
                // resolve in place on later passes), so the constraint content
                // is inside the child from then on and only self-unification is
                // needed to progress it. Re-applying on every fixpoint pass and
                // every conjunct-fold step is the identity (unite is idempotent)
                // but costs O(keys) deep template clones per pass on large
                // models — the dominant cost on generated-SDK model trees.
                let oval;
                if (undefined !== child && !spread_cj.isTop
                    && child._spr === spread_cj.id) {
                    oval = child.done ? child :
                        (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'KEY:' + key) }) : keyctx, child, TOP, 'map-own');
                    oval._spr = spread_cj.id;
                }
                else {
                    const key_spread_cj = spread_cj.spreadClone(keyctx);
                    oval =
                        undefined === child ? key_spread_cj :
                            child.isNil ? child :
                                key_spread_cj.isNil ? key_spread_cj :
                                    key_spread_cj.isTop && child.done ? child :
                                        child.isTop && key_spread_cj.done ? key_spread_cj :
                                            (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'KEY:' + key) }) : keyctx, child, key_spread_cj, 'map-own');
                    if (!spread_cj.isTop && !oval.isNil) {
                        ;
                        oval._spr = spread_cj.id;
                    }
                }
                out.peg[key] = oval;
                done = (done && type_1.DONE === oval.dc);
            }
            const allowedKeys = this.closed ? Object.keys(this.peg) : [];
            let bad = undefined;
            if (peer instanceof MapVal) {
                let upeer = peer.done ? peer : (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PER') }) : ctx, peer, TOP, 'map-peer-map');
                for (let peerkey in upeer.peg) {
                    let peerchild = upeer.peg[peerkey];
                    if (this.closed && !allowedKeys.includes(peerkey)) {
                        bad = (0, err_1.makeNilErr)(ctx, 'closed', peerchild, undefined);
                    }
                    // key optionality is additive
                    if (upeer.optionalKeys.includes(peerkey) && !out.optionalKeys.includes(peerkey)) {
                        out.optionalKeys.push(peerkey);
                    }
                    let child = out.peg[peerkey];
                    const peerctx = ctx.descend(peerkey);
                    let oval = out.peg[peerkey] =
                        undefined === child ? this.handleExpectedVal(peerkey, peerchild, this, ctx) :
                            child.isTop && peerchild.done ? peerchild :
                                child.isNil ? child :
                                    peerchild.isNil ? peerchild :
                                        (0, unify_1.unite)(te ? peerctx.clone({ explain: (0, utility_1.ec)(te, 'CHD') }) : peerctx, child, peerchild, 'map-peer');
                    if (this.spread.cj) {
                        // Same apply-once discipline as the own-key loop: once the
                        // constraint is merged into the value (marked with the
                        // constraint's id), later passes only self-unify.
                        if (oval._spr !== spread_cj.id) {
                            let key_spread_cj = spread_cj.spreadClone(peerctx);
                            oval = out.peg[peerkey] =
                                (0, unify_1.unite)(te ? peerctx.clone({ explain: (0, utility_1.ec)(te, 'PSP:' + peerkey) }) : peerctx, oval, key_spread_cj, 'map-peer-spread');
                            if (!spread_cj.isTop && !oval.isNil) {
                                ;
                                oval._spr = spread_cj.id;
                            }
                        }
                    }
                    (0, utility_1.propagateMarks)(this, oval);
                    done = (done && type_1.DONE === oval.dc);
                }
            }
            else if (!peer.isTop) {
                out = (0, err_1.makeNilErr)(ctx, 'map', this, peer);
            }
            if (null != bad) {
                out = bad;
            }
            if (!out.isNil) {
                ;
                (out.uh ??= []).push(peer.id);
                out.dc = done ? type_1.DONE : out.dc;
                (0, utility_1.propagateMarks)(peer, out);
                (0, utility_1.propagateMarks)(this, out);
            }
        }
        // console.log(
        //   'MAPVAL-OUT', out.canon,
        //   '\n  SELF', this,
        //   '\n  PEER', peer,
        //   '\n  OUT', out,
        //   '\n  FROM', (out as any).spread.cj
        // )
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
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
    spreadClone(ctx) {
        if (!this.isPathDependent)
            return this;
        let allScalarKind = true;
        for (let key in this.peg) {
            if (!this.peg[key]?.isScalarKind) {
                allScalarKind = false;
                break;
            }
        }
        if (!allScalarKind) {
            return this.clone(ctx);
        }
        let out = super.clone(ctx);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] = entry[1];
        }
        // Must create a new spread object to avoid mutating the original.
        out.spread = {
            cj: this.spread.cj ? this.spread.cj.spreadClone(ctx) : undefined,
        };
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1]?.isVal ?
                    // (entry[1] as Val).clone(ctx, spec?.mark ? { mark: spec.mark } : {}) :
                    entry[1].clone(ctx, {
                        mark: spec?.mark ?? {},
                        path: [...out.path, entry[0]]
                    }) :
                    entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {});
        }
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        // out.from = this.from
        // console.log('MAPVAL-CLONE', this.canon, '->', out.canon)
        return out;
    }
    get canon() {
        // Keys are emitted alphabetically so the canonical form is
        // independent of insertion/unification order (and matches the Go
        // port, whose JSON marshaling also sorts keys).
        let keys = Object.keys(this.peg).sort();
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
            '}'; // + '<' + (this.mark.hide ? 'H' : '') + '>'
    }
    inspection(d) {
        return this.spread.cj ? '&:' + this.spread.cj.inspect(null == d ? 0 : d + 1) : '';
    }
}
exports.MapVal = MapVal;
//# sourceMappingURL=MapVal.js.map