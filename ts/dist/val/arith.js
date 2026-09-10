"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.arith = arith;
const err_1 = require("../err");
const IntegerVal_1 = require("./IntegerVal");
const NumberVal_1 = require("./NumberVal");
const BigIntegerVal_1 = require("./BigIntegerVal");
const BigDecimalVal_1 = require("./BigDecimalVal");
const Decimal_1 = require("./Decimal");
const numkind_1 = require("./numkind");
// The three that divide, and therefore the three that can be handed a
// zero divisor and cannot answer over the decimal leaf.
function divides(op) {
    return 'div' === op || 'mod' === op || 'rem' === op;
}
const EXACT_RANK = {
    integer: 1,
    biginteger: 2,
    bigdecimal: 3,
};
function isBig(k) {
    return 'biginteger' === k || 'bigdecimal' === k;
}
// A pref operand contributes its preferred value, and therefore that
// value's kind too -- the same rule `+` applies.
function unpref(v) {
    while (v?.isPref) {
        v = v.peg;
    }
    return v;
}
function arithKind(v) {
    if (true !== v?.isScalar) {
        return undefined;
    }
    if (v.isBigInteger) {
        return 'biginteger';
    }
    if (v.isBigDecimal) {
        return 'bigdecimal';
    }
    if (v.isInteger) {
        return 'integer';
    }
    return 'number' === typeof v.peg ? 'float' : undefined;
}
function asInteger(v, k) {
    return 'biginteger' === k ? v.peg : BigInt(v.peg);
}
function asDecimal(v, k) {
    return 'bigdecimal' === k ? v.peg : new Decimal_1.Decimal(asInteger(v, k), 0);
}
function arith(ctx, op, node, a, b, attempt) {
    const name = attempt ?? op;
    const av = unpref(a);
    const bv = unpref(b);
    const ak = arithKind(av);
    const bk = arithKind(bv);
    if (undefined === ak || undefined === bk) {
        return (0, err_1.makeNilErr)(ctx, 'invalid-arg', node, undefined, name);
    }
    // A big leaf never silently becomes a binary float, in EITHER operand
    // order. The error names both leaves in operand order.
    if (('float' === ak && isBig(bk)) || (isBig(ak) && 'float' === bk)) {
        return (0, err_1.makeNilErr)(ctx, 'exact_float_mix', node, undefined, name, { left: ak, right: bk });
    }
    if ('float' === ak || 'float' === bk) {
        return floatArith(ctx, op, name, node, av.peg, bv.peg);
    }
    const rank = EXACT_RANK[bk] < EXACT_RANK[ak] ? EXACT_RANK[ak] : EXACT_RANK[bk];
    if (EXACT_RANK.bigdecimal === rank) {
        return decimalArith(ctx, op, name, node, asDecimal(av, ak), asDecimal(bv, bk));
    }
    return integerArith(ctx, op, name, node, asInteger(av, ak), asInteger(bv, bk), EXACT_RANK.biginteger === rank);
}
function floatArith(ctx, op, name, node, x, y) {
    if (divides(op) && 0 === y) {
        return (0, err_1.makeNilErr)(ctx, 'divide_by_zero', node, undefined, name);
    }
    const out = 'add' === op ? x + y :
        'sub' === op ? x - y :
            'mul' === op ? x * y :
                'div' === op ? x / y :
                    // Truncated remainder, sign following the DIVIDEND, which is
                    // what JavaScript's `%` and Go's math.Mod both give...
                    'rem' === op ? x % y :
                        flooredMod(x % y, y);
    return Number.isFinite(out) ?
        new NumberVal_1.NumberVal({ peg: out }) :
        (0, err_1.makeNilErr)(ctx, 'float_overflow', node, undefined, name);
}
function flooredMod(rem, y) {
    return 0 !== rem && (rem < 0) !== (y < 0) ? rem + y : rem;
}
// The exact integral leaves. Both compute in bigint, so nothing passes
// through binary64 and nothing rounds; only the storage test at the end
// differs, because `biginteger` is unbounded and `integer` is not.
function integerArith(ctx, op, name, node, x, y, big) {
    if (divides(op) && 0n === y) {
        return (0, err_1.makeNilErr)(ctx, 'divide_by_zero', node, undefined, name);
    }
    const out = 'add' === op ? x + y :
        'sub' === op ? x - y :
            'mul' === op ? x * y :
                'div' === op ? x / y :
                    'rem' === op ? x % y :
                        flooredModBig(x % y, y);
    if (big) {
        // Unbounded and exact: nothing to check, and no demotion to
        // `integer` however small the result.
        return new BigIntegerVal_1.BigIntegerVal({ peg: out });
    }
    return (0, numkind_1.isIntegerStorable)(out) ?
        new IntegerVal_1.IntegerVal({ peg: Number(out) }) :
        (0, err_1.makeNilErr)(ctx, 'inexact_integer_sum', node, undefined, name, { sum: out.toString() });
}
function flooredModBig(rem, y) {
    return 0n !== rem && (rem < 0n) !== (y < 0n) ? rem + y : rem;
}
// The decimal leaf. Addition, subtraction and multiplication are exact
// coefficient arithmetic and land here; division does not, and says so.
function decimalArith(ctx, op, name, node, x, y) {
    if (divides(op)) {
        return (0, err_1.makeNilErr)(ctx, 'inexact_divide', node, undefined, name);
    }
    const out = 'add' === op ? x.add(y) :
        'sub' === op ? x.add(y.negate()) :
            x.multiply(y);
    // The budget applies to RESULTS as well as literals: an exact answer
    // too wide to hold is refused, never rounded to fit.
    return (0, Decimal_1.decimalOverBudget)(out) ?
        (0, err_1.makeNilErr)(ctx, 'decimal_budget', node, undefined, name) :
        new BigDecimalVal_1.BigDecimalVal({ peg: out });
} /* node:coverage ignore next 9 */
//# sourceMappingURL=arith.js.map