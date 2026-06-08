"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenFuncVal = void 0;
const err_1 = require("../err");
const FuncBaseVal_1 = require("./FuncBaseVal");
class OpenFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isOpenFunc = true;
    }
    make(_ctx, spec) {
        return new OpenFuncVal(spec);
    }
    funcname() {
        return 'open';
    }
    resolve(ctx, args) {
        const argval = args[0];
        if (null == argval) {
            return (0, err_1.makeNilErr)(ctx, 'no_first_arg', this, undefined, 'close');
        }
        if (argval.isMap || argval.isList) {
            argval.closed = false;
        }
        return argval;
    }
}
exports.OpenFuncVal = OpenFuncVal;
//# sourceMappingURL=OpenFuncVal.js.map