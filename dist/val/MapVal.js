"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
exports.valHash = valHash;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const err_1 = require("../err");
const top_1 = require("./top");
const ConjunctVal_1 = require("./ConjunctVal");
const BagVal_1 = require("./BagVal");
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
        // Canon-keyed cache: when both maps are done, the unification
        // result depends only on their structure, not instance identity.
        // ~99.6% of done-map unifications in large models are redundant.
        // Canon is cached per done Val via _canonCache, so O(1) after first use.
        if (this.done && peer instanceof MapVal && peer.done) {
            const uc = ctx._uniteCache;
            if (uc !== undefined) {
                const ck = this.canon + '|||' + peer.canon;
                const cached = uc.get(ck);
                if (cached !== undefined)
                    return cached;
            }
        }
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
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                    (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SPR') }) : ctx, out.spread.cj, peer.spread.cj, 'map-self')));
            }
        }
        else {
            // console.log('MAPVAL-PEER-OTHER', this.id, this.canon, this.done, peer.id, peer.canon, peer.done)
        }
        if (!exit) {
            out.dc = this.dc + 1;
            // let newtype = this.type || peer.type
            let spread_cj = out.spread.cj ?? TOP;
            // Fast path: self-unify with TOP and no spread constraint.
            // If all children are already done, the map is fully converged
            // and we can skip the per-key unite loop entirely.
            if (peer.isTop && spread_cj.isTop) {
                let allChildrenDone = true;
                for (let key in this.peg) {
                    if (type_1.DONE !== this.peg[key]?.dc) {
                        allChildrenDone = false;
                        break;
                    }
                }
                if (allChildrenDone) {
                    out.dc = type_1.DONE;
                    ctx.explain && (0, utility_1.explainClose)(te, out);
                    return out;
                }
            }
            // Always unify own children first
            for (let key in this.peg) {
                const child = this.peg[key];
                // When the child is already done AND the spread hasn't changed
                // from what `this` already carries (meaning the child was
                // produced under this spread in a prior step), re-applying
                // it is redundant. Use id equality to handle unified spreads
                // that preserve the original's identity.
                if (child?.done && this.spread.cj != null
                    && (this.spread.cj === spread_cj
                        || this.spread.cj.id === spread_cj.id
                        || (this.spread.cj.done && spread_cj.done
                            && this.spread.cj.canon === spread_cj.canon))) {
                    (0, utility_1.propagateMarks)(this, child);
                    out.peg[key] = child;
                    // done stays true (child.dc === DONE)
                    continue;
                }
                const keyctx = ctx.descend(key);
                const key_spread_cj = spread_cj.spreadClone(keyctx);
                (0, utility_1.propagateMarks)(this, child);
                out.peg[key] =
                    undefined === child ? key_spread_cj :
                        child.isNil ? child :
                            key_spread_cj.isNil ? key_spread_cj :
                                key_spread_cj.isTop && child.done ? child :
                                    child.isTop && key_spread_cj.done ? key_spread_cj :
                                        (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'KEY:' + key) }) : keyctx, child, key_spread_cj, 'map-own');
                done = (done && type_1.DONE === out.peg[key].dc);
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
                        let key_spread_cj = spread_cj.spreadClone(peerctx);
                        oval = out.peg[peerkey] =
                            (0, unify_1.unite)(te ? peerctx.clone({ explain: (0, utility_1.ec)(te, 'PSP:' + peerkey) }) : peerctx, oval, key_spread_cj, 'map-peer-spread');
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
        // Store in canon cache when both operands were done.
        if (this.done && peer instanceof MapVal && peer.done && !out.isNil) {
            const uc = ctx._uniteCache;
            if (uc !== undefined) {
                uc.set(this.canon + '|||' + peer.canon, out);
            }
        }
        return out;
    }
    // Spread clone: return a Val usable as the per-key spread constraint.
    //
    // Four tiers:
    //   1. tree is path-independent (no RefVal/KeyFuncVal/PathFuncVal/
    //      MoveFuncVal/SuperFuncVal anywhere below): return `this` directly.
    //      Nothing in the unify path mutates the spread root, and no
    //      child depends on its own stored .path, so sharing is safe.
    //   2. top-level children are all ScalarKindVal: shallow clone
    //      (share children, fresh MapVal wrapper).
    //   3. selective clone: share path-independent children directly,
    //      clone only path-dependent ones. Avoids deep-cloning the
    //      entire tree when only a few children need path adjustment
    //      (e.g. a spread with `name: key()` and 6 other static fields).
    //   4. full deep clone via `this.clone(ctx)` — unreachable now but
    //      kept as the logical fallback.
    //
    // Tier 1 handles the foo-sdk common case of simple type-constraint
    // spreads like `&:{active: *true | boolean, version: *'0.0.1' | string}`,
    // which are cloned thousands of times per run.
    spreadClone(ctx) {
        if (!this.isPathDependent)
            return this;
        let out = super.clone(ctx);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            const child = entry[1];
            if (child?.isVal && child.isPathDependent) {
                out.peg[entry[0]] = child.clone(ctx, { path: [...out.path, entry[0]] });
            }
            else if (child?.isVal) {
                // Share the Val but give it a fresh mark object so
                // propagateMarks doesn't mutate the original.
                const wrapper = Object.create(child);
                wrapper.mark = { ...child.mark };
                out.peg[entry[0]] = wrapper;
            }
            else {
                out.peg[entry[0]] = child;
            }
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
        if (this._canonCache !== undefined)
            return this._canonCache;
        let keys = Object.keys(this.peg);
        const c = '' +
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
        if (this.done)
            this._canonCache = c;
        return c;
    }
    inspection(d) {
        return this.spread.cj ? '&:' + this.spread.cj.inspect(null == d ? 0 : d + 1) : '';
    }
}
exports.MapVal = MapVal;
// Numeric structural hash for done Vals. Cached on _fingerprint.
// O(1) per Val when children already have hashes (bottom-up).
// Uses FNV-1a-like mixing for good distribution.
function valHash(v) {
    if (v._fingerprint !== undefined)
        return v._fingerprint;
    let h = 2166136261; // FNV offset basis
    if (v.isScalar || v.isScalarKind) {
        const s = '' + v.peg;
        for (let i = 0; i < s.length; i++)
            h = (h ^ s.charCodeAt(i)) * 16777619;
        h = (h ^ (v.constructor.name.charCodeAt(0) * 31)) | 0;
    }
    else if (v.isMap) {
        for (const k in v.peg) {
            const kc = k.charCodeAt(0) | (k.length << 8);
            h = (h ^ kc) * 16777619;
            h = (h ^ valHash(v.peg[k])) * 16777619;
        }
        if (v.spread?.cj)
            h = (h ^ valHash(v.spread.cj)) * 16777619;
        h = (h ^ 123) | 0; // map marker
    }
    else if (v.isList) {
        for (const k in v.peg) {
            h = (h ^ valHash(v.peg[k])) * 16777619;
        }
        if (v.spread?.cj)
            h = (h ^ valHash(v.spread.cj)) * 16777619;
        h = (h ^ 456) | 0; // list marker
    }
    else if (v.isJunction) {
        for (let i = 0; i < v.peg.length; i++) {
            h = (h ^ valHash(v.peg[i])) * 16777619;
        }
        h = (h ^ (v.isDisjunct ? 789 : 321)) | 0;
    }
    else if (v.isRef) {
        for (let i = 0; i < v.peg.length; i++) {
            const p = v.peg[i];
            if ('string' === typeof p) {
                for (let j = 0; j < p.length; j++)
                    h = (h ^ p.charCodeAt(j)) * 16777619;
            }
        }
        h = (h ^ 654) | 0;
    }
    else if (v.isPref && v.peg?.isVal) {
        h = (h ^ valHash(v.peg)) * 16777619;
        h = (h ^ 987) | 0;
    }
    else {
        h = v.id | 0;
    }
    h = h | 0; // ensure 32-bit int
    if (v.done)
        v._fingerprint = h;
    return h;
}
//# sourceMappingURL=MapVal.js.map