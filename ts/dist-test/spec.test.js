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
 *   mode=gens  : generate(src), serialised to COMPACT JSON, must equal
 *                expect BYTE-FOR-BYTE
 *   mode=err   : generate(src) must throw, message must contain expect
 * Escapes in src/expect: \n -> newline, \t -> tab, \\ -> backslash.
 *
 * gen vs gens: `gen` compares through a JSON decode, so both sides land
 * in float64 and two distinct exact integers above 2^53 compare EQUAL.
 * `gens` compares the serialised text instead, so it can pin exactness
 * (and key order, and integer-vs-float rendering) that `gen` cannot see.
 * The two runners must agree byte-for-byte on the same row: compact
 * output (no indentation, no spaces), keys in the engine's existing
 * generated order.
 */
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
const IntegerVal_1 = require("../dist/val/IntegerVal");
const StringVal_1 = require("../dist/val/StringVal");
const BooleanVal_1 = require("../dist/val/BooleanVal");
const MapVal_1 = require("../dist/val/MapVal");
// test/spec lives at the repo root, two levels up from ts/dist-test.
const SPEC_DIR = Path.join(__dirname, '..', '..', 'test', 'spec');
// Use forward slashes even on Windows: this path is spliced into Aontu
// source as a quoted @"..." load target, where backslashes would be parsed
// as string escapes (\t -> tab, \a -> a, ...) and corrupt the path.
const FIXTURES_DIR = Path.join(SPEC_DIR, 'files').replaceAll('\\', '/');
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
        // Split on \n and tolerate CRLF checkouts (e.g. Windows) by dropping
        // any trailing \r so the last field never carries a stray carriage return.
        for (const line of text.split('\n').map((l) => l.replace(/\r$/, ''))) {
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
                // __FIXTURES__ -> absolute test/spec/files dir, so file-loading
                // (@"file") rows resolve to the shared fixtures from any cwd.
                src: unescape(parts[2]).replaceAll('__FIXTURES__', FIXTURES_DIR),
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
        (0, node_test_1.test)(`${row.file}:${row.name}`, () => runRow(row));
    }
});
// Execute one spec row. Shared by the TSV-driven tests above and the
// gens-mode self-test below, so both go through the same comparison.
function runRow(row) {
    const a0 = new aontu_1.Aontu();
    // Fresh context per row carrying the shared $var test variables.
    const ctx = makeVarsCtx(a0);
    if ('canon' === row.mode) {
        Assert.strictEqual(a0.unify(row.src, undefined, ctx).canon, row.expect);
    }
    else if ('gen' === row.mode) {
        Assert.deepStrictEqual(a0.generate(row.src, undefined, ctx), JSON.parse(row.expect));
    }
    else if ('gens' === row.mode) {
        Assert.strictEqual(genJSON(a0.generate(row.src, undefined, ctx)), row.expect);
    }
    else if ('err' === row.mode) {
        Assert.throws(() => a0.generate(row.src, undefined, makeVarsCtx(a0)), (err) => {
            const msg = String(err && err.message);
            Assert.ok(msg.includes(row.expect), `expected error containing "${row.expect}", got: ${msg}`);
            return true;
        });
    }
    else {
        throw new Error('unknown spec mode: ' + row.mode);
    }
}
// The `gens` mode is byte-exact machinery with no shared rows using it
// yet (it exists so Phase 2's exact leaves CAN be asserted). Prove the
// mode itself here, against the same runRow path the TSV rows take, so
// it is known-good before anything depends on it.
(0, node_test_1.describe)('spec-gens-mode', () => {
    (0, node_test_1.test)('gens-compares-bytes', () => {
        runRow({ name: 'g1', mode: 'gens', src: 'a:1', expect: '{"a":1}' });
        // Compact: no spaces, no indentation, keys in the engine's generated
        // order -- which is sorted, and matches Go's encoding/json for a map.
        runRow({
            name: 'g2', mode: 'gens',
            src: 'b:2\na:1\nc:[1,{d:x}]',
            expect: '{"a":1,"b":2,"c":[1,{"d":"x"}]}',
        });
        // Byte-exact, so integer 1 and float 1.0 both serialise as `1` --
        // gens pins the BYTES, canon pins the kind. Neither replaces the other.
        runRow({ name: 'g3', mode: 'gens', src: 'a:1.0', expect: '{"a":1}' });
        runRow({ name: 'g4', mode: 'gens', src: 'a:1.5', expect: '{"a":1.5}' });
        runRow({ name: 'g5', mode: 'gens', src: 'a:x', expect: '{"a":"x"}' });
    });
    (0, node_test_1.test)('gens-fails-on-any-byte-difference', () => {
        // A whitespace or ordering difference must fail: the point of the
        // mode is that it does not decode before comparing.
        Assert.throws(() => runRow({ name: 'g6', mode: 'gens', src: 'a:1', expect: '{"a": 1}' }));
        Assert.throws(() => runRow({ name: 'g7', mode: 'gens', src: 'b:2\na:1', expect: '{"b":2,"a":1}' }));
    });
    (0, node_test_1.test)('unknown-mode-still-fails-loudly', () => {
        Assert.throws(() => runRow({ name: 'g8', mode: 'genz', src: 'a:1', expect: '{"a":1}' }), /unknown spec mode: genz/);
    });
});
// Serialise a generated value for `gens` rows: compact JSON (no
// indentation, no spaces), keys in the order generate() produced them.
// Go's encoding/json Marshal is compact for the same reason, so the two
// runners produce the same bytes for the same value.
//
// The emitter is aontu's own public `exactJSON` export (D9), not
// JSON.stringify: the exact leaves generate a bigint (which
// JSON.stringify throws on) and a Decimal, and writing their digits as
// raw JSON numbers is the whole reason `gens` exists. Called with no
// indent argument, which is exactJSON's compact form -- the same bytes
// Go's compact encoder produces.
//
// The CLI calls the same export with an indent, so a `gens` row and the
// command line cannot disagree about anything but whitespace.
function genJSON(v) {
    return (0, aontu_1.exactJSON)(v);
}
// The $var test variables, shared with the Go runner (go/spec_test.go).
function makeVarsCtx(a0) {
    const ctx = a0.ctx();
    ctx.vars.foo = new IntegerVal_1.IntegerVal({ peg: 11 });
    ctx.vars.bar = new StringVal_1.StringVal({ peg: 'hello' });
    ctx.vars.flag = new BooleanVal_1.BooleanVal({ peg: true });
    ctx.vars.obj = new MapVal_1.MapVal({ peg: { x: new IntegerVal_1.IntegerVal({ peg: 1 }) } });
    // 2^60: an integer-kind value ABOVE the safe-integer range, so it renders
    // differently under `'' + peg` (the shortest round-tripping form,
    // 1152921504606847000) than under its exact digits. Every other binding
    // here renders identically either way, which is why no shared row could
    // reach the variable-as-path-segment rendering site until this existed.
    ctx.vars.big = new IntegerVal_1.IntegerVal({ peg: 1152921504606846976 });
    return ctx;
}
//# sourceMappingURL=spec.test.js.map