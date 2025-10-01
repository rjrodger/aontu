"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloorFuncVal = exports.FuncValBase = void 0;
// NOTES
// - Func vals are immutable
// - each Func val must handle all parent and child unifications explicitly
// - performance is not considered yet
var FuncValBase_1 = require("./func/FuncValBase");
Object.defineProperty(exports, "FuncValBase", { enumerable: true, get: function () { return FuncValBase_1.FuncValBase; } });
var FloorFuncVal_1 = require("./func/FloorFuncVal");
Object.defineProperty(exports, "FloorFuncVal", { enumerable: true, get: function () { return FloorFuncVal_1.FloorFuncVal; } });
//# sourceMappingURL=func.js.map