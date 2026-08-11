/**
 * Compare two map keys by Unicode CODE POINT.
 *
 * `String.prototype[Symbol.iterator]` yields whole code points, pairing
 * surrogates, so this is a plain lexicographic compare of code point
 * sequences -- the order Go's UTF-8 byte sort produces.
 */
declare function cmpCodePoint(a: string, b: string): number;
export { cmpCodePoint, };
