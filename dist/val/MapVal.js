"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const val_1 = require("../val");
const ConjunctVal_1 = require("./ConjunctVal");
const NilVal_1 = require("./NilVal");
const BaseVal_1 = require("./BaseVal");
class MapVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMapVal = true;
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('MapVal spec.peg undefined');
        }
        this.type = !!spec.type;
        let spread = this.peg[MapVal.SPREAD];
        delete this.peg[MapVal.SPREAD];
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
        // let mark = Math.random()
        let done = true;
        // let out: MapVal = TOP === peer ? this : new MapVal({ peg: {} }, ctx)
        let out = peer.isTop ? this : new MapVal({ peg: {} }, ctx);
        // console.log('MAPVAL-START', this.id, this.canon, peer.canon, '->', out.canon)
        out.spread.cj = this.spread.cj;
        if (peer instanceof MapVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                (0, unify_1.unite)(ctx, out.spread.cj, peer.spread.cj, 'map-self')));
        }
        out.dc = this.dc + 1;
        // let newtype = this.type || peer.type
        let spread_cj = out.spread.cj ?? val_1.TOP;
        // Always unify own children first
        for (let key in this.peg) {
            let keyctx = ctx.descend(key);
            let key_spread_cj = spread_cj.clone(keyctx);
            // this.peg[key].type = newtype = this.peg[key].type || newtype
            this.peg[key].type = this.peg[key].type || this.type;
            out.peg[key] = (0, unify_1.unite)(keyctx, this.peg[key], key_spread_cj, 'map-own');
            // out.peg[key].type = newtype = out.peg[key].type || newtype
            done = (done && type_1.DONE === out.peg[key].dc);
            // console.log('MAPVAL-OWN', this.id, this.type, 'k=' + key, this.peg[key].canon, key_spread_cj.canon, '->', out.peg[key].canon)
        }
        if (peer instanceof MapVal) {
            let upeer = (0, unify_1.unite)(ctx, peer, undefined, 'map-peer-map');
            for (let peerkey in upeer.peg) {
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof NilVal_1.NilVal ? child :
                            peerchild instanceof NilVal_1.NilVal ? peerchild :
                                (0, unify_1.unite)(ctx.descend(peerkey), child, peerchild, 'map-peer');
                if (this.spread.cj) {
                    let key_ctx = ctx.descend(peerkey);
                    let key_spread_cj = spread_cj.clone(key_ctx);
                    oval = out.peg[peerkey] =
                        // unite(key_ctx, out.peg[peerkey], key_spread_cj, 'map-peer-spread')
                        (0, unify_1.unite)(key_ctx, oval, key_spread_cj, 'map-peer-spread');
                }
                oval.type = this.type || oval.type;
                // console.log('MAPVAL-PEER', peerkey, child?.canon, peerchild?.canon, '->', oval)
                done = (done && type_1.DONE === oval.dc);
            }
        }
        // else if (TOP !== peer) {
        else if (!peer.isTop) {
            return NilVal_1.NilVal.make(ctx, 'map', this, peer);
        }
        out.uh.push(peer.id);
        out.dc = done ? type_1.DONE : out.dc;
        out.type = this.type || peer.type;
        // console.log('MAPVAL-OUT', this.id, this.canon, peer.canon, '->', out.canon)
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1] instanceof BaseVal_1.BaseVal ? entry[1].clone(ctx, { type: spec?.type }) : entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(ctx, { type: spec?.type });
        }
        // console.log('MAPVAL-CLONE', this.canon, '->', out.canon)
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return this.errcanon() +
            // (this.type ? '<type>' : '') +
            // (this.id + '=') +
            '{' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
            '}';
    }
    gen(ctx) {
        let out = {};
        if (this.type) {
            // out.$TYPE = true
            return undefined;
        }
        for (let p in this.peg) {
            out[p] = this.peg[p].gen(ctx);
        }
        return out;
    }
}
exports.MapVal = MapVal;
MapVal.SPREAD = Symbol('spread');
//# sourceMappingURL=MapVal.js.map