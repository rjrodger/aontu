"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringVal = void 0;
const ScalarVal_1 = require("./ScalarVal");
class StringVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, kind: String }, ctx);
        this.isString = true;
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
    get canon() {
        return JSON.stringify(this.peg);
    }
}
exports.StringVal = StringVal;
//# sourceMappingURL=StringVal.js.map