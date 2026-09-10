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