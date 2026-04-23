"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const err_1 = require("../err");
const top_1 = require("./top");
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
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        // console.log('MAPVAL-UNIFY', this.id, this.canon, peer.id, peer.canon)
        const TOP = (0, top_1.top)();
        peer = peer ?? TOP;
        // Fast path: both maps done, no spreads, peer's keys are a
        // subset of this's keys with the same child references, and
        // neither side has type/hide marks. No new information.
        if (this.done && peer instanceof MapVal && peer.done
            && 0 === peer._spread.length && 0 === this._spread.length
            && !this.mark.type && !this.mark.hide
            && !peer.mark.type && !peer.mark.hide) {
            let canSkip = true;
            for (const k in peer.peg) {
                if (this.peg[k] !== peer.peg[k]) {
                    canSkip = false;
                    break;
                }
            }
            if (canSkip)
                return this;
        }
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Map', this, peer);
        let done = true;
        let exit = false;
        // NOTE: not a clone! needs to be constructed.
        let out = (peer.isTop ? this : new MapVal({ peg: {} }, ctx));
        out.closed = this.closed;
        out.optionalKeys = 0 < this.optionalKeys.length ? [...this.optionalKeys] : this.optionalKeys;
        out.site = this.site;
        if (0 < this._spread.length)
            out._spread = this._spread;
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
        }
        if (!exit) {
            out.dc = this.dc + 1;
            // Fast path: self-unify with TOP.
            // If all children are already done, the map is fully converged.
            if (peer.isTop) {
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
            // Unify own children
            for (let key in this.peg) {
                const child = this.peg[key];
                const keyctx = ctx.descend(key);
                (0, utility_1.propagateMarks)(this, child);
                out.peg[key] =
                    undefined === child ? (0, top_1.top)() :
                        child.isNil ? child :
                            child.done ? child :
                                (0, unify_1.unite)(te ? keyctx.clone({ explain: (0, utility_1.ec)(te, 'KEY:' + key) }) : keyctx, child, (0, top_1.top)(), 'map-own');
                done = (done && type_1.DONE === out.peg[key].dc);
            }
            let bad = undefined;
            if (peer instanceof MapVal) {
                let upeer = peer.done ? peer : (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PER') }) : ctx, peer, TOP, 'map-peer-map');
                for (let peerkey in upeer.peg) {
                    let peerchild = upeer.peg[peerkey];
                    if (this.closed && !(peerkey in this.peg)) {
                        bad = (0, err_1.makeNilErr)(ctx, 'closed', peerchild, undefined);
                    }
                    // key optionality is additive
                    if (0 < upeer.optionalKeys.length
                        && upeer.optionalKeys.includes(peerkey)
                        && !out.optionalKeys.includes(peerkey)) {
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
                    // Propagate _spread from child to result so spreads
                    // survive nested merges via ref copies.
                    if (child?._spread?.length > 0 && oval?.isBag && !oval._spread?.length) {
                        oval._spread = child._spread;
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
                // Apply inherited spreads to new peer keys.
                // _spread is set by SpreadVal after application and
                // inherited by BagVal.clone during ref resolution.
                if (0 < this._spread.length && peer instanceof MapVal) {
                    for (const sv of this._spread) {
                        for (const peerkey in peer.peg) {
                            if (!(peerkey in this.peg)) {
                                // New key from peer — apply each spread
                                const peerctx = ctx.descend(peerkey);
                                let key_spread = sv.peg.spreadClone(peerctx);
                                if (!key_spread.done) {
                                    key_spread = (0, unify_1.unite)(peerctx, key_spread, (0, top_1.top)(), 'spread-reapply-resolve');
                                }
                                const child = out.peg[peerkey];
                                if (child && !child.isNil && !key_spread.isTop) {
                                    out.peg[peerkey] = (0, unify_1.unite)(te ? peerctx.clone({ explain: (0, utility_1.ec)(te, 'SRA:' + peerkey) }) : peerctx, child, key_spread, 'spread-reapply');
                                    done = done && (type_1.DONE === out.peg[peerkey].dc);
                                }
                            }
                        }
                    }
                    ;
                    out._spread = this._spread;
                }
                out.dc = done ? type_1.DONE : out.dc;
                (0, utility_1.propagateMarks)(peer, out);
                (0, utility_1.propagateMarks)(this, out);
            }
        }
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    // Optimized clone for use as a spread constraint: share
    // path-independent children, clone only path-dependent ones.
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
                const wrapper = Object.create(child);
                wrapper.mark = { ...child.mark };
                out.peg[entry[0]] = wrapper;
            }
            else {
                out.peg[entry[0]] = child;
            }
        }
        out.closed = this.closed;
        out.optionalKeys = 0 < this.optionalKeys.length ? [...this.optionalKeys] : this.optionalKeys;
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1]?.isVal ?
                    entry[1].clone(ctx, {
                        mark: spec?.mark ?? {},
                        path: [...out.path, entry[0]]
                    }) :
                    entry[1];
        }
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        return out;
    }
    get canon() {
        if (this._canonCache !== undefined)
            return this._canonCache;
        let keys = Object.keys(this.peg);
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
            '}';
        if (this.done)
            this._canonCache = c;
        return c;
    }
    inspection(_d) {
        return '';
    }
}
exports.MapVal = MapVal;
//# sourceMappingURL=MapVal.js.map