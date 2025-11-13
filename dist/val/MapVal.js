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
const Val_1 = require("./Val");
class MapVal extends BagVal_1.BagVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMap = true;
        this.spread = {
            cj: undefined,
        };
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
        // TODO: some spreads (no path refs etc) could self unified
        /*
        if (out.spread.cj && !out.spread.cj.mark._self_unified) {
          // console.log('MAPVAL-SPR-START', out.spread.cj.mark)
          out.spread.cj = out.spread.cj.unify(TOP, ctx.clone({ explain: ec(te, 'SPR-SELF-UNIFY') }))
          out.spread.cj.mark._self_unified = true
          // console.log('MAPVAL-SU', out.spread.cj.id, out.spread.cj.canon, out.spread.cj.done)
        }
        */
        if (peer instanceof MapVal) {
            // console.log('MAPVAL-PEER-MAPVAL', this.id, this.canon, this.done, peer.id, peer.canon, peer.done)
            if (!this.closed && peer.closed) {
                out = peer.unify(this, ctx.clone({ explain: (0, utility_1.ec)(te, 'PMC') }));
                exit = true;
            }
            // ensure determinism of unification
            else if (this.closed && peer.closed) {
                const peerkeys = Object.keys(peer.peg);
                const selfkeys = Object.keys(this.peg);
                if (peerkeys.length < selfkeys.length
                    || (peerkeys.length === selfkeys.length
                        && peerkeys.join('~') < selfkeys.join('~'))) {
                    out = peer.unify(this, ctx.clone({ explain: (0, utility_1.ec)(te, 'SPC') }));
                    exit = true;
                }
            }
            if (!exit) {
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                    (0, unify_1.unite)(ctx.clone({ explain: (0, utility_1.ec)(te, 'SPR') }), out.spread.cj, peer.spread.cj, 'map-self')));
            }
        }
        else {
            // console.log('MAPVAL-PEER-OTHER', this.id, this.canon, this.done, peer.id, peer.canon, peer.done)
        }
        if (!exit) {
            out.dc = this.dc + 1;
            // let newtype = this.type || peer.type
            let spread_cj = out.spread.cj ?? TOP;
            // Always unify own children first
            for (let key in this.peg) {
                const keyctx = ctx.descend(key);
                const key_spread_cj = spread_cj.clone(keyctx);
                // console.log('MAPVAL-SPREAD', this.id, key, key_spread_cj.id, key_spread_cj.canon, key_spread_cj.done)
                const child = this.peg[key];
                (0, utility_1.propagateMarks)(this, child);
                out.peg[key] =
                    undefined === child ? key_spread_cj :
                        child.isNil ? child :
                            key_spread_cj.isNil ? key_spread_cj :
                                key_spread_cj.isTop && child.done ? child :
                                    child.isTop && key_spread_cj.done ? key_spread_cj :
                                        (0, unify_1.unite)(keyctx.clone({ explain: (0, utility_1.ec)(te, 'KEY:' + key) }), child, key_spread_cj, 'map-own');
                done = (done && type_1.DONE === out.peg[key].dc);
            }
            const allowedKeys = this.closed ? Object.keys(this.peg) : [];
            let bad = undefined;
            if (peer instanceof MapVal) {
                let upeer = (0, unify_1.unite)(ctx.clone({ explain: (0, utility_1.ec)(te, 'PER') }), peer, TOP, 'map-peer-map');
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
                    let oval = out.peg[peerkey] =
                        undefined === child ? peerchild :
                            child.isTop && peerchild.done ? peerchild :
                                child.isNil ? child :
                                    peerchild.isNil ? peerchild :
                                        (0, unify_1.unite)(ctx.descend(peerkey).clone({ explain: (0, utility_1.ec)(te, 'CHD') }), child, peerchild, 'map-peer');
                    if (this.spread.cj) {
                        let key_ctx = ctx.descend(peerkey);
                        let key_spread_cj = spread_cj.clone(key_ctx);
                        // console.log('MAPVAL-PEER-SPR', peerkey, key_spread_cj.id, key_spread_cj.canon, key_spread_cj.done)
                        oval = out.peg[peerkey] =
                            (0, unify_1.unite)(key_ctx.clone({ explain: (0, utility_1.ec)(te, 'PSP:' + peerkey) }), oval, key_spread_cj, 'map-peer-spread');
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
            '}'; // + '<' + (this.mark.hide ? 'H' : '') + '>'
    }
    inspection(d) {
        return this.spread.cj ? '&:' + this.spread.cj.inspect(null == d ? 0 : d + 1) : '';
    }
    gen(ctx) {
        let out = {};
        if (this.mark.type || this.mark.hide) {
            return undefined;
        }
        for (let p in this.peg) {
            const child = this.peg[p];
            if (child.mark.type || child.mark.hide) {
                continue;
            }
            const optional = this.optionalKeys.includes(p);
            if (child.isScalar
                || child.isMap
                || child.isList
                || child.isPref
                || child.isRef
                || child.isDisjunct
                || child.isNil) {
                const cval = child.gen(ctx);
                if (optional && (0, Val_1.empty)(cval)) {
                    continue;
                }
                out[p] = cval;
            }
            else if (!optional) {
                (0, err_1.makeNilErr)(ctx, this.closed ? 'mapval_required' : 'mapval_no_gen', child, undefined);
                break;
            }
            // else optional so we can ignore it
        }
        return out;
    }
}
exports.MapVal = MapVal;
//# sourceMappingURL=MapVal.js.map