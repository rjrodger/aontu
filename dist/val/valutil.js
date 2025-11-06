"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeScalar = makeScalar;
const NumberVal_1 = require("./NumberVal");
const StringVal_1 = require("./StringVal");
const BooleanVal_1 = require("./BooleanVal");
const NullVal_1 = require("./NullVal");
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
        throw new Error('Not a scalar: ' + scalar);
    }
}
//# sourceMappingURL=valutil.js.map