"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Unit tests for the exact leaves of the number tower: the Decimal value
 * type, the two Vals built on it, and the `0d` literal.
 *
 * The shared, cross-port contract lives in test/spec/number-tower.tsv.
 * What is here is the part a TSV row cannot reach: the TypeScript-side
 * representation (D8), the exact-input constructors, and the value-not-
 * identity comparisons (D2) that a spec row can only observe indirectly.
 */
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const aontu_1 = require("../dist/aontu");
const Decimal_1 = require("../dist/val/Decimal");
const BigDecimalVal_1 = require("../dist/val/BigDecimalVal");
const BigIntegerVal_1 = require("../dist/val/BigIntegerVal");
const canon = (src) => new aontu_1.Aontu().unify(src).canon;
(0, node_test_1.describe)('decimal', () => {
    (0, node_test_1.test)('normalises-at-construction', () => {
        // Scale is presentation, not identity (D4): trailing zeros go...
        Assert.equal(new Decimal_1.Decimal(10n, 2).toString(), '0.1');
        Assert.equal(new Decimal_1.Decimal(1500n, 3).toString(), '1.5');
        // ...but never below one decimal place, so an integral bigdecimal
        // cannot render as something that reparses as a biginteger.
        Assert.equal(new Decimal_1.Decimal(1000n, 0).toString(), '1000.0');
        Assert.equal(new Decimal_1.Decimal(1n, -3).toString(), '1000.0');
        Assert.equal(new Decimal_1.Decimal(10000n, 1).toString(), '1000.0');
        // Zero has exactly one form, at scale 1 (D5: no negative zero).
        Assert.equal(new Decimal_1.Decimal(0n, 7).toString(), '0.0');
        Assert.equal(new Decimal_1.Decimal(-0n, 0).toString(), '0.0');
        Assert.equal(new Decimal_1.Decimal(0n, -9).scale, 1);
    });
    (0, node_test_1.test)('renders-plain-at-every-magnitude', () => {
        Assert.equal(new Decimal_1.Decimal(1n, 1).toString(), '0.1');
        Assert.equal(new Decimal_1.Decimal(1n, 9).toString(), '0.000000001');
        Assert.equal(new Decimal_1.Decimal(-15n, 1).toString(), '-1.5');
        Assert.equal(new Decimal_1.Decimal(-1n, 3).toString(), '-0.001');
        // Sign before the marker: `0d-1.5` is not a literal, so canon must
        // not produce it.
        Assert.equal(new Decimal_1.Decimal(-15n, 1).canon(), '-0d1.5');
        Assert.equal(new Decimal_1.Decimal(15n, 1).canon(), '0d1.5');
    });
    (0, node_test_1.test)('equals-and-compares-by-value', () => {
        Assert.ok(new Decimal_1.Decimal(10n, 2).equals(new Decimal_1.Decimal(1n, 1)));
        Assert.ok(!new Decimal_1.Decimal(15n, 1).equals(new Decimal_1.Decimal(16n, 1)));
        // Distinct objects, one value: `===` would say no.
        Assert.ok(new Decimal_1.Decimal(1n, 1) !== new Decimal_1.Decimal(1n, 1));
        Assert.ok(new Decimal_1.Decimal(1n, 1).equals(new Decimal_1.Decimal(1n, 1)));
        Assert.equal(new Decimal_1.Decimal(1n, 1).compare(new Decimal_1.Decimal(2n, 1)), -1);
        Assert.equal(new Decimal_1.Decimal(2n, 1).compare(new Decimal_1.Decimal(1n, 1)), 1);
        Assert.equal(new Decimal_1.Decimal(1n, 1).compare(new Decimal_1.Decimal(100n, 3)), 0);
        // Different scales, so the comparison must align them exactly.
        Assert.equal(new Decimal_1.Decimal(1n, 0).compare(new Decimal_1.Decimal(999n, 3)), 1);
        Assert.equal(new Decimal_1.Decimal(-15n, 1).compare(new Decimal_1.Decimal(15n, 1)), -1);
    });
    (0, node_test_1.test)('negates-exactly-and-folds-negative-zero', () => {
        Assert.equal(new Decimal_1.Decimal(15n, 1).negate().toString(), '-1.5');
        Assert.equal(new Decimal_1.Decimal(-15n, 1).negate().toString(), '1.5');
        Assert.equal(new Decimal_1.Decimal(0n, 1).negate().toString(), '0.0');
    });
    (0, node_test_1.test)('fromString-is-an-exact-input-constructor', () => {
        Assert.equal(Decimal_1.Decimal.fromString('1.5').canon(), '0d1.5');
        Assert.equal(Decimal_1.Decimal.fromString('0d1.5').canon(), '0d1.5');
        Assert.equal(Decimal_1.Decimal.fromString('-0d0.10').canon(), '-0d0.1');
        Assert.equal(Decimal_1.Decimal.fromString('1e3').canon(), '0d1000.0');
        Assert.equal(Decimal_1.Decimal.fromString('1e-1').canon(), '0d0.1');
        // Beyond binary64's exact reach, and exact anyway.
        Assert.equal(Decimal_1.Decimal.fromString('9007199254740993.5').canon(), '0d9007199254740993.5');
        Assert.throws(() => Decimal_1.Decimal.fromString('1.5.6'));
        Assert.throws(() => Decimal_1.Decimal.fromString('0d.5'));
        Assert.throws(() => Decimal_1.Decimal.fromString('1_000'));
    });
});
(0, node_test_1.describe)('bignum-vals', () => {
    (0, node_test_1.test)('exact-input-constructors', () => {
        // D8: a bigint or text, never a JS number -- binary64 has already
        // rounded a number argument before this library could inspect it.
        Assert.equal(new BigIntegerVal_1.BigIntegerVal({ peg: 5n }).canon, '0d5');
        Assert.equal(new BigIntegerVal_1.BigIntegerVal({ peg: -5n }).canon, '-0d5');
        Assert.equal(new BigIntegerVal_1.BigIntegerVal({ peg: '9007199254740993' }).canon, '0d9007199254740993');
        Assert.throws(() => new BigIntegerVal_1.BigIntegerVal({ peg: 5 }), /not-biginteger/);
        Assert.throws(() => new BigIntegerVal_1.BigIntegerVal({ peg: '5.5' }), /not-biginteger/);
        Assert.equal(new BigDecimalVal_1.BigDecimalVal({ peg: new Decimal_1.Decimal(15n, 1) }).canon, '0d1.5');
        Assert.equal(new BigDecimalVal_1.BigDecimalVal({ peg: '0.10' }).canon, '0d0.1');
        Assert.throws(() => new BigDecimalVal_1.BigDecimalVal({ peg: 1.5 }), /not-bigdecimal/);
        Assert.throws(() => new BigDecimalVal_1.BigDecimalVal({ peg: 'q' }), /not-bigdecimal/);
    });
    (0, node_test_1.test)('same-compares-value-not-object', () => {
        // D2's Go hazard, in its TypeScript form: a Decimal peg is an
        // OBJECT, so `peer.peg === this.peg` is object identity and would
        // make `0d0.10 & 0d0.1` fail while `0d1.5 & 0d1.5` accidentally
        // worked (or not) depending on allocation.
        const a = new BigDecimalVal_1.BigDecimalVal({ peg: new Decimal_1.Decimal(10n, 2) });
        const b = new BigDecimalVal_1.BigDecimalVal({ peg: new Decimal_1.Decimal(1n, 1) });
        Assert.ok(a.peg !== b.peg);
        Assert.ok(a.same(b));
        Assert.ok(!a.same(new BigDecimalVal_1.BigDecimalVal({ peg: new Decimal_1.Decimal(2n, 1) })));
        // A bigint peg needs no help: `===` on two bigints is value
        // equality even for values far outside binary64.
        const big = '123456789012345678901234567890';
        Assert.ok(new BigIntegerVal_1.BigIntegerVal({ peg: big })
            .same(new BigIntegerVal_1.BigIntegerVal({ peg: big })));
        Assert.ok(!new BigIntegerVal_1.BigIntegerVal({ peg: big })
            .same(new BigIntegerVal_1.BigIntegerVal({ peg: big + '1' })));
        // Never across leaves, however equal the numbers look.
        Assert.ok(!new BigIntegerVal_1.BigIntegerVal({ peg: 1n })
            .same(new BigDecimalVal_1.BigDecimalVal({ peg: '1.0' })));
    });
});
(0, node_test_1.describe)('bignum-literal', () => {
    (0, node_test_1.test)('leaf-by-source', () => {
        // Digits only is a biginteger; a `.` or an exponent anywhere makes
        // it a bigdecimal, even when the VALUE is integral.
        Assert.equal(canon('x:0d5'), '{"x":0d5}');
        Assert.equal(canon('x:0d1e3'), '{"x":0d1000.0}');
        Assert.equal(canon('x:0d1.5e2'), '{"x":0d150.0}');
        Assert.equal(canon('x:0D12'), '{"x":0d12}');
        // Separators are legal only BETWEEN digits, as for ordinary numbers.
        Assert.equal(canon('x:0d1_000'), '{"x":0d1000}');
        Assert.equal(canon('x:0d1_0.0_1'), '{"x":0d10.01}');
    });
    (0, node_test_1.test)('sign-is-the-unary-prefix', () => {
        // D3 accepts `-0d5` and refuses `0d-5`. The sign is the existing
        // unary-minus operator, so the literal itself never carries one --
        // which is what keeps `0d1 +0d2` an addition rather than an
        // implicit list of `0d1` and a signed literal.
        Assert.equal(canon('x:-0d5'), '{"x":-0d5}');
        Assert.equal(canon('x:-0d1.5'), '{"x":-0d1.5}');
        Assert.equal(canon('x:-0d0'), '{"x":0d0}');
        Assert.equal(canon('x:-0d0.0'), '{"x":0d0.0}');
        Assert.throws(() => canon('x:0d-5'));
    });
    (0, node_test_1.test)('a-bare-0d-is-not-an-exact-leaf', () => {
        Assert.equal(canon('x:0d'), '{"x":"0d"}');
        Assert.equal(canon('x:"0d5"'), '{"x":"0d5"}');
        Assert.equal(canon('x:0d5.0'), '{"x":0d5.0}');
    });
    (0, node_test_1.test)('budget-is-enforced-at-parse', () => {
        // The scale bound is the load-bearing half: this coefficient is ONE
        // digit, so a coefficient-only check never fires, yet plain-form
        // rendering would have to materialise a gigabyte of zeros.
        Assert.throws(() => new aontu_1.Aontu().generate('x:0d1e1000000000'), /exceeds the exactness budget/);
        Assert.throws(() => new aontu_1.Aontu().generate('x:0d1e-1000000000'), /exceeds the exactness budget/);
        // An exponent too long to be a number at all is still refused, and
        // still refused without building anything.
        Assert.throws(() => new aontu_1.Aontu().generate('x:0d1e' + '9'.repeat(4000)), /exceeds the exactness budget/);
        // The coefficient bound, at one digit over.
        Assert.throws(() => new aontu_1.Aontu().generate('x:0d1.' + '2'.repeat(Decimal_1.DECIMAL_COEFFICIENT_BUDGET)), /exceeds the exactness budget/);
        // Both bounds are inclusive, and a literal at the limit is a value.
        Assert.equal(canon('x:0d1e-' + Decimal_1.DECIMAL_SCALE_BUDGET), '{"x":0d0.' + '0'.repeat(Decimal_1.DECIMAL_SCALE_BUDGET - 1) + '1}');
        Assert.equal(canon('x:0d1e-' + (Decimal_1.DECIMAL_SCALE_BUDGET + 1)), '{"x":nil}');
        // A biginteger has no coefficient budget: it is bounded by the
        // source it is written in, and cannot blow up from a short literal.
        Assert.equal(canon('x:0d' + '9'.repeat(5000)), '{"x":0d' + '9'.repeat(5000) + '}');
    });
});
//# sourceMappingURL=bignum.test.js.map