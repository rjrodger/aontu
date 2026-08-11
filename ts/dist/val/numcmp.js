"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaledOfFloat = scaledOfFloat;
exports.scaledOfNumeric = scaledOfNumeric;
exports.cmpScaled = cmpScaled;
exports.cmpNumeric = cmpNumeric;
exports.cmpCodePoints = cmpCodePoints;
exports.towerRank = towerRank;
exports.scaledIsIntegral = scaledIsIntegral;
exports.scaledFloor = scaledFloor;
const F64 = new DataView(new ArrayBuffer(8));
// The exact scaled-decimal value of a finite or infinite binary64.
function scaledOfFloat(f) {
    if (Number.isInteger(f) && Math.abs(f) <= Number.MAX_SAFE_INTEGER) {
        return { unscaled: BigInt(f), scale: 0 };
    }
    if (Infinity === f) {
        return { inf: 1, unscaled: 0n, scale: 0 };
    }
    if (-Infinity === f) {
        return { inf: -1, unscaled: 0n, scale: 0 };
    }
    F64.setFloat64(0, f);
    const hi = BigInt(F64.getUint32(0));
    const lo = BigInt(F64.getUint32(4));
    const bits = (hi << 32n) | lo;
    const sign = (bits >> 63n) & 1n ? -1n : 1n;
    const expBits = Number((bits >> 52n) & 0x7ffn);
    const frac = bits & 0xfffffffffffffn;
    // Normal: implicit leading bit, exponent bias 1023 plus the 52
    // fraction bits. Subnormal: no implicit bit, fixed exponent -1074.
    let mant;
    let exp;
    if (0 === expBits) {
        mant = frac;
        exp = -1074;
    }
    else {
        mant = frac | (1n << 52n);
        exp = expBits - 1075;
    }
    if (0 <= exp) {
        return { unscaled: sign * (mant << BigInt(exp)), scale: 0 };
    }
    // mant * 2^-k == mant * 5^k / 10^k, exactly.
    return { unscaled: sign * mant * 5n ** BigInt(-exp), scale: -exp };
}
// The exact scaled-decimal value of any numeric leaf Val.
function scaledOfNumeric(v) {
    if (v.isBigInteger) {
        return { unscaled: v.peg, scale: 0 };
    }
    if (v.isBigDecimal) {
        const d = v.peg;
        return { unscaled: d.unscaled, scale: d.scale };
    }
    // integer and float leaves both hold a binary64.
    return scaledOfFloat(v.peg);
}
function pow10(n) {
    return 10n ** BigInt(n);
}
// Exact three-way comparison of two scaled decimals.
function cmpScaled(a, b) {
    const ai = a.inf ?? 0;
    const bi = b.inf ?? 0;
    if (0 !== ai || 0 !== bi) {
        return ai < bi ? -1 : ai > bi ? 1 : 0;
    }
    let au = a.unscaled;
    let bu = b.unscaled;
    if (a.scale < b.scale) {
        au *= pow10(b.scale - a.scale);
    }
    else if (b.scale < a.scale) {
        bu *= pow10(a.scale - b.scale);
    }
    return au < bu ? -1 : au > bu ? 1 : 0;
}
// Exact three-way comparison of two numeric leaf Vals, any leaves.
function cmpNumeric(a, b) {
    return cmpScaled(scaledOfNumeric(a), scaledOfNumeric(b));
}
// Lexical comparison by Unicode CODE POINTS — not UTF-16 code units,
// which order astral-plane text differently. Go compares strings
// byte-wise in UTF-8, which IS code-point order, so this is the side
// that must adapt (a Phase 0 decision, docs/reference-language.md).
function cmpCodePoints(a, b) {
    let ai = 0;
    let bi = 0;
    while (ai < a.length && bi < b.length) {
        const ac = a.codePointAt(ai);
        const bc = b.codePointAt(bi);
        if (ac !== bc) {
            return ac < bc ? -1 : 1;
        }
        ai += ac > 0xffff ? 2 : 1;
        bi += bc > 0xffff ? 2 : 1;
    }
    const ar = a.length - ai;
    const br = b.length - bi;
    return ar < br ? -1 : ar > br ? 1 : 0;
}
// The tower order integer < float < biginteger < bigdecimal, used when
// two endpoints at the SAME point meet: the survivor is the
// tower-lowest spelling (docs/reference-language.md, bounds ruling 2).
function towerRank(v) {
    return v.isBigDecimal ? 3 : v.isBigInteger ? 2 :
        v.isInteger ? 0 : 1;
}
// True when the scaled value is integral (an exact whole number).
function scaledIsIntegral(s) {
    if (s.inf) {
        return false;
    }
    if (0 === s.scale) {
        return true;
    }
    const p = pow10(s.scale);
    return 0n === s.unscaled % p;
}
// The exact floor of a scaled value, as a bigint. Infinite inputs are
// the caller's job to exclude.
function scaledFloor(s) {
    if (0 === s.scale) {
        return s.unscaled;
    }
    const p = pow10(s.scale);
    const q = s.unscaled / p;
    // BigInt division truncates toward zero; floor rounds down.
    return (s.unscaled < 0n && 0n !== s.unscaled % p) ? q - 1n : q;
}
//# sourceMappingURL=numcmp.js.map