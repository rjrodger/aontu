"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const aontu_1 = require("../dist/aontu");
const ATOMS = node_fs_1.default
    .readFileSync(node_path_1.default.join(__dirname, '..', '..', 'test', 'spec', 'files', 'constraint-atoms.txt'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => '' !== line && !line.startsWith('#'));
// Associativity is cubic, so it runs over a representative prefix.
const TRIPLE_ATOMS = ATOMS.slice(0, 8);
function obs(src) {
    try {
        return new aontu_1.Aontu().unify(src).canon;
    }
    catch (e) {
        const errs = 'function' === typeof e?.errs ? e.errs() : [];
        return 'ERR:' + (errs[0]?.why ?? 'unknown');
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