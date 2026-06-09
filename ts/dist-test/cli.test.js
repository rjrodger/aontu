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
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
const cli_1 = require("../dist/cli");
const CLI = Path.join(__dirname, '..', 'dist', 'cli.js');
function run(args, input) {
    try {
        const out = (0, node_child_process_1.execFileSync)('node', [CLI, ...args], {
            input: input ?? '',
            encoding: 'utf8',
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
//# sourceMappingURL=cli.test.js.map