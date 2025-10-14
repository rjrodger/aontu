"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisjunctVal = exports.ConjunctVal = exports.PrefVal = exports.MapVal = exports.ListVal = exports.VarVal = exports.NullVal = exports.NilVal = exports.RefVal = exports.BaseVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarVal = exports.ScalarKindVal = exports.Integer = exports.PlusOpVal = exports.OpBaseVal = exports.TopVal = exports.TOP = void 0;
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
var op_1 = require("./op");
Object.defineProperty(exports, "OpBaseVal", { enumerable: true, get: function () { return op_1.OpBaseVal; } });
var op_2 = require("./op");
Object.defineProperty(exports, "PlusOpVal", { enumerable: true, get: function () { return op_2.PlusOpVal; } });
var ScalarKindVal_1 = require("./val/ScalarKindVal");
Object.defineProperty(exports, "Integer", { enumerable: true, get: function () { return ScalarKindVal_1.Integer; } });
Object.defineProperty(exports, "ScalarKindVal", { enumerable: true, get: function () { return ScalarKindVal_1.ScalarKindVal; } });
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
var BaseVal_1 = require("./val/BaseVal");
Object.defineProperty(exports, "BaseVal", { enumerable: true, get: function () { return BaseVal_1.BaseVal; } });
var RefVal_1 = require("./val/RefVal");
Object.defineProperty(exports, "RefVal", { enumerable: true, get: function () { return RefVal_1.RefVal; } });
var NilVal_1 = require("./val/NilVal");
Object.defineProperty(exports, "NilVal", { enumerable: true, get: function () { return NilVal_1.NilVal; } });
var NullVal_1 = require("./val/NullVal");
Object.defineProperty(exports, "NullVal", { enumerable: true, get: function () { return NullVal_1.NullVal; } });
var VarVal_1 = require("./val/VarVal");
Object.defineProperty(exports, "VarVal", { enumerable: true, get: function () { return VarVal_1.VarVal; } });
var ListVal_1 = require("./val/ListVal");
Object.defineProperty(exports, "ListVal", { enumerable: true, get: function () { return ListVal_1.ListVal; } });
var MapVal_1 = require("./val/MapVal");
Object.defineProperty(exports, "MapVal", { enumerable: true, get: function () { return MapVal_1.MapVal; } });
var PrefVal_1 = require("./val/PrefVal");
Object.defineProperty(exports, "PrefVal", { enumerable: true, get: function () { return PrefVal_1.PrefVal; } });
var ConjunctVal_1 = require("./val/ConjunctVal");
Object.defineProperty(exports, "ConjunctVal", { enumerable: true, get: function () { return ConjunctVal_1.ConjunctVal; } });
var DisjunctVal_1 = require("./val/DisjunctVal");
Object.defineProperty(exports, "DisjunctVal", { enumerable: true, get: function () { return DisjunctVal_1.DisjunctVal; } });
//# sourceMappingURL=val.js.map