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
const vet_1 = require("../dist/vet");
const aontu_1 = require("../dist/aontu");
const SCHEMA = 'service: { name: string, port: integer }';
(0, node_test_1.describe)('vet-verdicts', () => {
    (0, node_test_1.test)('valid-data-is-valid', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth", port: 8080 }');
        Assert.equal(r.verdict, 'valid');
        Assert.equal(r.truncated, false);
        Assert.deepEqual(r.findings, []);
    });
    (0, node_test_1.test)('contradiction-is-invalid', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth", port: "8080" }');
        Assert.equal(r.verdict, 'invalid');
        Assert.equal(r.findings.length, 1);
        Assert.equal(r.findings[0].code, 'no_scalar_unify');
        Assert.equal(r.findings[0].class, 'conflict');
        Assert.equal(r.findings[0].path, '$.service.port');
    });
    // The two negative verdicts are the mechanical answer to error.tsv's
    // conflation: a contradiction can never be satisfied, incompleteness
    // merely is not satisfied YET.
    (0, node_test_1.test)('residue-is-incomplete-not-invalid', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth" }');
        Assert.equal(r.verdict, 'incomplete');
        Assert.equal(r.findings.length, 1);
        Assert.equal(r.findings[0].class, 'incomplete');
        Assert.equal(r.findings[0].path, '$.service.port');
    });
    (0, node_test_1.test)('partial-opts-out-of-strict', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth" }', { partial: true });
        Assert.equal(r.verdict, 'valid');
        // The finding is still REPORTED — `--partial` changes the verdict,
        // not what the caller is told.
        Assert.equal(r.findings.length, 1);
    });
    (0, node_test_1.test)('contradiction-outranks-residue', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: 1 }');
        Assert.equal(r.verdict, 'invalid');
    });
    (0, node_test_1.test)('broken-schema-is-never-blamed-on-data', () => {
        const r = (0, vet_1.vet)('a: 1\na: 2', 'a: 1');
        Assert.equal(r.verdict, 'error');
        Assert.deepEqual(r.findings, []);
    });
    (0, node_test_1.test)('unparseable-data-is-an-error-verdict', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'a: ]');
        Assert.equal(r.verdict, 'error');
    });
});
(0, node_test_1.describe)('vet-findings', () => {
    (0, node_test_1.test)('sites-are-role-tagged-data-first', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth", port: "8080" }', { schemaUrl: 'service.aon', dataUrl: 'deploy.json' });
        const sites = r.findings[0].sites;
        Assert.equal(sites.length, 2);
        Assert.equal(sites[0].role, 'data');
        Assert.equal(sites[0].file, 'deploy.json');
        Assert.equal(sites[0].value, '"8080"');
        Assert.equal(sites[1].role, 'schema');
        Assert.equal(sites[1].file, 'service.aon');
        Assert.equal(sites[1].value, 'integer');
        Assert.ok(0 < sites[0].row);
        Assert.ok(0 < sites[0].col);
    });
    (0, node_test_1.test)('closed-key-finding-carries-one-site', () => {
        const r = (0, vet_1.vet)('service: close({ name: string })', 'service: { name: "auth", prot: 8080 }');
        Assert.equal(r.verdict, 'invalid');
        const f = r.findings.find((f) => 'closed' === f.code);
        Assert.ok(null != f);
        Assert.equal(f.path, '$.service.prot');
        Assert.equal(f.sites.length, 1);
        Assert.equal(f.sites[0].role, 'data');
    });
    // G1's atoms already attach the normalised residual and the offending
    // value; vet reads them where they are rather than re-deriving them.
    (0, node_test_1.test)('constraint-finding-carries-expected-and-actual', () => {
        const r = (0, vet_1.vet)('service: { port: integer & min(1024) }', 'service: { port: 80 }');
        const f = r.findings[0];
        Assert.equal(f.code, 'constraint');
        Assert.equal(f.expected, 'integer&min(1024)');
        Assert.equal(f.actual, '80');
        Assert.equal(f.note, undefined);
    });
    (0, node_test_1.test)('must-finding-carries-the-author-message-as-note', () => {
        const r = (0, vet_1.vet)('service: { tier: must("gold"|"silver","tier must be supported") }', 'service: { tier: "lead" }');
        const f = r.findings[0];
        Assert.equal(f.code, 'must');
        Assert.equal(f.note, 'tier must be supported');
        Assert.equal(f.expected, '"gold"|"silver"');
        Assert.equal(f.actual, '"lead"');
    });
    (0, node_test_1.test)('message-is-the-headline-only', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth", port: "8080" }');
        Assert.ok(r.findings[0].message.startsWith('[aontu/no_scalar_unify]'));
        Assert.ok(!r.findings[0].message.includes('\n'));
    });
    // A key may contain any character, so no punctuation is safe as a
    // path separator; the path is carried whole and never re-parsed.
    (0, node_test_1.test)('paths-are-not-delimiter-safe', () => {
        const r = (0, vet_1.vet)('"a b": integer', '"a b": "x"');
        Assert.equal(r.findings[0].path, '$.a b');
    });
    (0, node_test_1.test)('root-conflict-reports-the-root-path', () => {
        const r = (0, vet_1.vet)('1', '2');
        Assert.equal(r.verdict, 'invalid');
        Assert.equal(r.findings[0].path, '$');
    });
    // The spread constraint lives off-peg, so this is only reachable by
    // following it — but note WHERE the finding lands: the path is the
    // TEMPLATE's, not the instance's, because the conflict nil is created
    // against the template node. The data site still points at the
    // offending value, which is what a repair loop needs; naming the
    // instance path is a phase-3 report concern, recorded in the register.
    (0, node_test_1.test)('conflict-inside-a-spread-template-is-found', () => {
        const r = (0, vet_1.vet)('services: &: { port: integer }', 'services: { auth: { port: "80" } }');
        Assert.equal(r.verdict, 'invalid');
        Assert.equal(r.findings[0].path, '$.services.port');
        Assert.equal(r.findings[0].sites[0].role, 'data');
        Assert.equal(r.findings[0].sites[0].value, '"80"');
    });
});
(0, node_test_1.describe)('vet-ordering-and-limits', () => {
    // Two independent conflicts DO collect in one pass, so ordering is
    // observable without waiting for phase 6.
    (0, node_test_1.test)('findings-are-sorted-by-data-site-then-code', () => {
        const r = (0, vet_1.vet)('a: integer\nb: integer\nc: integer', 'c: "z"\na: "x"\nb: "y"');
        Assert.equal(r.findings.length, 3);
        const rows = r.findings.map((f) => f.sites[0].row);
        Assert.deepEqual(rows, [...rows].sort((x, y) => x - y));
    });
    (0, node_test_1.test)('findings-with-the-same-site-order-by-code', () => {
        const r = (0, vet_1.vet)('a: integer\nb: integer', 'a: "x"\nb: "y"');
        const codes = r.findings.map((f) => f.code);
        Assert.deepEqual(codes, [...codes].sort());
    });
    (0, node_test_1.test)('max-errors-caps-and-marks-truncated', () => {
        const r = (0, vet_1.vet)('a: integer\nb: integer\nc: integer', 'a: "x"\nb: "y"\nc: "z"', { maxErrors: 2 });
        Assert.equal(r.findings.length, 2);
        Assert.equal(r.truncated, true);
    });
    (0, node_test_1.test)('an-uncapped-report-is-not-truncated', () => {
        const r = (0, vet_1.vet)('a: integer\nb: integer', 'a: "x"\nb: "y"');
        Assert.equal(r.truncated, false);
    });
});
(0, node_test_1.describe)('vet-anchor', () => {
    (0, node_test_1.test)('at-selects-a-subtree', () => {
        const schema = 'services: { auth: { port: integer } }\nother: { junk: string }';
        const r = (0, vet_1.vet)(schema, 'auth: { port: 8080 }', { at: '$.services' });
        Assert.equal(r.verdict, 'valid');
    });
    (0, node_test_1.test)('at-accepts-a-bare-path', () => {
        const schema = 'services: { auth: { port: integer } }';
        const r = (0, vet_1.vet)(schema, 'auth: { port: "x" }', { at: 'services' });
        Assert.equal(r.verdict, 'invalid');
    });
    (0, node_test_1.test)('at-root-is-the-whole-schema', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'service: { name: "auth", port: 8080 }', { at: '$' });
        Assert.equal(r.verdict, 'valid');
    });
    (0, node_test_1.test)('an-anchor-that-does-not-exist-is-an-error-verdict', () => {
        const r = (0, vet_1.vet)(SCHEMA, 'a: 1', { at: '$.nope' });
        Assert.equal(r.verdict, 'error');
    });
    (0, node_test_1.test)('an-anchor-through-a-scalar-is-an-error-verdict', () => {
        const r = (0, vet_1.vet)('a: 1', 'x: 1', { at: '$.a.b' });
        Assert.equal(r.verdict, 'error');
    });
    // `--closed` closes the ANCHOR, so a surplus key is only refused at
    // the level the run is anchored on: an unanchored run closes the
    // root, which says nothing about keys nested below it.
    (0, node_test_1.test)('closed-closes-the-anchor-for-this-run', () => {
        const open = (0, vet_1.vet)('service: { name: string }', 'service: { name: "auth" }\nextra: 1');
        Assert.equal(open.verdict, 'valid');
        const shut = (0, vet_1.vet)('service: { name: string }', 'service: { name: "auth" }\nextra: 1', { closed: true });
        Assert.equal(shut.verdict, 'invalid');
    });
    (0, node_test_1.test)('closed-applies-to-the-selected-anchor', () => {
        const open = (0, vet_1.vet)('service: { name: string }', 'name: "auth"\nextra: 1', { at: '$.service' });
        Assert.equal(open.verdict, 'valid');
        const shut = (0, vet_1.vet)('service: { name: string }', 'name: "auth"\nextra: 1', { at: '$.service', closed: true });
        Assert.equal(shut.verdict, 'invalid');
    });
    // A scalar anchor has no keys to close, so the flag is inert rather
    // than an error.
    (0, node_test_1.test)('closed-on-a-scalar-anchor-is-inert', () => {
        const r = (0, vet_1.vet)('a: integer', '1', { at: '$.a', closed: true });
        Assert.equal(r.verdict, 'valid');
    });
});
(0, node_test_1.describe)('vet-api', () => {
    // The package entry is what a consumer requires, so the re-export is
    // part of the contract rather than a convenience.
    (0, node_test_1.test)('vet-is-exported-from-the-package-entry', () => {
        Assert.equal(typeof aontu_1.vet, 'function');
        const r = (0, aontu_1.vet)('a: integer', 'a: 1');
        Assert.equal(r.verdict, 'valid');
    });
});
(0, node_test_1.describe)('vet-containers', () => {
    // A list peg is an array, a map peg an object: the walk has to follow
    // both, and only a list conflict exercises the array arm.
    (0, node_test_1.test)('conflict-inside-a-list-is-found', () => {
        const r = (0, vet_1.vet)('a: [integer]', 'a: ["x"]');
        Assert.equal(r.verdict, 'invalid');
        Assert.equal(r.findings[0].path, '$.a.0');
    });
    (0, node_test_1.test)('nested-list-conflicts-are-all-reported', () => {
        const r = (0, vet_1.vet)('a: [integer, integer]', 'a: ["x", "y"]');
        Assert.equal(r.findings.length, 2);
    });
});
//# sourceMappingURL=vet.test.js.map