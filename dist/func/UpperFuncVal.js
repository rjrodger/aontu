"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpperFuncVal = void 0;
const val_1 = require("../val");
const FuncBaseVal_1 = require("./FuncBaseVal");
class UpperFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isUpperFuncVal = true;
    }
    make(_ctx, spec) {
        return new UpperFuncVal(spec);
    }
    funcname() {
        return 'upper';
    }
    resolve(_ctx, args) {
        const oldpeg = args?.[0].peg;
        const peg = 'string' === typeof oldpeg ? oldpeg.toUpperCase() : undefined;
        const out = null == peg ? new val_1.Nil({ msg: 'Not a string: ' + oldpeg }) :
            new val_1.StringVal({ peg });
        return out;
    }
}
exports.UpperFuncVal = UpperFuncVal;
//# sourceMappingURL=UpperFuncVal.js.map