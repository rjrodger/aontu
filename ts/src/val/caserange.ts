/* Copyright (c) 2026 Richard Rodger, MIT License */

// THE RANGE `upper` AND `lower` TAKE.
//
//   upper(s)              the whole string
//   upper(s, start)       from `start` to the end
//   upper(s, start, len)  `len` characters
//
// `start` IS A BOUNDARY, NOT A CHARACTER. Zero or positive, it is
// where the run BEGINS and the run reaches forward; negative, it counts
// from the end and is where the run STOPS -- the character it lands on
// is the first one NOT modified. One index, two directions, and no
// second argument to say which:
//
//   upper("foo", 0, 1)      "Foo"      begins at 0, one character
//   lower("FOOBAR", -3, -1) "fooBAR"   stops before the last three
//
// `len` of -1 means THE LENGTH OF THE SOURCE, which is how "and the
// rest of it" is spelled in either direction, and is also the default:
//
//   lower("FOO", 1, -1)     "Foo"      from 1 to the end
//   lower("FOOBAR", -1)     "foobaR"   everything but the last
//
// The exclusive reading is why `-0` is not a spelling: it is `0`, and
// so begins a forward run. The whole string is `upper(s)`.
//
// BOTH ENDS CLAMP rather than refuse. A run reaching past either end
// modifies as much of the string as exists, and one that lands wholly
// outside it modifies nothing — an out-of-range index is not a
// different KIND of answer, it is the same answer over a shorter run.
//
// CODE POINTS, NOT UTF-16 UNITS, so an index means the same thing in
// both ports: one index is one Go rune. Twin: caseSpan/caseRange in
// go/func.go.
//
// THE CASE MAPPING IS THE WHOLE-STRING ONE, applied to the slice, so
// `upper(s)` and `upper(s, 0, -1)` are the same bytes. Two consequences
// follow from full Unicode case mapping and are properties of the
// mapping rather than of this range:
//
//   - THE RESULT MAY BE LONGER than the source, because full mapping is
//     not one-in-one-out: `upper("straße", 3, 3)` is "straSSE".
//   - FINAL SIGMA IS DECIDED WITHIN THE SLICE, since a slice taken out
//     of its word has no following letter to see. A medial sigma cased
//     alone lowercases as a final one.
//
// Both are stated here rather than worked around: silently widening
// the slice to keep context would make the run something other than
// what the author asked for.


// The half-open code-point span [lo, hi) a (start, len) selects over a
// string of `n` code points.
export function caseSpan(n: number, start: number, len: number): [number, number] {
  // -1 is the source's length, and so is any other negative: there is
  // no meaningful run of "minus two" characters, and refusing one would
  // be a second rule for no gain.
  const span = len < 0 ? n : len

  if (0 <= start) {
    const lo = Math.min(start, n)
    return [lo, Math.min(lo + span, n)]
  }

  // A negative start is where the run STOPS: the character it lands on
  // is the first one not modified, so the run reaches back from it. No
  // upper clamp: start is negative here, so n+start is below n by
  // construction.
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


// The integer a range argument carries, or undefined when it is not
// one. `undefined` for an absent argument is the caller's default, not
// a refusal — these are optional.
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
  // ONE REFUSAL for every way an argument can fail to be an index: not
  // a scalar at all (a preference reaches here, the signature gate
  // having nothing to check), a scalar of another kind, or a biginteger
  // too large to be a position in a string.
  return NaN
}
