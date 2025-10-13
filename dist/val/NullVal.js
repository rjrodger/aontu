"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullVal = void 0;
const ScalarVal_1 = require("./ScalarVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
class NullVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, kind: ScalarKindVal_1.Null }, ctx);
        this.isNullVal = true;
        this.peg = null;
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
}
exports.NullVal = NullVal;
//# sourceMappingURL=NullVal.js.map