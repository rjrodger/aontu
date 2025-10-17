"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefFuncVal = void 0;
const utility_1 = require("../utility");
const val_1 = require("../val");
const FuncBaseVal_1 = require("./FuncBaseVal");
class PrefFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPrefFuncVal = true;
    }
    make(_ctx, spec) {
        return new PrefFuncVal(spec);
    }
    funcname() {
        return 'pref';
    }
    resolve(ctx, args) {
        let out = args[0] ?? val_1.NilVal.make(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            // Wrap every child val in a PrefVal
            out = (0, utility_1.walk)(out, (_key, val) => {
                let oval = val;
                // console.log('PREFVAL', _key, oval.canon, oval.constructor.name)
                if (val.isScalar
                    || val.isPref) {
                    oval = new val_1.PrefVal({ peg: val }, ctx);
                }
                return oval;
            });
        }
        return out;
    }
}
exports.PrefFuncVal = PrefFuncVal;
//# sourceMappingURL=PrefFuncVal.js.map