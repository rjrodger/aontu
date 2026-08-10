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
    isExactInBinary64(n)
}


// The binary64 half of the storage contract, on its own: true when an
// exact integer survives a round trip through a double unchanged.
//
// D7's literal rule needs exactly this half and NOT the int64 window --
// 10^20 is outside int64 and is still a perfectly good float-kind value,
// because it lands exactly on a binary64. THE RULE IS EXACTNESS, NOT
// MAGNITUDE: `0x10000000000000000000000000000000` is 2^124, a power of
// two, so it is exact and stays a value, while the very much smaller
// `0x7fffffffffffffff` (2^63-1) is not and is refused.
//
// It is factored out rather than reimplemented so a LITERAL and a
// COMPUTED SUM cannot disagree about what "exact" means: both ask this
// one function, in both ports.
//
// The Number.isFinite guard is what makes it total. A bigint far beyond
// binary64's range converts to Infinity, and BigInt(Infinity) THROWS --
// so a literal like 10^400 (which the lexer already turns into a
// non-finite `not_number`) would crash the test rather than fail it.
function isExactInBinary64(n: bigint): boolean {
  const d = Number(n)
  return Number.isFinite(d) && BigInt(d) === n
}


// D7 -- LOSSY INTEGER LITERALS ARE REFUSED.
//
// True when `src` is an integer-source literal whose exact value cannot
// be held in binary64, so storing it would silently substitute a
// DIFFERENT number. Aontu refuses instead: the caller turns this into a
// located parse error whose hint names the escape (`0d<digits>`).
//
// WHICH LITERALS ARE IN SCOPE. An integer-source literal is one that
// denotes an exact integer:
//
//   - plain decimal digits (`9007199254740993`), with the landed `_`
//     separator rule;
//   - a base-prefixed run (`0x…`, `0o…`, `0b…`);
//   - either of those with a NON-NEGATIVE exponent (`1e21`), which still
//     denotes an integer.
//
// Everything else is out of scope and unchanged. A `.` in the source
// makes it a float literal by R1, so it is not an integer source at all;
// a NEGATIVE exponent (`2e-1`, `1e-400`) denotes a fraction, and testing
// those for binary64 exactness would refuse `2e-1` -- 0.2 is not exactly
// representable either -- which is emphatically not what D7 is about.
// The `0d` family never reaches here: it has its own matcher and its own
// exact leaves.
//
// The value is re-derived from the SOURCE TEXT rather than read off the
// lexed double `n`, because that double is the rounded value this rule
// exists to detect; comparing it with itself would always agree. `n` is
// passed only for the fast path, which is why the signature mirrors
// isIntegerKind's.
function isLossyIntegerLiteral(n: number, src?: string): boolean {
  // No source text (a raw value from an implicit top-level list, a $var
  // binding) means there is no literal to judge -- the same way R1's
  // "no `.` in the source" condition is vacuous at those sites.
  if (null == src) {
    return false
  }

  // FAST PATH, and the one every ordinary document takes: below 2^53
  // every integer is representable, so an integer literal whose ROUNDED
  // value is strictly inside that window cannot have had a different
  // exact value -- a different integer would be at least 1 away, and
  // rounding here is accurate to half a unit. This runs at every numeric
  // literal in every parse, so it must not allocate a bigint (2^53+1 has
  // rounded value 2^53 and is deliberately NOT inside the window).
  if (Number.isInteger(n) && -POW53 < n && n < POW53) {
    return false
  }
  // A `.` makes it a float source (R1), out of scope: checked here, and
  // not left to the patterns below, so the other common literal shape
  // also leaves without touching a regexp.
  if (-1 !== src.indexOf('.')) {
    return false
  }

  let exact: bigint

  const dec = DEC_INT_LITERAL_RE.exec(src)
  if (null != dec) {
    // A negative exponent does not denote an integer -- out of scope.
    const exp = null == dec[3] ? 0 : Number(stripSep(dec[3]))
    if (!(0 <= exp) || !Number.isFinite(exp)) {
      return false
    }
    const coeff = BigInt(stripSep(dec[2]))
    // Zero at any exponent is zero, and zero is exact -- test it before
    // the exponent bound, which would otherwise refuse `0e500`.
    if (0n === coeff) {
      return false
    }
    // Beyond this the value cannot be finite in binary64, so it cannot
    // be exact either -- and 10n ** BigInt(exp) must not be built.
    if (MAX_EXPONENT < exp) {
      return true
    }
    exact = coeff * 10n ** BigInt(exp)
  }
  else {
    const base = BASE_INT_LITERAL_RE.exec(src)
    if (null == base) {
      return false
    }
    exact = BigInt('0' + base[2].toLowerCase() + stripSep(base[3]))
  }

  // The sign is irrelevant to exactness (binary64 is sign-symmetric) and
  // is anyway lexed as the unary prefix, but accept it so the test does
  // not depend on that.
  return !isExactInBinary64(exact)
}


// `[+-]? digits [ (e|E) [+-] digits ]`, with the landed single-`_`-
// between-digits separator rule. No `.`: that is a float source (R1).
const DEC_INT_LITERAL_RE =
  /^([-+]?)([0-9](?:_?[0-9])*)(?:[eE]([-+]?[0-9](?:_?[0-9])*))?$/

// `[+-]? 0(x|o|b) digits`. Hex digits are the widest set, and a bad
// digit for the base simply makes BigInt throw -- which cannot happen,
// since the lexer only produced a token for a well-formed run.
const BASE_INT_LITERAL_RE =
  /^([-+]?)0([xXoObB])([0-9a-fA-F](?:_?[0-9a-fA-F])*)$/

// Above this the value cannot be finite in binary64, so it cannot be
// exact either, and 10n ** BigInt(exp) must not be built.
const MAX_EXPONENT = 400

// 2^53, the point at which the integers stop being contiguous in
// binary64 and so the first magnitude at which a literal can be lossy.
const POW53 = 9007199254740992


function stripSep(s: string): string {
  return -1 === s.indexOf('_') ? s : s.replace(/_/g, '')
}


// The window bounds stay module-local: they are the rules' working
// parts, not API, and every caller wants isIntegerKind or
// isIntegerStorable.
export {
  isExactInBinary64,
  isIntegerKind,
  isIntegerStorable,
  isLossyIntegerLiteral,
}
