"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisjunctVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
// import { TOP } from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
const PrefVal_1 = require("../val/PrefVal");
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase_1.ValBase {
    // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
    constructor(spec, ctx, _sites) {
        super(spec, ctx);
        this.isDisjunctVal = true;
        this.isBinaryOp = true;
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        let done = true;
        let oval = [];
        // Conjunction (&) distributes over disjunction (|)
        for (let vI = 0; vI < this.peg.length; vI++) {
            //oval[vI] = this.peg[vI].unify(peer, ctx)
            oval[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer);
            done = done && type_1.DONE === oval[vI].done;
        }
        // Remove duplicates, and normalize
        if (1 < oval.length) {
            for (let vI = 0; vI < oval.length; vI++) {
                if (oval[vI] instanceof DisjunctVal) {
                    oval.splice(vI, 1, ...oval[vI].peg);
                }
            }
            // TODO: not an error Nil!
            let remove = new Nil_1.Nil();
            for (let vI = 0; vI < oval.length; vI++) {
                for (let kI = vI + 1; kI < oval.length; kI++) {
                    if (oval[kI].same(oval[vI])) {
                        oval[kI] = remove;
                    }
                }
            }
            oval = oval.filter(v => !(v instanceof Nil_1.Nil));
        }
        let out;
        if (1 == oval.length) {
            out = oval[0];
        }
        else if (0 == oval.length) {
            return Nil_1.Nil.make(ctx, '|:empty', this);
        }
        else {
            out = new DisjunctVal({ peg: oval }, ctx);
        }
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
        return out;
    }
    get canon() {
        return this.peg.map((v) => {
            return v.isBinaryOp && Array.isArray(v.peg) && 1 < v.peg.length ?
                '(' + v.canon + ')' : v.canon;
        }).join('|');
    }
    gen(ctx) {
        // TODO: this is not right - unresolved Disjuncts eval to undef
        if (0 < this.peg.length) {
            let vals = this.peg.filter((v) => v instanceof PrefVal_1.PrefVal);
            vals = 0 === vals.length ? this.peg : vals;
            let val = vals[0];
            for (let vI = 1; vI < this.peg.length; vI++) {
                let valnext = val.unify(this.peg[vI], ctx);
                val = valnext;
            }
            return val.gen(ctx);
        }
        return undefined;
    }
}
exports.DisjunctVal = DisjunctVal;
//# sourceMappingURL=DisjunctVal.js.map