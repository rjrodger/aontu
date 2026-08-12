"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowerFuncVal = void 0;
const err_1 = require("../err");
const ScalarKindVal_1 = require("../val/ScalarKindVal");
const valutil_1 = require("../val/valutil");
const Decimal_1 = require("../val/Decimal");
const FuncBaseVal_1 = require("./FuncBaseVal");
class LowerFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isLowerFunc = true;
    }
    make(_ctx, spec) {
        return new LowerFuncVal(spec);
    }
    funcname() {
        return 'lower';
    }
    resolve(ctx, args) {
        // A missing argument (`lower()`) must produce an invalid-arg error
        // value, as the Go port does — reading .peg off nothing threw a
        // TypeError that the unifier could only report as an opaque
        // internal error.
        const arg = args?.[0];
        const oldpeg = arg?.peg;
        const peg = 'string' === typeof oldpeg ? oldpeg.toLowerCase() :
            'number' === typeof oldpeg ? Math.floor(oldpeg) :
                // The exact leaves take an EXACT floor and keep their kind: a
                // biginteger is already integral so it is its own floor, and a
                // bigdecimal floors by coefficient arithmetic. Math.floor is not
                // an option for either — it would round the value into binary64
                // first, which is the loss the `0d` leaves exist to refuse.
                'bigint' === typeof oldpeg ? oldpeg :
                    oldpeg instanceof Decimal_1.Decimal ? oldpeg.floor() :
                        undefined;
        const out = this.place(null == peg ?
            (0, err_1.makeNilErr)(ctx, 'invalid-arg', this) :
            // The floor keeps the ARGUMENT's kind (lower(2) is an integer 2,
            // lower(1.9) is a number 1) — the function must not narrow
            // number to integer, and this also makes the actual result kind
            // agree with the superior() advertised below.
            (0, valutil_1.makeScalarLike)(peg, arg));
        return out;
    }
    superior() {
        const arg = this.peg?.[0];
        return arg?.isScalar ?
            this.place(new ScalarKindVal_1.ScalarKindVal({
                peg: arg.kind
            })) :
            super.superior();
    }
} /* node:coverage ignore next 6 */
exports.LowerFuncVal = LowerFuncVal;
//# sourceMappingURL=LowerFuncVal.js.map