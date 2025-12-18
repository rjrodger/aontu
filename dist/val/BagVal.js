"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BagVal = void 0;
const utility_1 = require("../utility");
const err_1 = require("../err");
const Val_1 = require("./Val");
const NilVal_1 = require("./NilVal");
const FeatureVal_1 = require("./FeatureVal");
const ExpectVal_1 = require("./ExpectVal");
class BagVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isBag = true;
        this.isGenable = true;
        this.closed = false;
        this.optionalKeys = [];
        this.spread = {
            cj: undefined,
        };
    }
    clone(ctx, spec) {
        const bag = super.clone(ctx, spec);
        bag.spread = this.spread;
        return bag;
    }
    handleExpectedVal(key, val, parent, ctx) {
        if (val.isGenable) {
            return val;
        }
        const expectVal = new ExpectVal_1.ExpectVal({ peg: val }, ctx);
        expectVal.key = key;
        expectVal.parent = parent;
        return expectVal;
    }
    gen(ctx) {
        let out = this.isMap ? {} : [];
        if (this.mark.type || this.mark.hide) {
            return undefined;
        }
        for (let item of (0, utility_1.items)(this.peg)) {
            const p = item[0];
            const child = item[1];
            if (child.mark.type || child.mark.hide) {
                continue;
            }
            const optional = this.optionalKeys.includes('' + p);
            // Optional unresolved disjuncts are not an error, just dropped.
            if (child.isDisjunct && optional) {
                const dctx = ctx.clone({ err: [], collect: true });
                let cval = child.gen(dctx);
                if (undefined === cval) {
                    continue;
                }
                out[p] = cval;
            }
            else if (child.isScalar
                || child.isMap
                || child.isList
                || child.isPref
                || child.isRef
                || child.isDisjunct
                || child.isNil) {
                let cval = child.gen(ctx);
                if (optional && (undefined === cval || (0, Val_1.empty)(cval))) {
                    continue;
                }
                out[p] = cval;
            }
            else if (child.isNil) {
                ctx.adderr(child);
            }
            else if (!optional) {
                const prefix = this.isMap ? 'map' : 'list';
                let code = this.closed ? prefix + 'val_required' : prefix + 'val_no_gen';
                let va = child;
                let vb = undefined;
                if (va.isExpect) {
                    code = prefix + 'val_spread_required';
                    if (va.parent) {
                        vb = new NilVal_1.NilVal({}, ctx);
                        va.parent.place(vb);
                    }
                    va = va.peg;
                }
                const details = { key: p };
                (0, err_1.makeNilErr)(ctx, code, va, vb, undefined, details);
                break;
            }
            // else optional so we can ignore it
        }
        return out;
    }
}
exports.BagVal = BagVal;
//# sourceMappingURL=BagVal.js.map