"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const ValBase_1 = require("../val/ValBase");
const Nil_1 = require("./Nil");
const ConjunctVal_1 = require("./ConjunctVal");
class MapVal extends ValBase_1.ValBase {
    constructor(peg, ctx) {
        super(peg, ctx);
        this.spread = {
            cj: undefined,
        };
        let spread = this.peg[MapVal.SPREAD];
        delete this.peg[MapVal.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    new ConjunctVal_1.ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx);
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        // if (null == ctx) {
        //   console.trace()
        // }
        let done = true;
        let out = type_1.TOP === peer ? this : new MapVal({}, ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof MapVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj = new ConjunctVal_1.ConjunctVal([out.spread.cj, peer.spread.cj], ctx)));
        }
        out.done = this.done + 1;
        if (this.spread.cj) {
            out.spread.cj =
                type_1.DONE !== this.spread.cj.done ? (0, op_1.unite)(ctx, this.spread.cj) :
                    this.spread.cj;
            done = (done && type_1.DONE === out.spread.cj.done);
        }
        let spread_cj = out.spread.cj || type_1.TOP;
        // Always unify children first
        for (let key in this.peg) {
            // console.log('MAP ukA', key, this.peg[key].canon)
            out.peg[key] =
                (0, op_1.unite)(ctx.descend(key), this.peg[key], spread_cj);
            // console.log('MAP ukB', key, out.peg[key].canon)
            done = (done && type_1.DONE === out.peg[key].done);
        }
        if (peer instanceof MapVal) {
            let upeer = (0, op_1.unite)(ctx, peer);
            for (let peerkey in upeer.peg) {
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil_1.Nil ? child :
                            peerchild instanceof Nil_1.Nil ? peerchild :
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild);
                if (this.spread.cj) {
                    out.peg[peerkey] = (0, op_1.unite)(ctx, out.peg[peerkey], spread_cj);
                }
                done = (done && type_1.DONE === oval.done);
            }
        }
        else if (type_1.TOP !== peer) {
            return Nil_1.Nil.make(ctx, 'map', this, peer);
        }
        out.done = done ? type_1.DONE : out.done;
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
        return out;
    }
}
exports.MapVal = MapVal;
MapVal.SPREAD = Symbol('spread');
//# sourceMappingURL=MapVal.js.map