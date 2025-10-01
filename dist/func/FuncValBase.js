"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncValBase = void 0;
const ValBase_1 = require("../val/ValBase");
class FuncValBase extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFuncVal = true;
    }
}
exports.FuncValBase = FuncValBase;
//# sourceMappingURL=FuncValBase.js.map