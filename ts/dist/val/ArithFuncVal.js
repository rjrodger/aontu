"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemFuncVal = exports.ModFuncVal = exports.DivFuncVal = exports.MulFuncVal = exports.SubFuncVal = exports.AddFuncVal = exports.ArithFuncVal = void 0;
const FuncBaseVal_1 = require("./FuncBaseVal");
const arith_1 = require("./arith");
class ArithFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx, op) {
        super(spec, ctx);
        this.isArithFunc = true;
        this.op = op;
    }
    // Rebuilt as its own class, carrying its own op: residuation must not
    // turn a `sub` into a bare arithmetic call with no operation.
    make(_ctx, spec) {
        return new this.constructor(spec, undefined, this.op);
    }
    funcname() {
        return this.op;
    }
    resolve(ctx, args) {
        return this.place((0, arith_1.arith)(ctx, this.op, this, args?.[0], args?.[1]));
    }
}
exports.ArithFuncVal = ArithFuncVal;
class AddFuncVal extends ArithFuncVal {
    constructor(spec, ctx) { super(spec, ctx, 'add'); }
}
exports.AddFuncVal = AddFuncVal;
class SubFuncVal extends ArithFuncVal {
    constructor(spec, ctx) { super(spec, ctx, 'sub'); }
}
exports.SubFuncVal = SubFuncVal;
class MulFuncVal extends ArithFuncVal {
    constructor(spec, ctx) { super(spec, ctx, 'mul'); }
}
exports.MulFuncVal = MulFuncVal;
class DivFuncVal extends ArithFuncVal {
    constructor(spec, ctx) { super(spec, ctx, 'div'); }
}
exports.DivFuncVal = DivFuncVal;
class ModFuncVal extends ArithFuncVal {
    constructor(spec, ctx) { super(spec, ctx, 'mod'); }
}
exports.ModFuncVal = ModFuncVal;
class RemFuncVal extends ArithFuncVal {
    constructor(spec, ctx) { super(spec, ctx, 'rem'); }
} /* node:coverage ignore next 11 */
exports.RemFuncVal = RemFuncVal;
//# sourceMappingURL=ArithFuncVal.js.map