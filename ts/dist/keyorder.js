"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmpCodePoint = cmpCodePoint;
function cmpCodePoint(a, b) {
    const ai = a[Symbol.iterator]();
    const bi = b[Symbol.iterator]();
    for (;;) {
        const x = ai.next();
        const y = bi.next();
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
} /* node:coverage ignore next 6 */
//# sourceMappingURL=keyorder.js.map