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
        const peg = 'string' === typeof oldpeg ? oldpeg.toUpperCase() :
            'number' === typeof oldpeg ? Math.ceil(oldpeg) :
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
exports.UpperFuncVal = UpperFuncVal;
//# sourceMappingURL=UpperFuncVal.js.map