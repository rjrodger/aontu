"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
const Nil_1 = require("../val/Nil");
const ValBase_1 = require("../val/ValBase");
class ListVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('ListVal spec.peg undefined');
        }
        let spread = this.peg[ListVal.SPREAD];
        delete this.peg[ListVal.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    Array.isArray(spread.v) ?
                        1 < spread.v.length ?
                            new ConjunctVal_1.ConjunctVal({ peg: spread.v }, ctx) :
                            spread.v :
                        spread.v;
                // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
                // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        let done = true;
        let out = val_1.TOP === peer ? this : new ListVal({ peg: [] }, ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof ListVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                new ConjunctVal_1.ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)));
        }
        out.done = this.done + 1;
        // if (this.spread.cj) {
        //   out.spread.cj =
        //     DONE !== this.spread.cj.done ? unite(ctx, this.spread.cj) :
        //       this.spread.cj
        // }
        let spread_cj = out.spread.cj || val_1.TOP;
        // Always unify children first
        for (let key in this.peg) {
            let keyctx = ctx.descend(key);
            let key_spread_cj = spread_cj.clone(null, keyctx);
            out.peg[key] = (0, op_1.unite)(keyctx, this.peg[key], key_spread_cj, 'list-own');
            done = (done && type_1.DONE === out.peg[key].done);
        }
        if (peer instanceof ListVal) {
            let upeer = (0, op_1.unite)(ctx, peer, undefined, 'list-peer-list');
            // NOTE: peerkey is the index
            for (let peerkey in upeer.peg) {
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil_1.Nil ? child :
                            peerchild instanceof Nil_1.Nil ? peerchild :
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild, 'list-peer');
                if (this.spread.cj) {
                    let key_ctx = ctx.descend(peerkey);
                    let key_spread_cj = spread_cj.clone(null, key_ctx);
                    // out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
                    out.peg[peerkey] =
                        new ConjunctVal_1.ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx);
                    done = false;
                }
                done = (done && type_1.DONE === oval.done);
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
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(null, ctx);
        }
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return '[' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                // NOTE: handle array non-index key vals
                // .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
                .map(k => [this.peg[k].canon]).join(',') +
            ']';
    }
    gen(ctx) {
        let out = this.peg.map((v) => v.gen(ctx));
        // for (let p in this.peg) {
        //   out[p] = this.peg[p].gen(ctx)
        // }
        return out;
    }
}
exports.ListVal = ListVal;
ListVal.SPREAD = Symbol('spread');
//# sourceMappingURL=ListVal.js.map