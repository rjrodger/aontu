"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpperFuncVal = void 0;
const err_1 = require("../err");
const ScalarKindVal_1 = require("../val/ScalarKindVal");
const valutil_1 = require("../val/valutil");
const Decimal_1 = require("../val/Decimal");
const caserange_1 = require("./caserange");
const FuncBaseVal_1 = require("./FuncBaseVal");
class UpperFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isUpperFunc = true;
    }
    make(_ctx, spec) {
        return new UpperFuncVal(spec);
    }
    funcname() {
        return 'upper';
    }
    resolve(ctx, args) {
        // A missing argument (`upper()`) must produce an invalid-arg error
        // value, as the Go port does — reading .peg off nothing threw a
        // TypeError that the unifier could only report as an opaque
        // internal error.
        const arg = args?.[0];
        const oldpeg = arg?.peg;
        // THE RANGE (ts/src/val/caserange.ts): `start` names the first
        // character of the run when it is zero or positive and the last
        // when it is negative; `len` of -1, and the absent argument, are
        // the source's length. Refused on a NUMBER, where a run of
        // characters means nothing -- the numeric arm below is a ceiling,
        // not a case mapping.
        const start = (0, caserange_1.rangeArg)(args?.[1]);
        const len = (0, caserange_1.rangeArg)(args?.[2]);
        const ranged = undefined !== start || undefined !== len;
        if (ranged &&
            (Number.isNaN(start) || Number.isNaN(len) ||
                'string' !== typeof oldpeg)) {
            return this.place((0, err_1.makeNilErr)(ctx, 'invalid-arg', this, arg, 'range'));
        }
        const peg = 'string' === typeof oldpeg ?
            (0, caserange_1.caseRange)(oldpeg, start ?? 0, len ?? -1, true) :
            'number' === typeof oldpeg ? Math.ceil(oldpeg) :
                // The exact leaves take an EXACT ceiling and keep their kind: a
                // biginteger is already integral so it is its own ceiling, and a
                // bigdecimal ceils by coefficient arithmetic. Math.ceil is not
                // an option for either — it would round the value into binary64
                // first, which is the loss the `0d` leaves exist to refuse.
                'bigint' === typeof oldpeg ? oldpeg :
                    oldpeg instanceof Decimal_1.Decimal ? oldpeg.ceil() :
                        undefined;
        const out = this.place(null == peg ?
            (0, err_1.makeNilErr)(ctx, 'invalid-arg', this) :
            // The ceiling keeps the ARGUMENT's kind (upper(2) is an integer
            // 2, upper(1.1) is a number 2) — the function must not narrow
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
exports.UpperFuncVal = UpperFuncVal;
//# sourceMappingURL=UpperFuncVal.js.map