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
// makeScalar keeps its own contract (every number becomes a NumberVal)
// for callers that have no kind to preserve.
function makeScalarLike(scalar, like) {
    if ('number' === typeof scalar &&
        true === like?.isInteger &&
        (0, numkind_1.isIntegerKind)(scalar)) {
        return new IntegerVal_1.IntegerVal({ peg: scalar });
    }
    return makeScalar(scalar);
}
//# sourceMappingURL=valutil.js.map