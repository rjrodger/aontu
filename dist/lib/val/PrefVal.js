"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
// import { TOP } from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
class PrefVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPrefVal = true;
        this.pref = spec.pref || spec.peg;
    }
    // PrefVal unify always returns a PrefVal
    // PrefVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        let done = true;
        let out;
        if (peer instanceof PrefVal) {
            out = new PrefVal({
                peg: (0, op_1.unite)(ctx, this.peg, peer.peg, 'Pref000'),
                pref: (0, op_1.unite)(ctx, this.pref, peer.pref, 'Pref010'),
            }, ctx);
        }
        else {
            out = new PrefVal({
                // TODO: find a better way to drop Nil non-errors
                peg: (0, op_1.unite)(ctx === null || ctx === void 0 ? void 0 : ctx.clone({ err: [] }), this.peg, peer, 'Pref020'),
                pref: (0, op_1.unite)(ctx === null || ctx === void 0 ? void 0 : ctx.clone({ err: [] }), this.pref, peer, 'Pref030'),
            }, ctx);
        }
        done = done && type_1.DONE === out.peg.done &&
            (null != out.pref ? type_1.DONE === out.pref.done : true);
        if (out.peg instanceof Nil_1.Nil) {
            out = out.pref;
        }
        else if (out.pref instanceof Nil_1.Nil) {
            out = out.peg;
        }
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    same(peer) {
        if (null == peer) {
            return false;
        }
        let pegsame = (this.peg === peer.peg) ||
            (this.peg instanceof ValBase_1.ValBase && this.peg.same(peer.peg));
        let prefsame = peer instanceof PrefVal &&
            ((this.pref === peer.pref) ||
                (this.pref instanceof ValBase_1.ValBase && this.pref.same(peer.pref)));
        return pegsame && prefsame;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.pref = this.pref.clone(null, ctx);
        return out;
    }
    get canon() {
        return this.pref instanceof Nil_1.Nil ? this.peg.canon : '*' + this.pref.canon;
    }
    gen(ctx) {
        let val = !(this.pref instanceof Nil_1.Nil) ? this.pref :
            (!(this.peg instanceof Nil_1.Nil) ? this.peg :
                this.pref);
        if (val instanceof Nil_1.Nil) {
            (0, err_1.descErr)(val, ctx);
            if (ctx) {
                ctx.err.push(val);
            }
            else {
                throw new Error(val.msg);
            }
        }
        return val.gen(ctx);
    }
}
exports.PrefVal = PrefVal;
//# sourceMappingURL=PrefVal.js.map