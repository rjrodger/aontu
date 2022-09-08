"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConjunctVal = exports.norm = void 0;
const type_1 = require("../type");
const ValBase_1 = require("../val/ValBase");
const Nil_1 = require("../val/Nil");
// import { RefVal } from '../val/RefVal'
const MapVal_1 = require("../val/MapVal");
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
        // console.log('CJ AA', upeer.map(x => x.canon))
        let outvals = [];
        let val;
        next_term: for (let pI = 0; pI < upeer.length; pI++) {
            let t0 = upeer[pI];
            // console.log('CJ unify QQ', mark, uc, 't0', pI, t0.canon)
            if (type_1.DONE !== t0.done) {
                let u0 = (0, op_1.unite)(ctx, t0, type_1.TOP);
                if (type_1.DONE !== u0.done
                    // Maps and Lists are still unified so that path refs will work
                    && !(u0 instanceof MapVal_1.MapVal) // TODO: || ListVal - test!
                ) {
                    outvals.push(u0);
                    continue next_term;
                }
                else {
                    t0 = u0;
                }
            }
            let t1 = upeer[pI + 1];
            // console.log('CJ unify WW', mark, uc, 't1', pI + 1, t1?.canon)
            // if (
            //   null == t1 ||
            //   t0.id === t1.id ||
            //   t0 instanceof RefVal
            // ) {
            //   if (DONE !== t0.done) {
            //     let u0 = unite(ctx, t0, TOP)
            //     // console.log('CJ unify EE', mark, uc, 't0', t0.canon, 'u0', u0.canon)
            //     outvals.push(u0)
            //   }
            //   else {
            //     outvals.push(t0)
            //   }
            //   pI++
            // }
            // else if (DONE !== t0.done || DONE != t1.done) {
            //   if (DONE !== t0.done) {
            //     let u0 = unite(ctx, t0, TOP)
            //     // console.log('CJ unify FF', mark, uc, 't0', t0.canon, 'u0', u0.canon)
            //     outvals.push(u0)
            //   }
            //   else {
            //     outvals.push(t0)
            //   }
            // }
            if (null == t1) {
                outvals.push(t0);
            }
            else {
                // console.log('CJS unify0', t0?.canon, t1?.canon)
                val = (0, op_1.unite)(ctx, t0, t1);
                done = done && type_1.DONE === val.done;
                if (val instanceof ConjunctVal) {
                    if (t0.id === val.peg[0].id) {
                        val = t0;
                    }
                }
                else if (val instanceof Nil_1.Nil) {
                    return val;
                }
                // TODO: t0 should become this to avoid unnecessary repasses
                outvals.push(val);
                pI++;
            }
        }
        // console.log('CJ BB', outvals.map(x => x.canon))
        // // TODO: FIX: conjuncts get replicated inside each other
        // // 1&/x => CV[CV[1&/x]]
        // // Unify each term of conjunct against following sibling,
        // // reducing to smallest conjunct or single val
        // let outvals: Val[] = 0 < upeer.length ? [upeer[0]] : []
        // let oI = 0
        // for (let uI = 1; uI < upeer.length; uI++) {
        //   // // console.log('Cu', oI, uI, outvals.map(x => x.canon))
        //   if (outvals[oI] instanceof ConjunctVal) {
        //     outvals.splice(oI, 0, ...outvals[oI].peg)
        //     oI += outvals[oI].peg.length
        //     done = false
        //   }
        //   else {
        //     outvals[oI] = null == outvals[oI] ? upeer[uI] :
        //       //outvals[oI].unify(upeer[uI], ctx)
        //       unite(ctx, outvals[oI], upeer[uI])
        //     done = done && DONE === outvals[oI].done
        //     // Conjuct fails
        //     if (outvals[oI] instanceof Nil) {
        //       return outvals[oI]
        //       /*
        //       return Nil.make(
        //         ctx,
        //         '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']',
        //         outvals[oI],
        //         upeer[uI]
        //       )
        //       */
        //     }
        //   }
        // }
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