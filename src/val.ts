/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


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


export { TOP, TopVal } from './val/TopVal'
export { OpBaseVal } from './op'
export { PlusOpVal } from './op'
export { Integer, ScalarConstructor, ScalarKindVal } from './val/ScalarKindVal'
export { ScalarVal } from './val/ScalarVal'
export { NumberVal } from './val/NumberVal'
export { StringVal } from './val/StringVal'
export { BooleanVal } from './val/BooleanVal'
export { IntegerVal } from './val/IntegerVal'
export { BaseVal } from './val/BaseVal'
export { RefVal } from './val/RefVal'
export { Nil } from './val/Nil'
export { NullVal } from './val/NullVal'
export { VarVal } from './val/VarVal'
export { ListVal } from './val/ListVal'
export { MapVal } from './val/MapVal'
export { PrefVal } from './val/PrefVal'
export { ConjunctVal } from './val/ConjunctVal'
export { DisjunctVal } from './val/DisjunctVal'
