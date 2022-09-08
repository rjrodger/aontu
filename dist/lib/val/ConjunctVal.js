"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConjunctVal = exports.norm = void 0;
const type_1 = require("../type");
const ValBase_1 = require("../val/ValBase");
const Nil_1 = require("../val/Nil");
const op_1 = require("../op/op");
// TODO: move main logic to op/conjunct
class ConjunctVal extends ValBase_1.ValBase {
    constructor(peg, ctx) {
        super(peg, ctx);
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        let done = true;
        // Unify each term of conjunct against peer
        let upeer = [];
        for (let vI = 0; vI < this.peg.length; vI++) {
            // upeer[vI] = this.peg[vI].unify(peer, ctx)
            upeer[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer);
            done = done && type_1.DONE === upeer[vI].done;
            // // console.log('Ca', vI, this.peg[vI].canon, peer.canon, upeer[vI].canon)
            if (upeer[vI] instanceof Nil_1.Nil) {
                return Nil_1.Nil.make(ctx, '&peer[' + upeer[vI].canon + ',' + peer.canon + ']', this.peg[vI], peer);
            }
        }
        // // console.log('Cb', upeer.map(x => x.canon))
        upeer = norm(upeer);
        // TODO: FIX: conjuncts get replicated inside each other
        // 1&/x => CV[CV[1&/x]]
        // Unify each term of conjunct against following sibling,
        // reducing to smallest conjunct or single val
        let outvals = 0 < upeer.length ? [upeer[0]] : [];
        let oI = 0;
        for (let uI = 1; uI < upeer.length; uI++) {
            // // console.log('Cu', oI, uI, outvals.map(x => x.canon))
            if (outvals[oI] instanceof ConjunctVal) {
                outvals.splice(oI, 0, ...outvals[oI].peg);
                oI += outvals[oI].peg.length;
                done = false;
            }
            else {
                outvals[oI] = null == outvals[oI] ? upeer[uI] :
                    //outvals[oI].unify(upeer[uI], ctx)
                    (0, op_1.unite)(ctx, outvals[oI], upeer[uI]);
                done = done && type_1.DONE === outvals[oI].done;
                // Conjuct fails
                if (outvals[oI] instanceof Nil_1.Nil) {
                    return outvals[oI];
                    /*
                    return Nil.make(
                      ctx,
                      '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']',
                      outvals[oI],
                      upeer[uI]
                    )
                    */
                }
            }
        }
        // // console.log('Cc', outvals.map(x => x.canon), outvals)
        let out;
        //let why = ''
        if (0 === outvals.length) {
            //out = Nil.make(ctx, '&empty', this)
            // Empty conjuncts evaporate.
            out = type_1.TOP;
            //why += 'A'
        }
        // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
        else if (1 === outvals.length) {
            out = outvals[0];
            //why += 'B'
        }
        else {
            out = new ConjunctVal(outvals, ctx);
            //why += 'C'
        }
        // // console.log('Cd', why, out.peg)
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    // TODO: need a well-defined val order so conjunt canon is always the same
    get canon() {
        return this.peg.map((v) => v.canon).join('&');
    }
    gen(ctx) {
        if (0 < this.peg.length) {
            // Default is just the first term - does this work?
            // TODO: maybe use a PrefVal() ?
            let v = this.peg[0];
            let out = undefined;
            if (undefined !== v && !(v instanceof Nil_1.Nil)) {
                out = v.gen(ctx);
            }
            return out;
        }
        return undefined;
    }
}
exports.ConjunctVal = ConjunctVal;
function norm(terms) {
    // console.log('CJ norm', terms.map((t: Val) => t.canon))
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
    return expand;
}
exports.norm = norm;
//# sourceMappingURL=ConjunctVal.js.map