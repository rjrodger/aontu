"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const err_1 = require("../err");
const top_1 = require("./top");
const ConjunctVal_1 = require("./ConjunctVal");
const BagVal_1 = require("./BagVal");
class ListVal extends BagVal_1.BagVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isList = true;
        if (null == this.peg) {
            throw new err_1.AontuError('ListVal spec.peg undefined');
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
    unify(peer, ctx) {
        const TOP = (0, top_1.top)();
        peer = peer ?? TOP;
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'List', this, peer);
        let done = true;
        let exit = false;
        // NOTE: not a clone! needs to be constructed.
        let out = (peer.isTop ? this : new ListVal({ peg: [] }, ctx));
        out.closed = this.closed;
        out.optionalKeys = [...this.optionalKeys];
        out.spread.cj = this.spread.cj;
        out.site = this.site;
        out.from = this.from;
        if (peer instanceof ListVal) {
            if (!this.closed && peer.closed) {
                out = peer.unify(this, ctx.clone({ explain: (0, utility_1.ec)(te, 'PMC') }));
                exit = true;
            }
            else {
                out.closed = out.closed || peer.closed;
                out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                    (0, unify_1.unite)(ctx.clone({ explain: (0, utility_1.ec)(te, 'SPR') }), out.spread.cj, peer.spread.cj, 'list-peer')));
            }
        }
        if (!exit) {
            out.dc = this.dc + 1;
            let spread_cj = out.spread.cj || TOP;
            // Always unify children first
            for (let key in this.peg) {
                const keyctx = ctx.descend(key);
                const key_spread_cj = spread_cj.clone(keyctx);
                const child = this.peg[key];
                (0, utility_1.propagateMarks)(this, child);
                out.peg[key] =
                    undefined === child ? key_spread_cj :
                        child.isNil ? child :
                            key_spread_cj.isNil ? key_spread_cj :
                                key_spread_cj.isTop && child.done ? child :
                                    child.isTop && key_spread_cj.done ? key_spread_cj :
                                        (0, unify_1.unite)(keyctx.clone({ explain: (0, utility_1.ec)(te, 'PEG:' + key) }), child, key_spread_cj, 'list-own');
                done = (done && type_1.DONE === out.peg[key].dc);
            }
            const allowedKeys = this.closed ? Object.keys(this.peg) : [];
            let bad = undefined;
            if (peer instanceof ListVal) {
                let upeer = (0, unify_1.unite)(ctx.clone({ explain: (0, utility_1.ec)(te, 'PER') }), peer, TOP, 'list-peer-list');
                // NOTE: peerkey is the index
                for (let peerkey in upeer.peg) {
                    let peerchild = upeer.peg[peerkey];
                    if (this.closed && !allowedKeys.includes(peerkey)) {
                        bad = (0, err_1.makeNilErr)(ctx, 'closed', peerchild, undefined);
                    }
                    let child = out.peg[peerkey];
                    let oval = out.peg[peerkey] =
                        undefined === child ? peerchild :
                            child.isTop && peerchild.done ? peerchild :
                                child.isNil ? child :
                                    peerchild.isNil ? peerchild :
                                        (0, unify_1.unite)(ctx.descend(peerkey).clone({ explain: (0, utility_1.ec)(te, 'CHD') }), child, peerchild, 'list-peer');
                    if (this.spread.cj) {
                        let key_ctx = ctx.descend(peerkey);
                        let key_spread_cj = spread_cj.clone(key_ctx);
                        oval = out.peg[peerkey] =
                            (0, unify_1.unite)(key_ctx.clone({ explain: (0, utility_1.ec)(te, 'PSP:' + peerkey) }), out.peg[peerkey], key_spread_cj, 'list-spread');
                        oval.from = spread_cj;
                    }
                    (0, utility_1.propagateMarks)(this, oval);
                    done = (done && type_1.DONE === oval.dc);
                }
            }
            else if (!peer.isTop) {
                out = (0, err_1.makeNilErr)(ctx, 'list', this, peer);
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
        if (out.isBag) {
            out.from = this.from;
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
}
exports.ListVal = ListVal;
//# sourceMappingURL=ListVal.js.map