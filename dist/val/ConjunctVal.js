"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConjunctVal = void 0;
exports.norm = norm;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const NilVal_1 = require("./NilVal");
const JunctionVal_1 = require("./JunctionVal");
const utility_2 = require("../utility");
const valutil_1 = require("./valutil");
const CONJUNCT_ORDERING = {
    PrefVal: 30000,
    RefVal: 32500,
    DisjunctVal: 35000,
    ConjunctVal: 40000,
    Any: 99999
};
// TODO: move main logic to op/conjunct
class ConjunctVal extends JunctionVal_1.JunctionVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isConjunct = true;
        this.mark.type = !!spec.mark?.type;
        this.mark.hide = !!spec.mark?.hide;
        this.peg = (Array.isArray(this.peg) ? this.peg : [])
            .filter((p) => null != p && p.isVal);
        this.peg?.map((v) => {
            (0, utility_1.propagateMarks)(this, v);
            return v;
        });
        // console.log('CONJUNCT-ctor', this.peg.map((v: Val) => v.canon))
    }
    // NOTE: mutation!
    append(peer) {
        super.append(peer);
        (0, utility_1.propagateMarks)(this, peer);
        return this;
    }
    unify(peer, ctx, trace) {
        peer = peer ?? (0, valutil_1.top)();
        const te = ctx.explain && (0, utility_2.explainOpen)(ctx, trace, 'Conjunct', this, peer);
        let done = true;
        this.peg = norm(this.peg);
        // Unify each term of conjunct against peer
        let upeer = [];
        let newtype = this.mark.type || peer.mark.type;
        let newhide = this.mark.hide || peer.mark.hide;
        for (let vI = 0; vI < this.peg.length; vI++) {
            newtype = this.peg[vI].mark.type || newtype;
            newhide = this.peg[vI].mark.hide || newhide;
        }
        for (let vI = 0; vI < this.peg.length; vI++) {
            this.peg[vI].mark.type = newtype;
            this.peg[vI].mark.hide = newhide;
            // console.log('CONJUNCT-TERM', this.id, vI, this.peg[vI].canon)
            upeer[vI] = (this.peg[vI].done && peer.isTop) ? this.peg[vI] :
                (0, unify_1.unite)(ctx, this.peg[vI], peer, 'cj-own', (0, utility_2.ec)(te, 'OWN'));
            upeer[vI].mark.type = newtype = newtype || upeer[vI].mark.type;
            upeer[vI].mark.hide = newhide = newhide || upeer[vI].mark.hide;
            // let prevdone = done
            done = done && (type_1.DONE === upeer[vI].dc);
            if (upeer[vI].isNil) {
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
        // console.log('CONJUNCT-UPEER', this.id, upeer.map((v: Val) => v.canon))
        // Unify terms against each other
        let outvals = [];
        let val;
        let t0 = upeer[0];
        // next_term:
        for (let pI = 0; pI < upeer.length; pI++) {
            let t1 = upeer[pI + 1];
            // console.log('CONJUNCT-TERMS-C', this.id, pI, t0, t1, 'OV=', outvals.map((v: Val) => v))
            if (null == t1) {
                outvals.push(t0);
                newtype = this.mark.type || t0.mark.type;
                newhide = this.mark.hide || t0.mark.hide;
            }
            // Can't unite with a RefVal, unless also a RefVal with same path.
            // else if (t0 instanceof RefVal && !(t1 instanceof RefVal)) {
            else if (t0.isRef && !(t1.isRef)) {
                outvals.push(t0);
                t0 = t1;
            }
            else if (t1.isRef && !(t0.isRef)) {
                outvals.push(t0);
                t0 = t1;
            }
            else {
                val = (0, unify_1.unite)(ctx, t0, t1, 'cj-peer-t0t1', (0, utility_2.ec)(te, 'DEF'));
                done = done && type_1.DONE === val.dc;
                newtype = this.mark.type || val.mark.type;
                newhide = this.mark.hide || val.mark.hide;
                // Unite was just a conjunt anyway, so discard.
                if (val.isConjunct) {
                    outvals.push(t0);
                    t0 = t1;
                }
                else if (val.isNil) {
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
        // console.log('CONJUCT-prepout', this.id, outvals.map((v: Val) => v.canon))
        if (0 === outvals.length) {
            // Empty conjuncts evaporate.
            out = (0, valutil_1.top)();
        }
        // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
        else if (1 === outvals.length) {
            out = outvals[0];
            out.mark.type = newtype;
            out.mark.hide = newhide;
        }
        else {
            out = new ConjunctVal({ peg: outvals, mark: { type: newtype, hide: newhide } }, ctx);
        }
        out.dc = done ? type_1.DONE : this.dc + 1;
        // console.log('CONJUNCT-unify', this.id, sc, pc, '->', out.canon, 'D=' + out.dc, 'E=', this.err)
        (0, utility_2.explainClose)(te, out);
        return out;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        return out;
    }
    getJunctionSymbol() {
        return '&';
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
        if (terms[tI].isConjunct) {
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