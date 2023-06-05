"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
const Nil_1 = require("../val/Nil");
const ValBase_1 = require("../val/ValBase");
class MapVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('MapVal spec.peg undefined');
        }
        let spread = this.peg[MapVal.SPREAD];
        delete this.peg[MapVal.SPREAD];
        // console.log('MC', this.id, peg, spread)
        if (spread) {
            if ('&' === spread.o) {
                let tmv = Array.isArray(spread.v) ? spread.v : [spread.v];
                this.spread.cj = new ConjunctVal_1.ConjunctVal({ peg: tmv }, ctx);
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        // let mark = Math.random()
        let done = true;
        let out = val_1.TOP === peer ? this : new MapVal({ peg: {} }, ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof MapVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                new ConjunctVal_1.ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)));
        }
        out.done = this.done + 1;
        let spread_cj = out.spread.cj || val_1.TOP;
        // Always unify own children first
        for (let key in this.peg) {
            let keyctx = ctx.descend(key);
            let key_spread_cj = spread_cj.clone(null, keyctx);
            // console.log('M0', this.id, mark, Object.keys(this.peg).join('~'),
            //   'p=', this.path.join('.'),
            //   'k=', key, peer.top || peer.constructor.name,
            //   'pp=', this.peg[key].path.join('.'),
            //   this.peg[key].canon,
            //   'sp=', key_spread_cj.path.join('.'),
            //   key_spread_cj.canon)
            // if (1000000000 === this.id) {
            //   console.dir(key_spread_cj, { depth: null })
            // }
            out.peg[key] = (0, op_1.unite)(keyctx, this.peg[key], key_spread_cj, 'map-own');
            done = (done && type_1.DONE === out.peg[key].done);
        }
        if (peer instanceof MapVal) {
            let upeer = (0, op_1.unite)(ctx, peer, undefined, 'map-peer-map');
            for (let peerkey in upeer.peg) {
                // console.log('M1', this.id, mark, Object.keys(this.peg).join('~'),
                //   'pk=', peerkey)
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil_1.Nil ? child :
                            peerchild instanceof Nil_1.Nil ? peerchild :
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild, 'map-peer');
                if (this.spread.cj) {
                    let key_ctx = ctx.descend(peerkey);
                    let key_spread_cj = spread_cj.clone(null, key_ctx);
                    out.peg[peerkey] =
                        new ConjunctVal_1.ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx);
                    done = false;
                }
                else {
                    done = (done && type_1.DONE === oval.done);
                }
            }
        }
        else if (val_1.TOP !== peer) {
            return Nil_1.Nil.make(ctx, 'map', this, peer);
        }
        out.done = done ? type_1.DONE : out.done;
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1] instanceof ValBase_1.ValBase ? entry[1].clone(null, ctx) : entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(null, ctx);
        }
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return '{' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
            '}';
    }
    gen(ctx) {
        let out = {};
        for (let p in this.peg) {
            out[p] = this.peg[p].gen(ctx);
        }
        // if (0 === Object.keys(out).length) {
        //   console.log('MapVal-gen 0', this.path, this.done)
        // }
        return out;
    }
}
exports.MapVal = MapVal;
MapVal.SPREAD = Symbol('spread');
//# sourceMappingURL=MapVal.js.map