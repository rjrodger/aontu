"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const valutil_1 = require("./valutil");
const ConjunctVal_1 = require("./ConjunctVal");
const NilVal_1 = require("./NilVal");
const BagVal_1 = require("./BagVal");
class MapVal extends BagVal_1.BagVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMap = true;
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('MapVal spec.peg undefined');
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
    unify(peer, ctx, explain) {
        peer = peer ?? (0, valutil_1.top)();
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, explain, 'Map', this, peer);
        let done = true;
        let exit = false;
        // to(trace, 'V=map', sc, pc]
        // const te = ['V=map', sc, pc, null, '', []]
        // trace?.push(te)
        // NOTE: not a clone! needs to be constructed.
        let out = (peer.isTop ? this : new MapVal({ peg: {} }, ctx));
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        out.spread.cj = this.spread.cj;
        if (peer instanceof MapVal) {
            if (!this.closed && peer.closed) {
                out = peer.unify(this, ctx, explain && (0, utility_1.ec)(te, 'PMC'));
                exit = true;
            }
            // ensure determinism of unification
            else if (this.closed && peer.closed) {
                const peerkeys = Object.keys(peer.peg);
                const selfkeys = Object.keys(this.peg);
                if (peerkeys.length < selfkeys.length
                    || (peerkeys.length === selfkeys.length
                        && peerkeys.join('~') < selfkeys.join('~'))) {
                    out = peer.unify(this, ctx, (0, utility_1.ec)(te, 'SPC'));
                    exit = true;
                }
            }
            if (!exit) {
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                    (0, unify_1.unite)(ctx, out.spread.cj, peer.spread.cj, 'map-self', (0, utility_1.ec)(te, 'SPR'))));
            }
        }
        if (!exit) {
            out.dc = this.dc + 1;
            // let newtype = this.type || peer.type
            let spread_cj = out.spread.cj ?? (0, valutil_1.top)();
            // Always unify own children first
            for (let key in this.peg) {
                let keyctx = ctx.descend(key);
                let key_spread_cj = spread_cj.clone(keyctx);
                // this.peg[key].mark.type = newtype = this.peg[key].mark.type || newtype
                (0, utility_1.propagateMarks)(this, this.peg[key]);
                // let t0 = tr(te, 'PEG:' + key)
                // console.log('MAPVAL-peg', key, te)
                out.peg[key] =
                    // unite(keyctx, this.peg[key], key_spread_cj, 'map-own', tr(te, 'PEG'))
                    (0, unify_1.unite)(keyctx, this.peg[key], key_spread_cj, 'map-own', (0, utility_1.ec)(te, 'PEG:' + key));
                // out.peg[key].mark.type = newtype = out.peg[key].mark.type || newtype
                done = (done && type_1.DONE === out.peg[key].dc);
                // console.log('MAPVAL-OWN', this.id, this.mark.type, 'k=' + key, this.peg[key].canon, key_spread_cj.canon, '->', out.peg[key].canon)
            }
            const allowedKeys = this.closed ? Object.keys(this.peg) : [];
            let bad = undefined;
            if (peer instanceof MapVal) {
                // QQQ
                // let upeer: MapVal = (unite(ctx, peer, undefined, 'map-peer-map', tr(te, 'PER')) as MapVal)
                let upeer = (0, unify_1.unite)(ctx, peer, (0, valutil_1.top)(), 'map-peer-map', (0, utility_1.ec)(te, 'PER'));
                for (let peerkey in upeer.peg) {
                    let peerchild = upeer.peg[peerkey];
                    if (this.closed && !allowedKeys.includes(peerkey)) {
                        bad = NilVal_1.NilVal.make(ctx, 'closed', peerchild, undefined);
                    }
                    // key optionality is additive
                    if (upeer.optionalKeys.includes(peerkey) && !out.optionalKeys.includes(peerkey)) {
                        out.optionalKeys.push(peerkey);
                    }
                    let child = out.peg[peerkey];
                    let oval = out.peg[peerkey] =
                        undefined === child ? peerchild :
                            child.isNil ? child :
                                peerchild.isNil ? peerchild :
                                    (0, unify_1.unite)(ctx.descend(peerkey), child, peerchild, 'map-peer', (0, utility_1.ec)(te, 'CHD'));
                    if (this.spread.cj) {
                        let key_ctx = ctx.descend(peerkey);
                        let key_spread_cj = spread_cj.clone(key_ctx);
                        oval = out.peg[peerkey] =
                            // unite(key_ctx, out.peg[peerkey], key_spread_cj, 'map-peer-spread')
                            (0, unify_1.unite)(key_ctx, oval, key_spread_cj, 'map-peer-spread', (0, utility_1.ec)(te, 'PSP:' + peerkey));
                    }
                    (0, utility_1.propagateMarks)(this, oval);
                    // console.log('MAPVAL-PEER', peerkey, child?.canon, peerchild?.canon, '->', oval)
                    done = (done && type_1.DONE === oval.dc);
                }
            }
            else if (!peer.isTop) {
                out = NilVal_1.NilVal.make(ctx, 'map', this, peer);
            }
            if (null != bad) {
                out = bad;
            }
            if (!out.isNil) {
                out.uh.push(peer.id);
                out.dc = done ? type_1.DONE : out.dc;
                (0, utility_1.propagateMarks)(peer, out);
                (0, utility_1.propagateMarks)(this, out);
            }
        }
        // console.log('MAPVAL-OUT', this.id, this.closed, this.canon, 'P=', (peer as any).closed, peer.canon, '->', (out as any).closed, out.canon)
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1]?.isVal ? entry[1].clone(ctx, spec?.mark ? { mark: spec.mark } : {}) : entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {});
        }
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        // console.log('MAPVAL-CLONE', this.canon, '->', out.canon)
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
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
            '}';
    }
    inspection(inspect) {
        return this.spread.cj ? '&:' + inspect(this.spread.cj) : '';
    }
    gen(ctx) {
        let out = {};
        if (this.mark.type || this.mark.hide) {
            return undefined;
        }
        for (let p in this.peg) {
            if (this.peg[p].mark.type || this.peg[p].mark.hide) {
                continue;
            }
            let val = this.peg[p].gen(ctx);
            if (undefined === val) {
                if (!this.optionalKeys.includes(p)) {
                    return NilVal_1.NilVal.make(ctx, 'required_mapkey', this.peg[p], undefined);
                }
            }
            else {
                out[p] = val;
            }
        }
        return out;
    }
}
exports.MapVal = MapVal;
//# sourceMappingURL=MapVal.js.map