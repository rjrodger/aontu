"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BagVal = void 0;
const FeatureVal_1 = require("./FeatureVal");
class BagVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.closed = false;
        this.optionalKeys = [];
    }
}
exports.BagVal = BagVal;
//# sourceMappingURL=BagVal.js.map