"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlusOpVal = exports.OpBaseVal = exports.makeScalar = exports.NilVal = exports.PrefVal = exports.VarVal = exports.RefVal = exports.DisjunctVal = exports.ConjunctVal = exports.MapVal = exports.ListVal = exports.ScalarKindVal = exports.Null = exports.Integer = exports.NullVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarVal = exports.TopVal = exports.TOP = exports.FeatureVal = exports.BaseVal = void 0;
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
// Core Val classes
var BaseVal_1 = require("./val/BaseVal");
Object.defineProperty(exports, "BaseVal", { enumerable: true, get: function () { return BaseVal_1.BaseVal; } });
var FeatureVal_1 = require("./val/FeatureVal");
Object.defineProperty(exports, "FeatureVal", { enumerable: true, get: function () { return FeatureVal_1.FeatureVal; } });
// Top level
var TopVal_1 = require("./val/TopVal");
Object.defineProperty(exports, "TOP", { enumerable: true, get: function () { return TopVal_1.TOP; } });
Object.defineProperty(exports, "TopVal", { enumerable: true, get: function () { return TopVal_1.TopVal; } });
// Scalar values
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
var NullVal_1 = require("./val/NullVal");
Object.defineProperty(exports, "NullVal", { enumerable: true, get: function () { return NullVal_1.NullVal; } });
var ScalarKindVal_1 = require("./val/ScalarKindVal");
Object.defineProperty(exports, "Integer", { enumerable: true, get: function () { return ScalarKindVal_1.Integer; } });
Object.defineProperty(exports, "Null", { enumerable: true, get: function () { return ScalarKindVal_1.Null; } });
Object.defineProperty(exports, "ScalarKindVal", { enumerable: true, get: function () { return ScalarKindVal_1.ScalarKindVal; } });
// Container values
var ListVal_1 = require("./val/ListVal");
Object.defineProperty(exports, "ListVal", { enumerable: true, get: function () { return ListVal_1.ListVal; } });
var MapVal_1 = require("./val/MapVal");
Object.defineProperty(exports, "MapVal", { enumerable: true, get: function () { return MapVal_1.MapVal; } });
// Logic values
var ConjunctVal_1 = require("./val/ConjunctVal");
Object.defineProperty(exports, "ConjunctVal", { enumerable: true, get: function () { return ConjunctVal_1.ConjunctVal; } });
var DisjunctVal_1 = require("./val/DisjunctVal");
Object.defineProperty(exports, "DisjunctVal", { enumerable: true, get: function () { return DisjunctVal_1.DisjunctVal; } });
// Reference and variable values
var RefVal_1 = require("./val/RefVal");
Object.defineProperty(exports, "RefVal", { enumerable: true, get: function () { return RefVal_1.RefVal; } });
var VarVal_1 = require("./val/VarVal");
Object.defineProperty(exports, "VarVal", { enumerable: true, get: function () { return VarVal_1.VarVal; } });
// Preference and nil values
var PrefVal_1 = require("./val/PrefVal");
Object.defineProperty(exports, "PrefVal", { enumerable: true, get: function () { return PrefVal_1.PrefVal; } });
var NilVal_1 = require("./val/NilVal");
Object.defineProperty(exports, "NilVal", { enumerable: true, get: function () { return NilVal_1.NilVal; } });
// Utility functions
var valutil_1 = require("./val/valutil");
Object.defineProperty(exports, "makeScalar", { enumerable: true, get: function () { return valutil_1.makeScalar; } });
// Operation values  
var op_1 = require("./op");
Object.defineProperty(exports, "OpBaseVal", { enumerable: true, get: function () { return op_1.OpBaseVal; } });
var op_2 = require("./op");
Object.defineProperty(exports, "PlusOpVal", { enumerable: true, get: function () { return op_2.PlusOpVal; } });
//# sourceMappingURL=val.js.map