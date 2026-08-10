/* Copyright (c) 2025 Richard Rodger, MIT License */

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
const INT64_MIN = -9223372036854775808.0
const INT64_LIMIT = 9223372036854775808.0


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
function isIntegerKind(n: number, src?: string): boolean {
  if (null != src && src.includes('.')) {
    return false
  }
  // Number.isInteger is false for NaN and both infinities, so a
  // non-finite value never reaches the range test.
  return Number.isInteger(n) && INT64_MIN <= n && n < INT64_LIMIT
}


// The same int64 window, exactly, for values that were computed as
// bigints and have not been through a double yet.
const INT64_MIN_EXACT = -9223372036854775808n
const INT64_LIMIT_EXACT = 9223372036854775808n


// D6 -- THE STORAGE CONTRACT FOR AN EXACTLY COMPUTED INTEGER.
//
// `integer + integer` is computed exactly (in bigint here, in checked
// int64 in Go) and the exact answer is only then offered to the integer
// leaf, which accepts it when it is integral (a bigint always is),
// within the int64 window, AND exactly representable in binary64.
//
// The binary64 half is the parity-critical one. Go's int64 can hold sums
// this port's double cannot -- 2^53+1 among them -- so a test written
// only against the int64 window would let Go store `9007199254740993`
// while TypeScript silently stored `...992`. The round-trip through
// Number() is that test: it is true exactly when nothing was lost. Both
// ports must refuse the same sums, which is why this is the shared
// contract and not a local convenience.
//
// Refusal, not rounding: a sum that fails here is a located error whose
// hint points at `0d` for an exact integer, per R1's own storage rule
// applied to a result rather than a literal.
function isIntegerStorable(n: bigint): boolean {
  return INT64_MIN_EXACT <= n && n < INT64_LIMIT_EXACT &&
    BigInt(Number(n)) === n
}


// The window bounds stay module-local: they are the rules' working
// parts, not API, and every caller wants isIntegerKind or
// isIntegerStorable.
export {
  isIntegerKind,
  isIntegerStorable,
}
