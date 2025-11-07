"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseFuncVal = void 0;
const err_1 = require("../err");
const FuncBaseVal_1 = require("./FuncBaseVal");
class CloseFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isCloseFunc = true;
        this.validateArgs(spec.peg, 1);
    }
    make(_ctx, spec) {
        return new CloseFuncVal(spec);
    }
    funcname() {
        return 'close';
    }
    resolve(ctx, args) {
        const argval = args[0];
        if (null == argval) {
            return (0, err_1.makeNilErr)(ctx, 'no_first_arg', this, undefined, 'close');
        }
        if (argval.isMap || argval.isList) {
            argval.closed = true;
            // console.log('CLOSED', argval.canon)
        }
        return argval;
    }
}
exports.CloseFuncVal = CloseFuncVal;
//# sourceMappingURL=CloseFuncVal.js.map