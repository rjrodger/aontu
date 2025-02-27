"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConjunctVal = void 0;
exports.norm = norm;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
const val_1 = require("../val");
// import { DisjunctVal } from '../val/DisjunctVal'
const ListVal_1 = require("../val/ListVal");
const MapVal_1 = require("../val/MapVal");
const Nil_1 = require("../val/Nil");
// import { PrefVal } from '../val/PrefVal'
const RefVal_1 = require("../val/RefVal");
const ValBase_1 = require("../val/ValBase");
// TODO: move main logic to op/conjunct
class ConjunctVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isBinaryOp = true;
        this.isConjunctVal = true;
        // console.log('NEWCJ')
        // console.trace()
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        // console.log('CONJUNCT UNIFY', this.done, this.path.join('.'), this.canon,
        //   'P', peer.top || peer.constructor.name,
        //  peer.done, peer.path.join('.'), peer.canon)
        const mark = (Math.random() * 1e7) % 1e6 | 0;
        // console.log('CONJUNCT unify', mark, this.done, this.canon, 'peer=', peer.canon)
        let done = true;
        // Unify each term of conjunct against peer
        let upeer = [];
        // console.log('CJa' + mark, this.peg.map((p: Val) => p.canon), 'p=', peer.canon)
        for (let vI = 0; vI < this.peg.length; vI++) {
            upeer[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer, 'cj-own' + mark);
            // let prevdone = done
            done = done && (type_1.DONE === upeer[vI].done);
            // console.log('CONJUNCT pud', mark, vI, done, prevdone, '|', upeer[vI].done, upeer[vI].canon)
            if (upeer[vI] instanceof Nil_1.Nil) {
                return Nil_1.Nil.make(ctx, '&peer[' + upeer[vI].canon + ',' + peer.canon + ']', this.peg[vI], peer);
            }
        }
        upeer = norm(upeer);
        // console.log('CONJUNCT upeer', this.id, mark, this.done, done, upeer.map(p => p.canon))
        upeer.sort((a, b) => {
            return (a.constructor.name === b.constructor.name) ? 0 :
                (a.constructor.name < b.constructor.name ? -1 : 1);
        });
        // console.log('CONJUNCT upeer sort', this.id, mark, this.done, done, upeer.map(p => p.canon))
        // Unify terms against each other
        let outvals = [];
        let val;
        // for (let pI = 0; pI < upeer.length; pI++) {
        //   let pt = upeer[pI]
        //   for (let qI = pI; qI < upeer.length; qI++) {
        //     let qt = upeer[pI]
        //     let pq = unite(ctx, pt, qt, 'cj-pq')
        //   }
        // }
        // console.log('CJ upeer', mark, upeer.map(v => v.canon))
        let t0 = upeer[0];
        next_term: for (let pI = 0; pI < upeer.length; pI++) {
            // console.log('CJ TERM t0', pI, t0.done, t0.canon)
            if (type_1.DONE !== t0.done) {
                let u0 = (0, op_1.unite)(ctx, t0, val_1.TOP, 'cj-peer-t0');
                if (type_1.DONE !== u0.done
                    // Maps and Lists are still unified so that path refs will work
                    // TODO: || ListVal - test!
                    && !(u0 instanceof MapVal_1.MapVal
                        || u0 instanceof ListVal_1.ListVal
                        || u0 instanceof RefVal_1.RefVal)) {
                    // console.log('CONJUNCT PUSH A', u0.id, u0.canon)
                    outvals.push(u0);
                    // console.log('CJ outvals A', outvals.map(v => v.canon))
                    continue next_term;
                }
                else {
                    t0 = u0;
                }
            }
            let t1 = upeer[pI + 1];
            // console.log('CJ TERM t1', pI + 1, t1?.done, t1?.canon)
            if (null == t1) {
                // console.log('CONJUNCT PUSH B', t0.canon)
                outvals.push(t0);
                // console.log('CJ outvals B', outvals.map(v => v.canon))
            }
            // Can't unite with a RefVal, unless also a RefVal with same path.
            else if (t0 instanceof RefVal_1.RefVal && !(t1 instanceof RefVal_1.RefVal)) {
                // console.log('CONJUNCT PUSH D', t0.canon)
                outvals.push(t0);
                t0 = t1;
                // console.log('CJ outvals C', outvals.map(v => v.canon))
            }
            else if (t1 instanceof RefVal_1.RefVal && !(t0 instanceof RefVal_1.RefVal)) {
                // console.log('CONJUNCT PUSH D', t0.canon)
                outvals.push(t0);
                t0 = t1;
                // console.log('CJ outvals C', outvals.map(v => v.canon))
            }
            else {
                val = (0, op_1.unite)(ctx, t0, t1, 'cj-peer-t0t1');
                done = done && type_1.DONE === val.done;
                // Unite was just a conjunt anyway, so discard.
                if (val instanceof ConjunctVal) {
                    // if (t0.id === val.peg[0].id) {
                    // val = t0
                    outvals.push(t0);
                    t0 = t1;
                    // console.log('CJ outvals D', outvals.map(v => v.canon))
                    //}
                }
                else if (val instanceof Nil_1.Nil) {
                    return val;
                }
                else {
                    t0 = val;
                }
                // TODO: t0 should become this to avoid unnecessary repasses
                // console.log('CONJUNCT PUSH C', val.canon)
                // outvals.push(val)
                // pI++
            }
        }
        // console.log('CJ outvals', mark, outvals.map(v => v.canon))
        let out;
        if (0 === outvals.length) {
            // Empty conjuncts evaporate.
            out = val_1.TOP;
        }
        // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
        else if (1 === outvals.length) {
            out = outvals[0];
        }
        else {
            out = new ConjunctVal({ peg: outvals }, ctx);
        }
        out.done = done ? type_1.DONE : this.done + 1;
        // console.log('CJ out', out.done, out.canon)
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
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
        let nil = Nil_1.Nil.make(ctx, 'conjunct', this, // (formatPath(this.peg, this.absolute) as any),
        undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        (0, err_1.descErr)(nil, ctx);
        if (ctx) {
            ctx.err.push(nil);
        }
        else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.ConjunctVal = ConjunctVal;
// Normalize Conjuct:
// - flatten child conjuncts
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
    return expand;
}
//# sourceMappingURL=ConjunctVal.js.map