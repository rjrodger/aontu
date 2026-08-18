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
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const node_child_process_1 = require("node:child_process");
const Fs = __importStar(require("node:fs"));
const Os = __importStar(require("node:os"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
const cli_1 = require("../dist/cli");
const CLI = Path.join(__dirname, '..', 'bin', 'aontu.js');
function run(args, input) {
    // The child does NOT inherit NODE_V8_COVERAGE. These cases assert the
    // packaged binary's behaviour; its coverage is contributed in-process
    // by coverage3.test.ts, and a grandchild's coverage file is not always
    // flushed before the runner aggregates — which made the ADR-002 gate
    // flaky rather than measuring anything extra.
    const env = { ...process.env };
    delete env.NODE_V8_COVERAGE;
    try {
        const out = (0, node_child_process_1.execFileSync)('node', [CLI, ...args], {
            input: input ?? '',
            encoding: 'utf8',
            env,
        });
        return { out, code: 0 };
    }
    catch (err) {
        // execFileSync throws on non-zero exit; capture stdout/stderr + code.
        return { out: (err.stdout ?? '') + (err.stderr ?? ''), code: err.status ?? 1 };
    }
}
(0, node_test_1.describe)('cli', () => {
    // --- unit: evalSource is the pure core the CLI renders with ---
    (0, node_test_1.test)('eval-json', () => {
        const r = (0, cli_1.evalSource)(new aontu_1.Aontu(), 'a:1 b:$.a', 'json');
        Assert.equal(r.ok, true);
        Assert.deepEqual(JSON.parse(r.text), { a: 1, b: 1 });
    });
    (0, node_test_1.test)('eval-canon', () => {
        const r = (0, cli_1.evalSource)(new aontu_1.Aontu(), 'a:*1|number', 'canon');
        Assert.equal(r.ok, true);
        Assert.equal(r.text, '{"a":*1|number}');
    });
    (0, node_test_1.test)('eval-error', () => {
        const r = (0, cli_1.evalSource)(new aontu_1.Aontu(), 'a:1 a:2', 'json');
        Assert.equal(r.ok, false);
        Assert.match(r.text, /Cannot unify value: 2 with value: 1/);
    });
    (0, node_test_1.test)('eval-empty', () => {
        const r = (0, cli_1.evalSource)(new aontu_1.Aontu(), '', 'json');
        Assert.equal(r.ok, true);
        Assert.deepEqual(JSON.parse(r.text), {});
    });
    // --- integration: the built binary, driven via stdin/args ---
    (0, node_test_1.test)('cli-version', () => {
        const r = run(['--version']);
        Assert.equal(r.code, 0);
        Assert.match(r.out, /^\d+\.\d+\.\d+/);
    });
    (0, node_test_1.test)('cli-help', () => {
        const r = run(['--help']);
        Assert.equal(r.code, 0);
        Assert.match(r.out, /Usage: aontu/);
    });
    (0, node_test_1.test)('cli-stdin-json', () => {
        const r = run([], 'port: *8080 | integer\nhost: localhost');
        Assert.equal(r.code, 0);
        Assert.deepEqual(JSON.parse(r.out), { port: 8080, host: 'localhost' });
    });
    (0, node_test_1.test)('cli-stdin-canon', () => {
        const r = run(['--canon'], 'a:1|2');
        Assert.equal(r.code, 0);
        Assert.equal(r.out.trim(), '{"a":1|2}');
    });
    (0, node_test_1.test)('cli-error-exit-code', () => {
        const r = run([], 'a:1 a:2');
        Assert.equal(r.code, 1);
        Assert.match(r.out, /Cannot unify value: 2 with value: 1/);
    });
    (0, node_test_1.test)('cli-unknown-option', () => {
        const r = run(['--nope']);
        Assert.equal(r.code, 2);
        Assert.match(r.out, /unknown option/);
    });
});
// --- the vet verb (G2 phase 3) ---------------------------------------
function vetCapture(fn) {
    const so = process.stdout.write;
    const se = process.stderr.write;
    let out = '';
    let err = '';
    process.stdout.write = (s) => ((out += s), true);
    process.stderr.write = (s) => ((err += s), true);
    try {
        fn();
    }
    finally {
        process.stdout.write = so;
        process.stderr.write = se;
        process.exitCode = 0;
    }
    return { out, err };
}
function vetFiles(schema, data) {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-vet-'));
    const s = Path.join(dir, 'schema.aon');
    const d = Path.join(dir, 'data.json');
    Fs.writeFileSync(s, schema);
    Fs.writeFileSync(d, data);
    return { dir, schema: s, data: d };
}
const VET_SCHEMA = 'service: { name: string, port: integer }';
(0, node_test_1.describe)('cli-vet', () => {
    // The verb's whole reason for existing: an agent emits a document,
    // the gate says what does not hold and WHERE, and the exit code says
    // which kind of "no" it was.
    (0, node_test_1.test)('vet-reports-conflicts-with-both-sites', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }');
        const r = vetCapture(() => (0, cli_1.runVet)([f.schema, f.data]));
        Assert.match(r.out, /verdict: invalid/);
        Assert.match(r.out, /\$\.service\.port: no_scalar_unify \[conflict\]/);
        Assert.match(r.out, /data: .*data\.json:1:\d+ \("8080"\)/);
        Assert.match(r.out, /schema: .*schema\.aon:1:\d+ \(integer\)/);
    });
    // A parent that collapses to a nil takes its subtree with it, so the
    // sibling conflict is reported on the CONTEXT rather than standing in
    // the tree. Both belong in the report: this is the design's own
    // motivating example, and it used to show half of what it found.
    (0, node_test_1.test)('vet-reports-findings-that-never-reached-the-tree', () => {
        const f = vetFiles('service: close({ name: string, port: integer, replicas: integer })', 'service: { name: "auth", prot: 8080, replicas: "3" }');
        const r = vetCapture(() => (0, cli_1.runVet)([f.schema, f.data]));
        Assert.match(r.out, /\$\.service\.prot: closed/);
        Assert.match(r.out, /\$\.service\.replicas: no_scalar_unify/);
    });
    (0, node_test_1.test)('vet-exit-codes-are-verdict-classes', () => {
        const valid = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }');
        Assert.equal(vetCapture(() => {
            Assert.equal((0, cli_1.runVet)([valid.schema, valid.data]), 0);
        }).out.trim(), 'verdict: valid');
        const invalid = vetFiles(VET_SCHEMA, 'service: { name: 1, port: 8080 }');
        vetCapture(() => Assert.equal((0, cli_1.runVet)([invalid.schema, invalid.data]), 1));
        const incomplete = vetFiles(VET_SCHEMA, 'service: { name: "auth" }');
        vetCapture(() => Assert.equal((0, cli_1.runVet)([incomplete.schema, incomplete.data]), 3));
        // --partial keeps reporting the residue but stops it failing.
        vetCapture(() => Assert.equal((0, cli_1.runVet)(['--partial', incomplete.schema, incomplete.data]), 0));
        const broken = vetFiles('a: 1\na: 2', 'a: 1');
        vetCapture(() => Assert.equal((0, cli_1.runVet)([broken.schema, broken.data]), 4));
    });
    (0, node_test_1.test)('vet-json-format-names-its-producer', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }');
        const r = vetCapture(() => (0, cli_1.runVet)(['--format', 'json', f.schema, f.data]));
        const report = JSON.parse(r.out);
        Assert.equal(report.aontu.verb, 'vet');
        Assert.match(report.aontu.version, /^\d+\.\d+\.\d+$/);
        Assert.equal(report.verdict, 'invalid');
        Assert.equal(report.truncated, false);
        Assert.equal(report.findings[0].code, 'no_scalar_unify');
        Assert.equal(report.findings[0].sites[0].role, 'data');
    });
    (0, node_test_1.test)('vet-at-and-closed-reach-the-engine', () => {
        const f = vetFiles('services: { auth: { port: integer } }', 'auth: { port: 8080 }');
        vetCapture(() => Assert.equal((0, cli_1.runVet)(['--at', '$.services', f.schema, f.data]), 0));
        const g = vetFiles('service: { name: string }', 'service: { name: "auth" }\nextra: 1');
        vetCapture(() => Assert.equal((0, cli_1.runVet)([g.schema, g.data]), 0));
        vetCapture(() => Assert.equal((0, cli_1.runVet)(['--closed', g.schema, g.data]), 1));
    });
    (0, node_test_1.test)('vet-max-errors-truncates-and-says-so', () => {
        const f = vetFiles('a: integer\nb: integer\nc: integer', 'a: "x"\nb: "y"\nc: "z"');
        const r = vetCapture(() => Assert.equal((0, cli_1.runVet)(['--max-errors', '2', f.schema, f.data]), 1));
        Assert.match(r.out, /findings truncated/);
    });
    // Several data files are several candidates for one truth, so each is
    // vetted on its own and the worst verdict wins.
    (0, node_test_1.test)('vet-takes-more-than-one-data-file', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }');
        const bad = Path.join(f.dir, 'bad.json');
        Fs.writeFileSync(bad, 'service: { name: "auth", port: "nope" }');
        const r = vetCapture(() => Assert.equal((0, cli_1.runVet)([f.schema, f.data, bad]), 1));
        Assert.match(r.out, /verdict: invalid/);
        Assert.match(r.out, /bad\.json/);
    });
    (0, node_test_1.test)('vet-usage-errors-exit-2', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }');
        for (const args of [
            [],
            [f.schema],
            ['--at'],
            ['--format', 'yaml', f.schema, f.data],
            ['--max-errors', 'lots', f.schema, f.data],
            ['--max-errors', '0', f.schema, f.data],
            ['--nope', f.schema, f.data],
        ]) {
            const r = vetCapture(() => Assert.equal((0, cli_1.runVet)(args), 2));
            Assert.match(r.err, /^aontu: /);
        }
    });
    (0, node_test_1.test)('vet-unreadable-file-exits-2-and-names-it', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }');
        const missing = Path.join(f.dir, 'no-such.json');
        const r = vetCapture(() => Assert.equal((0, cli_1.runVet)([f.schema, missing]), 2));
        Assert.match(r.err, /cannot read .*no-such\.json/);
    });
    (0, node_test_1.test)('vet-note-and-alternatives-reach-the-text-report', () => {
        const f = vetFiles('service: { tier: must("gold"|"silver","tier must be supported"),' +
            ' port: integer & min(1024) }', 'service: { tier: "lead", port: 80 }');
        const r = vetCapture(() => (0, cli_1.runVet)([f.schema, f.data]));
        Assert.match(r.out, /note: tier must be supported/);
        Assert.match(r.out, /expected: integer&min\(1024\)/);
        Assert.match(r.out, /actual: +80/);
    });
    // The verb dispatches only as the FIRST argument, so a file argument
    // is never shadowed by a verb name.
    (0, node_test_1.test)('vet-dispatches-through-main', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: 8080 }');
        const r = vetCapture(() => (0, cli_1.main)(['node', 'cli', 'vet', f.schema, f.data]));
        Assert.match(r.out, /verdict: valid/);
    });
    (0, node_test_1.test)('vet-verb-appears-in-help', () => {
        const r = run(['--help']);
        Assert.match(r.out, /aontu vet \[options\]/);
        Assert.match(r.out, /3 {2}incomplete/);
    });
    (0, node_test_1.test)('vet-end-to-end-exit-code', () => {
        const f = vetFiles(VET_SCHEMA, 'service: { name: "auth", port: "8080" }');
        const r = run(['vet', f.schema, f.data]);
        Assert.equal(r.code, 1);
        Assert.match(r.out, /verdict: invalid/);
    });
});
//# sourceMappingURL=cli.test.js.map