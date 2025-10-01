"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanVal = void 0;
const ScalarVal_1 = require("./ScalarVal");
class BooleanVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: Boolean }, ctx);
        this.isBooleanVal = true;
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
}
exports.BooleanVal = BooleanVal;
//# sourceMappingURL=BooleanVal.js.map