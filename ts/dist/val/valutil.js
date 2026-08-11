"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeScalar = makeScalar;
exports.makeScalarLike = makeScalarLike;
const err_1 = require("../err");
const NumberVal_1 = require("./NumberVal");
const IntegerVal_1 = require("./IntegerVal");
const StringVal_1 = require("./StringVal");
const BooleanVal_1 = require("./BooleanVal");
const NullVal_1 = require("./NullVal");
const BigIntegerVal_1 = require("./BigIntegerVal");
const BigDecimalVal_1 = require("./BigDecimalVal");
const Decimal_1 = require("./Decimal");
const numkind_1 = require("./numkind");
// TODO: move to FuncBaseVal
function makeScalar(scalar) {
    const st = typeof scalar;
    const spec = { peg: scalar };
    if ('number' === st) {
        return new NumberVal_1.NumberVal(spec);
    }
    else if ('string' === st) {
        return new StringVal_1.StringVal(spec);
    }
    else if ('boolean' === st) {
        return new BooleanVal_1.BooleanVal(spec);
    }
    else if (null === scalar) {
        return new NullVal_1.NullVal(spec);
    }
    else {
        throw new err_1.AontuError('Not a scalar: ' + scalar);
    }
}
// Like makeScalar, but for a numeric result that must not narrow the
// kind of the value it was derived from (kind contagion: upper(2) is an
// integer 2, upper(1.1) is a number 2). `like` is the source Val whose
// kind is being carried over; anything that is not integer kind — and
// any result that has left the int64 range — yields a NumberVal.
//
// The two EXACT leaves need no `like`: unlike integer and float, which
// share the JavaScript `number` type and so can only be told apart by
// the value they came from, a bigint is a biginteger and a Decimal is a
// bigdecimal. Carrying the kind is automatic because the exact result
// types ARE the kinds — an exact ceiling of a bigdecimal is a Decimal,
// so upper(0d1.1) is bigdecimal 0d2.0 and upper(0d5) is biginteger 0d5.
//
// makeScalar keeps its own contract (every number becomes a NumberVal)
// for callers that have no kind to preserve.
function makeScalarLike(scalar, like) {
    if ('bigint' === typeof scalar) {
        return new BigIntegerVal_1.BigIntegerVal({ peg: scalar });
    }
    if (scalar instanceof Decimal_1.Decimal) {
        return new BigDecimalVal_1.BigDecimalVal({ peg: scalar });
    }
    if ('number' === typeof scalar &&
        true === like?.isInteger &&
        (0, numkind_1.isIntegerKind)(scalar)) {
        return new IntegerVal_1.IntegerVal({ peg: scalar });
    }
    return makeScalar(scalar);
}
//# sourceMappingURL=valutil.js.map