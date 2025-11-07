"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureVal = void 0;
const Val_1 = require("./Val");
const top_1 = require("./top");
class FeatureVal extends Val_1.Val {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFeature = true;
    }
    superior() {
        return (0, top_1.top)();
    }
}
exports.FeatureVal = FeatureVal;
//# sourceMappingURL=FeatureVal.js.map