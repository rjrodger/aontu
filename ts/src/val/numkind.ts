/* Copyright (c) 2025 Richard Rodger, MIT License */


const INT64_MIN = -9223372036854775808.0
const INT64_LIMIT = 9223372036854775808.0


function isIntegerKind(n: number, src?: string): boolean {
  if (null != src && src.includes('.')) {
    return false
  }
  return Number.isInteger(n) && INT64_MIN <= n && n < INT64_LIMIT
}


const INT64_MIN_EXACT = -9223372036854775808n
const INT64_LIMIT_EXACT = 9223372036854775808n


function isIntegerStorable(n: bigint): boolean {
  return INT64_MIN_EXACT <= n && n < INT64_LIMIT_EXACT &&
    isExactInBinary64(n)
}


function isExactInBinary64(n: bigint): boolean {
  const d = Number(n)
  return Number.isFinite(d) && BigInt(d) === n
}


function isLossyIntegerLiteral(n: number, src?: string): boolean {
  if (null == src) {
    return false
  }

  if (Number.isInteger(n) && -POW53 < n && n < POW53) {
    return false
  }
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
    if (0n === coeff) {
      return false
    }
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

  return !isExactInBinary64(exact)
}


// `[+-]? digits [ (e|E) [+-] digits ]`, with the landed single-`_`-
// between-digits separator rule. No `.`: that is a float source (R1).
const DEC_INT_LITERAL_RE =
  /^([-+]?)([0-9](?:_?[0-9])*)(?:[eE]([-+]?[0-9](?:_?[0-9])*))?$/

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


function integerDigits(peg: number): string {
  return BigInt(peg).toString()
} /* node:coverage ignore next 13 */


export {
  integerDigits,
  isExactInBinary64,
  isIntegerKind,
  isIntegerStorable,
  isLossyIntegerLiteral,
}
