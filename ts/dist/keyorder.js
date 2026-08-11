"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmpCodePoint = cmpCodePoint;
/*
 * THE ONE MAP-KEY ORDER, shared by every site that emits keys.
 *
 * Map key order is not meaningful in unification, so both ports sort to
 * make output independent of insertion and unification order. The order
 * they sort into has to be the SAME order, and it was not.
 *
 * JavaScript compares strings by UTF-16 CODE UNIT. An astral character is
 * stored as a surrogate pair beginning D800-DBFF, so `<` puts it BEFORE
 * every character in U+E000-U+FFFF -- ahead of the private use area, of
 * U+FFFD, of U+FFFF. Go sorts map keys as UTF-8 bytes, which is code
 * POINT order, so it puts the astral character last. The two agree on
 * everything below U+D800 and disagree above U+DFFF, which is why this
 * survived: the shared suite had no key above the BMP at all, and three
 * separate comments in the tree asserted the ports already agreed.
 *
 * CODE POINT ORDER WINS, and not merely because Go had it. Go's
 * `generate()` returns a native map, so a consumer's own `json.Marshal`
 * sorts byte-wise no matter what this engine chooses -- picking UTF-16
 * order would leave the TypeScript output disagreeing with what a Go
 * consumer produces from the same document.
 *
 * NOT Buffer.compare, which would be the obvious shortcut. A lone
 * surrogate has no valid UTF-8 encoding, so Buffer.from replaces it with
 * U+FFFD and two DISTINCT keys compare equal -- reintroducing exactly the
 * insertion-order dependence the sort exists to remove. Iterating code
 * points keeps distinct keys distinct.
 */
/**
 * Compare two map keys by Unicode CODE POINT.
 *
 * `String.prototype[Symbol.iterator]` yields whole code points, pairing
 * surrogates, so this is a plain lexicographic compare of code point
 * sequences -- the order Go's UTF-8 byte sort produces.
 */
function cmpCodePoint(a, b) {
    // Fast path: identical strings, and the common all-BMP case where the
    // two orders coincide, still walk the iterator -- but the loop exits at
    // the first differing code point, so it is one pass over the shared
    // prefix rather than any conversion or allocation.
    const ai = a[Symbol.iterator]();
    const bi = b[Symbol.iterator]();
    for (;;) {
        const x = ai.next();
        const y = bi.next();
        // A prefix sorts before the string it is a prefix of, and two equal
        // strings compare 0 -- the same rule a byte compare gives.
        if (x.done) {
            return y.done ? 0 : -1;
        }
        if (y.done) {
            return 1;
        }
        const xc = x.value.codePointAt(0);
        const yc = y.value.codePointAt(0);
        if (xc !== yc) {
            return xc < yc ? -1 : 1;
        }
    }
}
//# sourceMappingURL=keyorder.js.map