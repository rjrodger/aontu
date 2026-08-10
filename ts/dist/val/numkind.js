"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIntegerKind = isIntegerKind;
/*
 * Numeric kind classification, shared by every site that turns a raw
 * JavaScript number into an IntegerVal or a NumberVal (the aontu val
 * rule, rawToVal, VarVal, the `+` operator, upper()/lower()). Keeping
 * the test in one place stops those sites from drifting apart, and
 * stops them drifting from the Go port (see isIntegerKind in
 * go/lang.go).
 *
 * This module deliberately imports nothing: IntegerVal itself needs the
 * test for its constructor guard, so any import here risks a cycle.
 */
// The int64 range, as exact float64 bounds. -2^63 and 2^63 are both
// exactly representable; 2^63-1 is NOT (it rounds up to 2^63), which is
// why the upper bound is exclusive and 0x7fffffffffffffff correctly
// falls outside.
const INT64_MIN = -9223372036854775808.0;
const INT64_LIMIT = 9223372036854775808.0;
// True when a numeric literal has *integer* kind. All three conditions
// must hold:
//   (a) the source text, when there is any, contains no '.'
//   (b) the value is integral
//   (c) the value lies within the int64 range
//
// The range test is written against the float64 bounds rather than as
// `n === Number(BigInt(n))` or Go's `n == float64(int64(n))`: converting
// an out-of-range float64 to int64 is implementation-defined in Go, and
// that accident is exactly what the two ports used to disagree about.
//
// `src` is undefined at construction sites with no source text (raw
// values from an implicit top-level list, or a $var binding); there
// condition (a) is vacuous and (b)+(c) decide.
function isIntegerKind(n, src) {
    if (null != src && src.includes('.')) {
        return false;
    }
    // Number.isInteger is false for NaN and both infinities, so a
    // non-finite value never reaches the range test.
    return Number.isInteger(n) && INT64_MIN <= n && n < INT64_LIMIT;
}
//# sourceMappingURL=numkind.js.map