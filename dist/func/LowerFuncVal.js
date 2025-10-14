"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowerFuncVal = void 0;
const val_1 = require("../val");
const FuncBaseVal_1 = require("./FuncBaseVal");
class LowerFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isLowerFuncVal = true;
    }
    make(_ctx, spec) {
        return new LowerFuncVal(spec);
    }
    funcname() {
        return 'lower';
    }
    resolve(_ctx, args) {
        const oldpeg = args?.[0].peg;
        const peg = 'string' === typeof oldpeg ? oldpeg.toLowerCase() :
            'number' === typeof oldpeg ? Math.floor(oldpeg) :
                undefined;
        const out = this.place(null == peg ? new val_1.NilVal({ msg: 'Not a string or number: ' + oldpeg }) :
            (0, val_1.makeScalar)(peg));
        return out;
    }
    superior() {
        const arg = this.peg?.[0];
        return arg?.isScalarVal ?
            this.place(new val_1.ScalarKindVal({
                peg: arg.kind
            })) :
            super.superior();
    }
}
exports.LowerFuncVal = LowerFuncVal;
//# sourceMappingURL=LowerFuncVal.js.map