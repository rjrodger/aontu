"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeilFuncVal = void 0;
const val_1 = require("../val");
const FuncBaseVal_1 = require("./FuncBaseVal");
class CeilFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isCeilFuncVal = true;
    }
    make(_ctx, spec) {
        return new CeilFuncVal(spec);
    }
    funcname() {
        return 'ceil';
    }
    resolve(_ctx, args) {
        const oldpeg = args?.[0].peg;
        const peg = isNaN(oldpeg) ? undefined : Math.ceil(oldpeg);
        const out = null == peg ? new val_1.Nil({ msg: 'Not a number: ' + oldpeg }) :
            new val_1.IntegerVal({ peg });
        return out;
    }
}
exports.CeilFuncVal = CeilFuncVal;
//# sourceMappingURL=CeilFuncVal.js.map