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


// Core Val classes
export { BaseVal } from './val/BaseVal'
export { FeatureVal } from './val/FeatureVal'

// Top level
export { TOP, TopVal } from './val/TopVal'

// Scalar values
export { ScalarVal } from './val/ScalarVal'
export { NumberVal } from './val/NumberVal'
export { StringVal } from './val/StringVal'
export { BooleanVal } from './val/BooleanVal'
export { IntegerVal } from './val/IntegerVal'
export { NullVal } from './val/NullVal'
export { Integer, Null, ScalarConstructor, ScalarKindVal } from './val/ScalarKindVal'

// Container values
export { ListVal } from './val/ListVal'
export { MapVal } from './val/MapVal'

// Logic values
export { ConjunctVal } from './val/ConjunctVal'
export { DisjunctVal } from './val/DisjunctVal'

// Reference and variable values
export { RefVal } from './val/RefVal'
export { VarVal } from './val/VarVal'

// Preference and nil values
export { PrefVal } from './val/PrefVal'
export { NilVal } from './val/NilVal'

// Utility functions
export { makeScalar } from './val/valutil'

// Operation values  
export { OpBaseVal } from './op'
export { PlusOpVal } from './op'
