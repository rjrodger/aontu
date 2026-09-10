/* Copyright (c) 2026 Richard Rodger, MIT License */


// The half-open code-point span [lo, hi) a (start, len) selects over a
// string of `n` code points.
export function caseSpan(n: number, start: number, len: number): [number, number] {
  const span = len < 0 ? n : len

  if (0 <= start) {
    const lo = Math.min(start, n)
    return [lo, Math.min(lo + span, n)]
  }

  const hi = Math.max(0, n + start)
  return [Math.max(0, hi - span), hi]
}


// `text` with the selected run cased. Outside the run the source is
// returned verbatim, code point for code point.
export function caseRange(
  text: string, start: number, len: number, up: boolean
): string {
  const cps = Array.from(text)
  const [lo, hi] = caseSpan(cps.length, start, len)
  if (hi <= lo) {
    return text
  }
  const mid = cps.slice(lo, hi).join('')
  return cps.slice(0, lo).join('') +
    (up ? mid.toUpperCase() : mid.toLowerCase()) +
    cps.slice(hi).join('')
}


export function rangeArg(v: any): number | undefined {
  if (null == v) {
    return undefined
  }
  const p = (true === v?.isScalar) ? v.peg : undefined
  if ('number' === typeof p && Number.isInteger(p)) {
    return p
  }
  // A biginteger index is an index: a position in a string is small by
  // construction, or it is not an index at all.
  if ('bigint' === typeof p) {
    const n = Number(p)
    if (Number.isSafeInteger(n)) {
      return n
    }
  }
  return NaN
}
