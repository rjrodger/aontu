"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefFuncVal = void 0;
const err_1 = require("../err");
const utility_1 = require("../utility");
const PrefVal_1 = require("../val/PrefVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
class PrefFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPrefFunc = true;
    }
    make(_ctx, spec) {
        return new PrefFuncVal(spec);
    }
    funcname() {
        return 'pref';
    }
    resolve(ctx, args) {
        let out = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            // Wrap every child val in a PrefVal
            out = (0, utility_1.walk)(out, (_key, val) => {
                let oval = val;
                // console.log('PREFVAL', _key, oval.canon, oval.constructor.name)
                if (val.isScalar
                    || val.isPref) {
                    oval = new PrefVal_1.PrefVal({ peg: val }, ctx);
                }
                return oval;
            });
        }
        return out;
    }
}
exports.PrefFuncVal = PrefFuncVal;
//# sourceMappingURL=PrefFuncVal.js.map