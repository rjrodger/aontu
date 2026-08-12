"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// PROPERTY-BASED DIFFERENTIAL TESTING OF THE CONSTRAINT ALGEBRA
// (docs/capability-review/g1-constraint-algebra.md, "Ongoing": property
// -based differential testing of the algebra laws -- commutativity,
// idempotence, normalisation convergence -- across TS and Go, seeded
// from the atom vocabulary).
//
// The corpus is ENUMERATED, not random: the same atom vocabulary is
// crossed exhaustively here and in go/constraint_laws_test.go, so both
// ports check identical terms and a law that breaks in one port breaks
// visibly in that port's suite. Cross-port AGREEMENT on the results is
// the shared suite's job (test/spec/constraint-bound.tsv); these tests
// guard the laws themselves as the vocabulary grows, which is where a
// hand-written row set stops scaling.
//
// The observable is canon, or the error CODE when the meet is empty --
// both are order-independent by construction, unlike error message text
// (whose primary site is deliberately later-in-source, so it is NOT
// expected to be commutative).
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const aontu_1 = require("../dist/aontu");
// The implemented Band A vocabulary (G1 phase 1: bounds and neq), plus
// the kinds and concrete scalars they meet against. Extend this list as
// `re`, `len`, `unique` and `must` land -- the laws below then cover
// them with no new test code.
const ATOMS = [
    'min(0)', 'min(5)', 'min("a")',
    'max(3)', 'max(10)', 'max("z")',
    'above(1)', 'below(2)',
    'neq(1)', 'neq(1,2)', 'neq("a")',
    'integer', 'number', 'string',
    '5', '"m"',
];
// Associativity is cubic, so it runs over a representative prefix.
const TRIPLE_ATOMS = ATOMS.slice(0, 8);
// Evaluate to an order-independent observable: the canonical form, or
// the error code when the meet is empty.
function obs(src) {
    try {
        return new aontu_1.Aontu().unify(src).canon;
    }
    catch (e) {
        const m = String(e && e.message).match(/aontu\/(\w+)/);
        return 'ERR:' + (m ? m[1] : 'unknown');
    }
}
(0, node_test_1.describe)('constraint-laws', () => {
    // a & b == b & a
    (0, node_test_1.test)('commutativity', () => {
        for (const a of ATOMS) {
            for (const b of ATOMS) {
                node_assert_1.default.strictEqual(obs(`x: ${a} & ${b}`), obs(`x: ${b} & ${a}`), `commutativity: ${a} & ${b}`);
            }
        }
    });
    // a & a == a
    (0, node_test_1.test)('idempotence', () => {
        for (const a of ATOMS) {
            node_assert_1.default.strictEqual(obs(`x: ${a} & ${a}`), obs(`x: ${a}`), `idempotence: ${a}`);
        }
    });
    // (a & b) & c == a & (b & c)
    (0, node_test_1.test)('associativity', () => {
        for (const a of TRIPLE_ATOMS) {
            for (const b of TRIPLE_ATOMS) {
                for (const c of TRIPLE_ATOMS) {
                    node_assert_1.default.strictEqual(obs(`x: (${a} & ${b}) & ${c}`), obs(`x: ${a} & (${b} & ${c})`), `associativity: (${a} & ${b}) & ${c}`);
                }
            }
        }
    });
    // Normalisation converges: re-canonning a residual is a fixpoint, so
    // a constraint's canonical text is stable under round-trip (the
    // property test/spec runners assert for every canon row).
    (0, node_test_1.test)('normalisation-convergence', () => {
        for (const a of ATOMS) {
            for (const b of ATOMS) {
                const c1 = obs(`x: ${a} & ${b}`);
                if (c1.startsWith('ERR:')) {
                    continue;
                }
                node_assert_1.default.strictEqual(obs(c1), c1, `convergence: ${a} & ${b}`);
            }
        }
    });
});
//# sourceMappingURL=constraint-laws.test.js.map