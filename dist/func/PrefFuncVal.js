"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefFuncVal = void 0;
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
    resolve(_ctx, _args) {
        return this;
    }
}
exports.PrefFuncVal = PrefFuncVal;
//# sourceMappingURL=PrefFuncVal.js.map