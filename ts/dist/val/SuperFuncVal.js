"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperFuncVal = void 0;
const FuncBaseVal_1 = require("./FuncBaseVal");
class SuperFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isSuperFunc = true;
    }
    make(_ctx, spec) {
        return new SuperFuncVal(spec);
    }
    funcname() {
        return 'super';
    }
    resolve(_ctx, args) {
        // super(x) is the lattice-superior of its ARGUMENT, not of the
        // super() call itself: super(1) -> integer, super(1.5) -> number,
        // super(a) -> string, super(true) -> boolean. Returning the
        // function's own superior (top) is what made super() inert.
        const arg = args?.[0];
        if (arg?.isVal) {
            const sup = arg.superior();
            // Where the argument has no meaningful superior (superior()
            // defaults to top), fall back to the previous behaviour.
            if (null != sup && true !== sup.isTop) {
                return this.place(sup);
            }
        }
        return this.place(this.superior());
    }
} /* node:coverage ignore next 6 */
exports.SuperFuncVal = SuperFuncVal;
//# sourceMappingURL=SuperFuncVal.js.map