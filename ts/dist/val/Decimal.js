"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decimal = exports.DECIMAL_SCALE_BUDGET = exports.DECIMAL_COEFFICIENT_BUDGET = exports.BIG_LITERAL_RE = void 0;
exports.readBigLiteral = readBigLiteral;
/*
 * The exact base-10 decimal value behind the `bigdecimal` leaf, and the
 * parser for the `0d` literal family that reaches both exact leaves.
 *
 * A Decimal is a coefficient and a scale:
 *
 *   value = unscaled / 10^scale
 *
 * with `unscaled` a native bigint and `scale` a plain integer. There is
 * NO arithmetic here beyond negation: aontu's numeric operator surface
 * (`+`, `upper()`, `lower()`, unary minus) is exact, so no rounding
 * context, precision or rounding mode exists anywhere in this file. The
 * `+` ladder lands in a later phase.
 *
 * D4 -- ONE VALUE, ONE RENDERING. In a unifier canon must be a function
 * of the value, so scale is presentation and not identity: `0d0.10`,
 * `0d0.1` and `0d1e-1` are the same lattice point and must render
 * identically. A Decimal therefore NORMALISES IN ITS CONSTRUCTOR --
 * every Decimal in existence is in minimal form, which is what makes
 * `equals` a two-field comparison and `same()` correct without any
 * pointer identity (D2).
 *
 * The minimal form keeps ONE decimal place at the bottom. `0d` names the
 * numeric FAMILY, not the leaf, so an integral bigdecimal that rendered
 * as `0d1000` would reparse as a biginteger -- a kind-flipping canon of
 * exactly the sort R4's `.0` suffix exists to prevent. So `0d1e3` canons
 * as `0d1000.0`, and scale is never reduced below 1.
 *
 * Go mirror (D8): a struct of (coeff *big.Int, scale int32) normalised
 * by the same rule -- strip trailing zeros while scale > 1, then raise
 * the scale to 1 when it is lower, zero always at scale 1.
 */
