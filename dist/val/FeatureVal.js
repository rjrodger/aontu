"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureVal = void 0;
const BaseVal_1 = require("./BaseVal");
class FeatureVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFeature = true;
    }
}
exports.FeatureVal = FeatureVal;
//# sourceMappingURL=FeatureVal.js.map