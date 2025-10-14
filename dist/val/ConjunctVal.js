"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConjunctVal = void 0;
exports.norm = norm;
const type_1 = require("../type");
const unify_1 = require("../unify");
const val_1 = require("../val");
const ListVal_1 = require("./ListVal");
const MapVal_1 = require("./MapVal");
const NilVal_1 = require("./NilVal");
const RefVal_1 = require("./RefVal");
const BaseVal_1 = require("./BaseVal");
const CONJUNCT_ORDERING = {
    PrefVal: 30000,
    RefVal: 32500,
    DisjunctVal: 35000,
    ConjunctVal: 40000,
    Any: 99999
};
// TODO: move main logic to op/conjunct
class ConjunctVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isBinaryOp = true;
        this.isConjunctVal = true;
        this.type = !!spec.type;
        this.peg = (Array.isArray(this.peg) ? this.peg : [])
            .filter((p) => null != p && p.isVal);
        this.peg?.map((v) => v.type = this.type || v.type);
        // console.log('CONJUNCT-ctor', this.peg.map((v: Val) => v.canon))
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        peer.type = this.type || peer.type;
        return this;
    }
    unify(peer, ctx) {
        const sc = this.canon;
        const pc = peer?.canon;
        const mark = (Math.random() * 1e7) % 1e6 | 0;
        let done = true;
        this.peg = norm(this.peg);
        // Unify each term of conjunct against peer
        let upeer = [];
        let newtype = this.type || peer.type;
        for (let vI = 0; vI < this.peg.length; vI++) {
            newtype = this.peg[vI].type || newtype;
        }
        for (let vI = 0; vI < this.peg.length; vI++) {
            this.peg[vI].type = newtype;
            // console.log('CONJUNCT-TERM', this.id, vI, this.peg[vI].canon)
            upeer[vI] = (0, unify_1.unite)(ctx, this.peg[vI], peer, 'cj-own' + mark);
            upeer[vI].type = newtype = newtype || upeer[vI].type;
            // let prevdone = done
            done = done && (type_1.DONE === upeer[vI].dc);
            if (upeer[vI] instanceof NilVal_1.NilVal) {
                return upeer[vI];
                // return Nil.make(
                //   ctx,
                //   '&peer[' + upeer[vI].canon + ',' + peer.canon + ']',
                //   this.peg[vI],
                //   peer
                // )
            }
        }
        upeer = norm(upeer);
        // Unify terms against each other
        let outvals = [];
        let val;
        let t0 = upeer[0];
        next_term: for (let pI = 0; pI < upeer.length; pI++) {
            if (type_1.DONE !== t0.dc) {
                let u0 = (0, unify_1.unite)(ctx, t0, val_1.TOP, 'cj-peer-t0');
                newtype = this.type || u0.type;
                if (type_1.DONE !== u0.dc
                    // Maps and Lists are still unified so that path refs will work
                    // TODO: || ListVal - test!
                    && !(u0 instanceof MapVal_1.MapVal
                        || u0 instanceof ListVal_1.ListVal
                        || u0 instanceof RefVal_1.RefVal)) {
                    outvals.push(u0);
                    continue next_term;
                }
                else {
                    t0 = u0;
                }
            }
            let t1 = upeer[pI + 1];
            if (null == t1) {
                outvals.push(t0);
                newtype = this.type || t0.type;
            }
            // Can't unite with a RefVal, unless also a RefVal with same path.
            else if (t0 instanceof RefVal_1.RefVal && !(t1 instanceof RefVal_1.RefVal)) {
                outvals.push(t0);
                t0 = t1;
            }
            else if (t1 instanceof RefVal_1.RefVal && !(t0 instanceof RefVal_1.RefVal)) {
                outvals.push(t0);
                t0 = t1;
            }
            else {
                val = (0, unify_1.unite)(ctx, t0, t1, 'cj-peer-t0t1');
                done = done && type_1.DONE === val.dc;
                newtype = this.type || val.type;
                // Unite was just a conjunt anyway, so discard.
                if (val instanceof ConjunctVal) {
                    outvals.push(t0);
                    t0 = t1;
                }
                else if (val instanceof NilVal_1.NilVal) {
                    return val;
                }
                else {
                    t0 = val;
                }
                // TODO: t0 should become this to avoid unnecessary repasses
                // outvals.push(val)
                // pI++
            }
        }
        let out;
        // console.log('CONJUCT-prepout', this.type, newtype, outvals.map((v: Val) => v.canon))
        if (0 === outvals.length) {
            // Empty conjuncts evaporate.
            out = val_1.TOP;
        }
        // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
        else if (1 === outvals.length) {
            out = outvals[0];
            out.type = newtype;
        }
        else {
            out = new ConjunctVal({ peg: outvals, type: newtype }, ctx);
        }
        out.dc = done ? type_1.DONE : this.dc + 1;
        // console.log('CONJUNCT-unify', this.id, sc, pc, '->', out.canon, 'D=' + out.dc, 'E=', this.err)
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        out.peg = this.peg.map((entry) => entry.clone(ctx, { type: spec?.type }));
        return out;
    }
    // TODO: need a well-defined val order so conjunt canon is always the same
    get canon() {
        return this.peg.map((v) => {
            return v.isBinaryOp && Array.isArray(v.peg) && 1 < v.peg.length ?
                '(' + v.canon + ')' : v.canon;
        }).join('&');
    }
    gen(ctx) {
        // Unresolved conjunct cannot be generated, so always an error.
        let nil = NilVal_1.NilVal.make(ctx, 'conjunct', this, // (formatPath(this.peg, this.absolute) as any),
        undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        // descErr(nil, ctx)
        if (null == ctx) {
            //   // ctx.err.push(nil)
            //   ctx.adderr(nil)
            // }
            // else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.ConjunctVal = ConjunctVal;
// Normalize Conjunct:
// - flatten child conjuncts
// - consistent sorting of terms
function norm(terms) {
    let expand = [];
    for (let tI = 0, pI = 0; tI < terms.length; tI++, pI++) {
        if (terms[tI] instanceof ConjunctVal) {
            expand.push(...terms[tI].peg);
            pI += terms[tI].peg.length - 1;
        }
        else {
            expand[pI] = terms[tI];
        }
    }
    // Consistent ordering ensures order independent unification.
    expand = expand.sort((a, b) => {
        const an = CONJUNCT_ORDERING[a.constructor.name] ?? CONJUNCT_ORDERING.Any;
        const bn = CONJUNCT_ORDERING[b.constructor.name] ?? CONJUNCT_ORDERING.Any;
        return an - bn;
    });
    // console.log('NORM', expand.map(t => t.canon).join(', '))
    return expand;
}
//# sourceMappingURL=ConjunctVal.js.map