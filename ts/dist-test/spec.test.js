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
 * Shared, data-driven conformance tests.
 *
 * The test cases live in the top-level `test/spec/*.tsv` files and are
 * the single source of truth shared with the Go port (see
 * `go/spec_test.go`). Both implementations load the same TSV rows and
 * must produce identical results.
 *
 * TSV columns (tab-separated): name <TAB> mode <TAB> src <TAB> expect
 *   mode=canon : unify(src).canon must equal expect
 *   mode=gen   : generate(src) must deep-equal JSON.parse(expect)
 *   mode=err   : generate(src) must throw, message must contain expect
 * Escapes in src/expect: \n -> newline, \t -> tab, \\ -> backslash.
 */
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
// test/spec lives at the repo root, two levels up from ts/dist-test.
const SPEC_DIR = Path.join(__dirname, '..', '..', 'test', 'spec');
function unescape(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if ('\\' === c && i + 1 < s.length) {
            const n = s[++i];
            out += 'n' === n ? '\n' : 't' === n ? '\t' : n;
        }
        else {
            out += c;
        }
    }
    return out;
}
function loadRows() {
    const rows = [];
    const files = Fs.readdirSync(SPEC_DIR)
        .filter((f) => f.endsWith('.tsv'))
        .sort();
    for (const file of files) {
        const text = Fs.readFileSync(Path.join(SPEC_DIR, file), 'utf8');
        for (const line of text.split('\n')) {
            if ('' === line || line.startsWith('#')) {
                continue;
            }
            const parts = line.split('\t');
            if (parts.length < 4) {
                continue;
            }
            rows.push({
                file,
                name: parts[0],
                mode: parts[1],
                src: unescape(parts[2]),
                expect: unescape(parts[3]),
            });
        }
    }
    return rows;
}
(0, node_test_1.describe)('spec', () => {
    const rows = loadRows();
    // Sanity: ensure the shared spec files were actually found.
    (0, node_test_1.test)('spec-files-present', () => {
        Assert.ok(0 < rows.length, 'no spec rows loaded from ' + SPEC_DIR);
    });
    for (const row of rows) {
        (0, node_test_1.test)(`${row.file}:${row.name}`, () => {
            const a0 = new aontu_1.Aontu();
            if ('canon' === row.mode) {
                Assert.strictEqual(a0.unify(row.src).canon, row.expect);
            }
            else if ('gen' === row.mode) {
                Assert.deepStrictEqual(a0.generate(row.src), JSON.parse(row.expect));
            }
            else if ('err' === row.mode) {
                Assert.throws(() => a0.generate(row.src), (err) => {
                    const msg = String(err && err.message);
                    Assert.ok(msg.includes(row.expect), `expected error containing "${row.expect}", got: ${msg}`);
                    return true;
                });
            }
            else {
                throw new Error('unknown spec mode: ' + row.mode);
            }
        });
    }
});
//# sourceMappingURL=spec.test.js.map