// D6 -- THE EXACTNESS BUDGET, enforced at parse.
//
// Both halves are needed and the scale half is the load-bearing one: a
// coefficient-only check never fires for `0d1e1000000000`, whose
// coefficient is one digit, yet plain-form rendering of that value would
// have to materialise a gigabyte of zeros (and overflow the Go port's
// int32 scale field) without any arithmetic having occurred.
//
// A literal over either bound is a located error, never a rounded or
// expanded value: this language does not round, so the only honest
// answer at the limit is refusal.
const DECIMAL_COEFFICIENT_BUDGET = 4096;
exports.DECIMAL_COEFFICIENT_BUDGET = DECIMAL_COEFFICIENT_BUDGET;
const DECIMAL_SCALE_BUDGET = 4096;
exports.DECIMAL_SCALE_BUDGET = DECIMAL_SCALE_BUDGET;
// Powers of ten as bigints, memoised: normalisation of an
// exponent-bearing literal needs one per parse.
function pow10(n) {
    return 10n ** BigInt(n);
}
// True when a decimal's SOURCE form is over either budget bound.
//
// Every route that builds a Decimal from text must ask this BEFORE
// constructing one, because normalising an over-budget value is itself
// the resource event the bound exists to prevent: the constructor folds
// a negative scale by multiplying the coefficient by 10^-scale, so
// `1e1000000000` would try to build a billion-digit bigint.
//
// Written once and used by both routes -- the `0d` literal and the
// exact-input API -- because the Go port bounds both (NewBigDecimal
// shares the literal path's checker) and a TypeScript route that did not
// would be a silent cross-port divergence as well as a hazard.
//
// `scale` may be Infinity or NaN when the exponent digits overflow a JS
// number; the comparison is written so that either answers "over".
function overBudget(coeffDigits, scale) {
    return DECIMAL_COEFFICIENT_BUDGET < coeffDigits ||
        !(Math.abs(scale) <= DECIMAL_SCALE_BUDGET);
}
class Decimal {
    constructor(unscaled, scale) {
        let u = unscaled;
        let s = Math.trunc(scale);
        if (0n === u) {
            // R2/D5: there is no negative zero here to begin with (a bigint
            // has one zero), and every zero is the same lattice point, so it
            // takes the one canonical form `0d0.0`.
            s = 1;
        }
        else {
            // Strip the trailing zeros that scale-as-presentation would
            // otherwise smuggle into identity (`0d0.10` -> `0d0.1`)...
            while (1 < s && 0n === u % 10n) {
                u /= 10n;
                s--;
            }
            // ...and fold a negative scale (an exponent) back up to the one
            // decimal place the leaf marker requires (`0d1e3` -> 10000/10^1).
            if (s < 1) {
                u *= pow10(1 - s);
                s = 1;
            }
        }
        this.unscaled = u;
        this.scale = s;
    }
    // Exact numeric equality. Both operands are normalised by
    // construction, so equal values have equal fields -- this is value
    // comparison, never object identity (D2).
    equals(peer) {
        return this.unscaled === peer.unscaled && this.scale === peer.scale;
    }
    // Exact ordering: -1, 0 or 1. Compares on a common scale, so no
    // float64 ever touches the operands.
    compare(peer) {
        let a = this.unscaled;
        let b = peer.unscaled;
        if (this.scale < peer.scale) {
            a *= pow10(peer.scale - this.scale);
        }
        else if (peer.scale < this.scale) {
            b *= pow10(this.scale - peer.scale);
        }
        return a < b ? -1 : a > b ? 1 : 0;
    }
    // Exact negation, keeping the leaf. -0 folds to 0 (D5) because the
    // normalising constructor sends every zero to the same form.
    negate() {
        return new Decimal(-this.unscaled, this.scale);
    }
    isZero() {
        return 0n === this.unscaled;
    }
    // Plain digits, no `0d` marker: `1000.0`, `-0.1`. Plain form at every
    // magnitude, never scientific -- the budget is what makes that safe.
    // This is also the rendering string concatenation will want in Phase 4
    // (`"q" + 0d0.1` is `"q0.1"`), which is why the marker lives in
    // `canon()` and not here.
    toString() {
        const neg = this.unscaled < 0n;
        let d = (neg ? -this.unscaled : this.unscaled).toString();
        if (d.length <= this.scale) {
            d = '0'.repeat(this.scale - d.length + 1) + d;
        }
        const cut = d.length - this.scale;
        return (neg ? '-' : '') + d.slice(0, cut) + '.' + d.slice(cut);
    }
    // Canon rendering: the sign goes BEFORE the marker (`-0d1.5`), because
    // `0d-1.5` is not a literal this language accepts.
    canon() {
        const neg = this.unscaled < 0n;
        return (neg ? '-0d' : '0d') + (neg ? this.negate() : this).toString();
    }
    // Exact-input construction for library consumers (D8). A JS `number`
    // argument is already rounded before this library could inspect it, so
    // the exact leaves are reachable only from a bigint or from text.
    // Accepts `[+-]?digits[.digits][(e|E)[+-]digits]`, with or without the
    // `0d` marker, and no `_` separators (those are literal syntax).
    static fromString(src) {
        const m = /^([-+]?)(?:0[dD])?([0-9]+)(?:\.([0-9]+))?(?:[eE]([-+]?[0-9]+))?$/
            .exec(src);
        if (null == m) {
            throw new Error('not-decimal: ' + src);
        }
        const frac = m[3] ?? '';
        const exp = null == m[4] ? 0 : Number(m[4]);
        const scale = frac.length - exp;
        // The same bound the `0d` literal obeys (D6). Without it this API
        // route reached the resource exhaustion the budget exists to
        // prevent -- `fromString('1e1000000000')` would normalise by
        // building a billion-digit coefficient -- and disagreed with the Go
        // port, whose NewBigDecimal shares the literal path's checker.
        if (overBudget(m[2].length + frac.length, scale)) {
            throw new Error('decimal-budget: ' + src);
        }
        const unscaled = BigInt(m[2] + frac);
        return new Decimal('-' === m[1] ? -unscaled : unscaled, scale);
    }
}
exports.Decimal = Decimal;
// D3 -- THE `0d` LITERAL.
//
//   0[dD] digits [ . digits ] [ (e|E) [+-] digits ]
//
// with single `_` separators between digits, exactly as the landed
// separator rule allows for ordinary numbers (`[0-9](?:_?[0-9])*` admits
// `1_000` and refuses `1__0`, `_1`, `1_`).
//
// LEAF BY SOURCE, mirroring R1's precedent that the source text and not
// the value decides the kind: digits only is a biginteger, a `.` or an
// exponent anywhere makes it a bigdecimal. So `0d5` is a biginteger and
// `0d1e3` is a bigdecimal whose value happens to be integral.
//
// THE SIGN IS NOT PART OF THIS PATTERN, though it is part of the D3
// grammar: `-0d5` is read as the existing unary-minus prefix applied to
// `0d5` (see negative-prefix in lang.ts), exactly as `-1.5` already is.
// Aontu's lexer runs regexp value matchers BEFORE the fixed-token
// matcher, so a `[-+]?` here would claim the `+` of `0d1 +0d2` as a
// literal sign and silently turn an addition into an implicit list --
// while plain `1 +2` stayed an addition. The sign belongs to the same
// operator for both, which is also what keeps `0d-5` rejected.
//
// Kept RE2-compatible (no lookaround, no backreferences) so the Go port
// can use the byte-identical pattern.
const BIG_LITERAL_RE = /^0[dD]([0-9](?:_?[0-9])*)(?:\.([0-9](?:_?[0-9])*))?(?:[eE]([-+]?[0-9](?:_?[0-9])*))?/;
exports.BIG_LITERAL_RE = BIG_LITERAL_RE;
function stripSep(s) {
    return -1 === s.indexOf('_') ? s : s.replace(/_/g, '');
}
// Read a `0d` literal from the groups of BIG_LITERAL_RE:
//   1 integer digits, 2 fraction digits, 3 exponent.
function readBigLiteral(m) {
    const intd = stripSep(m[1]);
    const fracd = null == m[2] ? undefined : stripSep(m[2]);
    const expd = null == m[3] ? undefined : stripSep(m[3]);
    // Leaf by SOURCE, not by value.
    if (undefined === fracd && undefined === expd) {
        return { leaf: 'biginteger', int: BigInt(intd) };
    }
    // The exponent is read as a plain number on purpose: a 4000-digit
    // exponent lands on Infinity, whose absolute value is over budget, so
    // the refusal below fires without any bigint ever being built.
    const exp = undefined === expd ? 0 : Number(expd);
    const fracLen = undefined === fracd ? 0 : fracd.length;
    const scale = fracLen - exp;
    // The budget is checked on the SOURCE form, before normalisation:
    // normalising `0d1e1000000000` is itself the resource event the bound
    // exists to prevent. Coefficient digits are counted as written
    // (leading zeros included) so the two ports need not agree on any
    // cleverer rule.
    if (overBudget(intd.length + fracLen, scale)) {
        return { leaf: 'error', code: 'decimal_budget' };
    }
    return {
        leaf: 'bigdecimal',
        dec: new Decimal(BigInt(intd + (fracd ?? '')), scale),
    };
}
//# sourceMappingURL=Decimal.js.map