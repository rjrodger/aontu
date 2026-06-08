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
    resolve(_ctx, _args) {
        return this.place(this.superior());
    }
}
exports.SuperFuncVal = SuperFuncVal;
//# sourceMappingURL=SuperFuncVal.js.map