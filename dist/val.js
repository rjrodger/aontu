"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisjunctVal = exports.ConjunctVal = exports.PrefVal = exports.PlusVal = exports.OpVal = exports.MapVal = exports.ListVal = exports.VarVal = exports.NullVal = exports.Nil = exports.RefVal = exports.ValBase = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarVal = exports.ScalarTypeVal = exports.Integer = exports.TopVal = exports.TOP = void 0;
// NOTES
// - Vals are immutable
// - each Val must handle all parent and child unifications explicitly
// - performance is not considered yet
/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer
    -> Scalar/Integer -> IntegerVal

*/
var TopVal_1 = require("./val/TopVal");
Object.defineProperty(exports, "TOP", { enumerable: true, get: function () { return TopVal_1.TOP; } });
Object.defineProperty(exports, "TopVal", { enumerable: true, get: function () { return TopVal_1.TopVal; } });
var ScalarTypeVal_1 = require("./val/ScalarTypeVal");
Object.defineProperty(exports, "Integer", { enumerable: true, get: function () { return ScalarTypeVal_1.Integer; } });
Object.defineProperty(exports, "ScalarTypeVal", { enumerable: true, get: function () { return ScalarTypeVal_1.ScalarTypeVal; } });
var ScalarVal_1 = require("./val/ScalarVal");
Object.defineProperty(exports, "ScalarVal", { enumerable: true, get: function () { return ScalarVal_1.ScalarVal; } });
var NumberVal_1 = require("./val/NumberVal");
Object.defineProperty(exports, "NumberVal", { enumerable: true, get: function () { return NumberVal_1.NumberVal; } });
var StringVal_1 = require("./val/StringVal");
Object.defineProperty(exports, "StringVal", { enumerable: true, get: function () { return StringVal_1.StringVal; } });
var BooleanVal_1 = require("./val/BooleanVal");
Object.defineProperty(exports, "BooleanVal", { enumerable: true, get: function () { return BooleanVal_1.BooleanVal; } });
var IntegerVal_1 = require("./val/IntegerVal");
Object.defineProperty(exports, "IntegerVal", { enumerable: true, get: function () { return IntegerVal_1.IntegerVal; } });
var ValBase_1 = require("./val/ValBase");
Object.defineProperty(exports, "ValBase", { enumerable: true, get: function () { return ValBase_1.ValBase; } });
var RefVal_1 = require("./val/RefVal");
Object.defineProperty(exports, "RefVal", { enumerable: true, get: function () { return RefVal_1.RefVal; } });
var Nil_1 = require("./val/Nil");
Object.defineProperty(exports, "Nil", { enumerable: true, get: function () { return Nil_1.Nil; } });
var NullVal_1 = require("./val/NullVal");
Object.defineProperty(exports, "NullVal", { enumerable: true, get: function () { return NullVal_1.NullVal; } });
var VarVal_1 = require("./val/VarVal");
Object.defineProperty(exports, "VarVal", { enumerable: true, get: function () { return VarVal_1.VarVal; } });
var ListVal_1 = require("./val/ListVal");
Object.defineProperty(exports, "ListVal", { enumerable: true, get: function () { return ListVal_1.ListVal; } });
var MapVal_1 = require("./val/MapVal");
Object.defineProperty(exports, "MapVal", { enumerable: true, get: function () { return MapVal_1.MapVal; } });
var OpVal_1 = require("./val/OpVal");
Object.defineProperty(exports, "OpVal", { enumerable: true, get: function () { return OpVal_1.OpVal; } });
var PlusVal_1 = require("./val/PlusVal");
Object.defineProperty(exports, "PlusVal", { enumerable: true, get: function () { return PlusVal_1.PlusVal; } });
var PrefVal_1 = require("./val/PrefVal");
Object.defineProperty(exports, "PrefVal", { enumerable: true, get: function () { return PrefVal_1.PrefVal; } });
var ConjunctVal_1 = require("./val/ConjunctVal");
Object.defineProperty(exports, "ConjunctVal", { enumerable: true, get: function () { return ConjunctVal_1.ConjunctVal; } });
var DisjunctVal_1 = require("./val/DisjunctVal");
Object.defineProperty(exports, "DisjunctVal", { enumerable: true, get: function () { return DisjunctVal_1.DisjunctVal; } });
//# sourceMappingURL=val.js.map