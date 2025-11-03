"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const TopVal_1 = require("./TopVal");
const ConjunctVal_1 = require("./ConjunctVal");
const NilVal_1 = require("./NilVal");
const BagVal_1 = require("./BagVal");
class ListVal extends BagVal_1.BagVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isList = true;
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('ListVal spec.peg undefined');
        }
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
                // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
                // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx, explain) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, explain, 'List', this, peer);
        let done = true;
        let exit = false;
        // NOTE: not a clone! needs to be constructed.
        let out = (peer.isTop ? this : new ListVal({ peg: [] }, ctx));
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        out.spread.cj = this.spread.cj;
        if (peer instanceof ListVal) {
            if (!this.closed && peer.closed) {
                out = peer.unify(this, ctx, explain && (0, utility_1.ec)(te, 'PMC'));
                exit = true;
            }
            else {
                out.closed = out.closed || peer.closed;
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                    (0, unify_1.unite)(ctx, out.spread.cj, peer.spread.cj, 'list-peer', (0, utility_1.ec)(te, 'SPR'))));
            }
        }
        if (!exit) {
            out.dc = this.dc + 1;
            // if (this.spread.cj) {
            //   out.spread.cj =
            //     DONE !== this.spread.cj.dc ? unite(ctx, this.spread.cj) :
            //       this.spread.cj
            // }
            let spread_cj = out.spread.cj || TopVal_1.TOP;
            // Always unify children first
            for (let key in this.peg) {
                let keyctx = ctx.descend(key);
                let key_spread_cj = spread_cj.clone(keyctx);
                out.peg[key] = (0, unify_1.unite)(keyctx, this.peg[key], key_spread_cj, 'list-own', (0, utility_1.ec)(te, 'PEG:' + key));
                done = (done && type_1.DONE === out.peg[key].dc);
            }
            const allowedKeys = this.closed ? Object.keys(this.peg) : [];
            let bad = undefined;
            if (peer instanceof ListVal) {
                let upeer = (0, unify_1.unite)(ctx, peer, TopVal_1.TOP, 'list-peer-list', (0, utility_1.ec)(te, 'PER'));
                // NOTE: peerkey is the index
                for (let peerkey in upeer.peg) {
                    let peerchild = upeer.peg[peerkey];
                    if (this.closed && !allowedKeys.includes(peerkey)) {
                        bad = NilVal_1.NilVal.make(ctx, 'closed', peerchild, undefined);
                    }
                    let child = out.peg[peerkey];
                    let oval = out.peg[peerkey] =
                        undefined === child ? peerchild :
                            child.isNil ? child :
                                peerchild.isNil ? peerchild :
                                    (0, unify_1.unite)(ctx.descend(peerkey), child, peerchild, 'list-peer', (0, utility_1.ec)(te, 'CHD'));
                    if (this.spread.cj) {
                        let key_ctx = ctx.descend(peerkey);
                        let key_spread_cj = spread_cj.clone(key_ctx);
                        // out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
                        oval = out.peg[peerkey] =
                            // new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
                            // done = false
                            (0, unify_1.unite)(key_ctx, out.peg[peerkey], key_spread_cj, 'list-spread', (0, utility_1.ec)(te, 'PSP:' + peerkey));
                    }
                    done = (done && type_1.DONE === oval.dc);
                }
            }
            // else if (TOP !== peer) {
            else if (!peer.isTop) {
                out = NilVal_1.NilVal.make(ctx, 'list', this, peer);
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
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1]?.isVal ? entry[1].clone(ctx, spec?.mark ? { mark: spec.mark } : {}) : entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(ctx, spec?.mark ? { mark: spec.mark } : {});
        }
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        // console.log('LISTVAL-CLONE', this.canon, '->', out.canon)
        return out;
    }
    get canon() {
        // console.log('LISTVAL-CANON', this.optionalKeys)
        let keys = Object.keys(this.peg);
        return '' +
            // this.errcanon() +
            '[' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                .map(k => this.optionalKeys.includes(k) ?
                k + '?:' + this.peg[k].canon :
                this.peg[k].canon).join(',') +
            ']';
    }
    gen(ctx) {
        let out = [];
        if (this.mark.type || this.mark.hide) {
            return undefined;
        }
        // console.log('LISTVAL-GEN', this.optionalKeys)
        for (let i = 0; i < this.peg.length; i++) {
            let val = this.peg[i].gen(ctx);
            if (undefined === val) {
                if (!this.optionalKeys.includes('' + i)) {
                    return NilVal_1.NilVal.make(ctx, 'required_listelem', this.peg[i], undefined);
                }
            }
            else {
                out.push(val);
            }
        }
        return out;
    }
}
exports.ListVal = ListVal;
//# sourceMappingURL=ListVal.js.map