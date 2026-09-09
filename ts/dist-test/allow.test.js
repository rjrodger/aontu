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
// The role gate (docs/design/ALLOW.0.md): the library's answers, one
// per rule the design states, and every refusal shape. The command
// line around it is held by cli.test.ts; the live model is
// use-cases/18-role-permissions.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Os = __importStar(require("node:os"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
const allow_1 = require("../dist/allow");
const ROLES = `
roles: {
  admin: { allow: ["$"] }
  dev: {
    allow: ["$.services", "$.deploy.*.replicas"]
    deny: ["$.services.*.tier"]
  }
  product: { allow: ["$.features", "$.services.*.description"] }
  qa: { allow: ["$.tests"] }
}
`;
// One decision, with the fields a machine reader destructures.
function decision(role, path, src = ROLES) {
    const r = (0, aontu_1.allow)(src, role, [path]);
    Assert.equal(r.paths.length, 1);
    return r.paths[0];
}
(0, node_test_1.describe)('allow', () => {
    (0, node_test_1.test)('the-default-anchor-is-the-roles-map', () => {
        Assert.equal(allow_1.ALLOW_AT, '$.roles');
    });
    (0, node_test_1.test)('an-allow-entry-covers-itself-and-everything-below', () => {
        Assert.deepEqual(decision('product', '$.features'), {
            path: '$.features', allowed: true, reason: 'allow',
            by: '$.roles.product.allow.0', pattern: '$.features',
        });
        Assert.deepEqual(decision('product', '$.features.search.enabled'), {
            path: '$.features.search.enabled', allowed: true, reason: 'allow',
            by: '$.roles.product.allow.0', pattern: '$.features',
        });
        Assert.deepEqual(decision('dev', '$.services.auth.replicas'), {
            path: '$.services.auth.replicas', allowed: true, reason: 'allow',
            by: '$.roles.dev.allow.0', pattern: '$.services',
        });
        // The whole document is covered only by an entry that names it.
        Assert.equal(decision('admin', '$').allowed, true);
        Assert.deepEqual(decision('qa', '$'), {
            path: '$', allowed: false, reason: 'uncovered',
        });
    });
    (0, node_test_1.test)('a-star-segment-matches-any-one-key', () => {
        Assert.deepEqual(decision('dev', '$.deploy.eu1.replicas'), {
            path: '$.deploy.eu1.replicas', allowed: true, reason: 'allow',
            by: '$.roles.dev.allow.1', pattern: '$.deploy.*.replicas',
        });
        Assert.equal(decision('product', '$.services.auth.description').allowed, true);
        // One key, not a run of them: the star does not reach further down
        // than the entry does, and it does not cover the map above it.
        Assert.equal(decision('dev', '$.deploy.eu1').allowed, false);
        Assert.equal(decision('dev', '$.deploy').allowed, false);
        Assert.equal(decision('dev', '$.deploy.eu1.replicas.max').allowed, true);
    });
    (0, node_test_1.test)('a-deny-entry-refuses-every-path-that-intersects-it', () => {
        // At the denied node.
        Assert.deepEqual(decision('dev', '$.services.auth.tier'), {
            path: '$.services.auth.tier', allowed: false, reason: 'deny',
            by: '$.roles.dev.deny.0', pattern: '$.services.*.tier',
        });
        // Below it: the denied node is an ancestor.
        Assert.equal(decision('dev', '$.services.auth.tier.name').reason, 'deny');
        // Above it: a change here could rewrite the denied node, so an
        // allow that would otherwise cover is beaten.
        Assert.equal(decision('dev', '$.services.auth').reason, 'deny');
        Assert.equal(decision('dev', '$.services').reason, 'deny');
        Assert.equal(decision('dev', '$').reason, 'deny');
        // Beside it: a sibling of the denied node is untouched.
        Assert.equal(decision('dev', '$.services.auth.replicas').reason, 'allow');
    });
    (0, node_test_1.test)('deny-wins-over-allow-whatever-the-order', () => {
        const src = 'roles: r: { deny: ["$.a.b"] allow: ["$.a"] }';
        Assert.equal(decision('r', '$.a.b', src).reason, 'deny');
        Assert.equal(decision('r', '$.a.c', src).reason, 'allow');
    });
    (0, node_test_1.test)('a-path-nothing-covers-is-refused-uncovered', () => {
        Assert.deepEqual(decision('qa', '$.services.auth'), {
            path: '$.services.auth', allowed: false, reason: 'uncovered',
        });
        // A role with no allow list allows nothing: the shape's empty list
        // is what generates for it.
        Assert.equal(decision('r', '$.a', 'roles: r: {}').reason, 'uncovered');
    });
    (0, node_test_1.test)('the-verdict-is-allowed-only-when-every-path-is', () => {
        const both = (0, aontu_1.allow)(ROLES, 'dev', ['$.services.auth.replicas', '$.deploy.eu1.replicas']);
        Assert.equal(both.verdict, 'allowed');
        Assert.deepEqual(both.findings, []);
        Assert.deepEqual(both.paths.map((d) => d.allowed), [true, true]);
        const mixed = (0, aontu_1.allow)(ROLES, 'dev', ['$.services.auth.replicas', '$.tests']);
        Assert.equal(mixed.verdict, 'refused');
        Assert.deepEqual(mixed.paths.map((d) => d.reason), ['allow', 'uncovered']);
        // Nothing asked is nothing allowed.
        const none = (0, aontu_1.allow)(ROLES, 'admin', []);
        Assert.equal(none.verdict, 'refused');
        Assert.deepEqual(none.paths, []);
    });
    (0, node_test_1.test)('paths-are-normalised-the-way-a-reference-reads-them', () => {
        Assert.equal(decision('dev', 'services.auth').path, '$.services.auth');
        Assert.equal(decision('dev', '$.services.auth.').path, '$.services.auth');
        Assert.equal(decision('admin', '').path, '$');
        Assert.equal(decision('admin', '$.').path, '$');
        // Written the same way in the model.
        const src = 'roles: r: { allow: ["a.b"] deny: ["$.a.b.c."] }';
        Assert.equal(decision('r', '$.a.b.d', src).reason, 'allow');
        Assert.equal(decision('r', '$.a.b.c.d', src).reason, 'deny');
    });
    (0, node_test_1.test)('an-undeclared-role-is-refused-with-the-nearest-name', () => {
        const r = (0, aontu_1.allow)(ROLES, 'de', ['$.services', '$.tests']);
        Assert.equal(r.verdict, 'refused');
        Assert.equal(r.role, 'de');
        Assert.deepEqual(r.paths, [
            { path: '$.services', allowed: false, reason: 'no_role' },
            { path: '$.tests', allowed: false, reason: 'no_role' },
        ]);
        Assert.equal(r.findings.length, 1);
        Assert.equal(r.findings[0].code, 'no_path');
        Assert.equal(r.findings[0].path, '$.roles.de');
        Assert.equal(r.findings[0].note, 'did you mean dev?');
    });
    (0, node_test_1.test)('a-model-that-does-not-stand-up-is-an-error', () => {
        // The shape is aontu, so a malformed role is the engine's refusal,
        // with the engine's code: a string where the list should be.
        const bad = (0, aontu_1.allow)('roles: dev: { allow: "$.a" }', 'dev', ['$.a']);
        Assert.equal(bad.verdict, 'error');
        Assert.deepEqual(bad.paths, []);
        Assert.equal(bad.findings.length, 1);
        Assert.equal(bad.findings[0].code, 'scalar_kind');
        Assert.equal(bad.findings[0].path, '$');
        // A roles map that is not a map.
        Assert.equal((0, aontu_1.allow)('roles: 1', 'dev', ['$.a']).verdict, 'error');
        // A conflict anywhere in the model, roles or not.
        Assert.equal((0, aontu_1.allow)('roles: dev: { allow: ["$"] }\nx: 1\nx: 2', 'dev', ['$.a']).verdict, 'error');
        // A source that ends without a newline meets the shape on a line
        // of its own, so a trailing comment does not swallow it.
        Assert.equal((0, aontu_1.allow)('roles: dev: { allow: ["$"] } # all', 'dev', ['$.a']).verdict, 'allowed');
        // The empty model declares no role.
        const empty = (0, aontu_1.allow)('', 'dev', ['$.a']);
        Assert.equal(empty.verdict, 'refused');
        Assert.equal(empty.findings[0].code, 'no_path');
    });
    (0, node_test_1.test)('a-role-that-is-not-concrete-is-an-error-at-generation', () => {
        const r = (0, aontu_1.allow)('roles: dev: { allow: [string] }', 'dev', ['$.a']);
        Assert.equal(r.verdict, 'error');
        Assert.deepEqual(r.paths, []);
        Assert.equal(r.findings.length, 1);
        Assert.equal(r.findings[0].code, 'listval_no_gen');
        Assert.equal(r.findings[0].path, '$.roles.dev');
        Assert.equal(r.findings[0].class, 'reference');
        Assert.deepEqual(r.findings[0].sites, []);
    });
    (0, node_test_1.test)('at-moves-the-roles-map', () => {
        const src = 'policy: { roles: { dev: { allow: ["$.a"] } } }';
        const r = (0, aontu_1.allow)(src, 'dev', ['$.a.b'], { at: '$.policy.roles' });
        Assert.equal(r.verdict, 'allowed');
        Assert.equal(r.paths[0].by, '$.policy.roles.dev.allow.0');
        // The roles map may be the document itself, and the shape is then
        // a top-level spread.
        const top = (0, aontu_1.allow)('dev: { allow: ["$.a"] deny: ["$.a.x"] }', 'dev', ['$.a.b', '$.a.x'], { at: '$' });
        Assert.equal(top.verdict, 'refused');
        Assert.deepEqual(top.paths.map((d) => d.by), ['$.dev.allow.0', '$.dev.deny.0']);
        // Unknown role under a moved anchor names the anchor.
        const miss = (0, aontu_1.allow)(src, 'qa', ['$.a'], { at: '$.policy.roles' });
        Assert.equal(miss.findings[0].path, '$.policy.roles.qa');
    });
    (0, node_test_1.test)('relative-loads-resolve-from-the-models-own-directory', () => {
        const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-allow-'));
        Fs.writeFileSync(Path.join(dir, 'dev.aon'), 'roles: dev: { allow: ["$.services"] }');
        const model = Path.join(dir, 'roles.aon');
        const src = '@"dev.aon"\nroles: qa: { allow: ["$.tests"] }';
        Fs.writeFileSync(model, src);
        const r = (0, aontu_1.allow)(src, 'dev', ['$.services.auth'], { path: model });
        Assert.equal(r.verdict, 'allowed');
        // Denied the load, the included role is not there to answer.
        const denied = (0, aontu_1.allow)(src, 'dev', ['$.services.auth'], { path: model, trust: { include: 'none' } });
        Assert.equal(denied.verdict, 'error');
        Assert.equal(denied.findings[0].code, 'include_denied');
    });
});
//# sourceMappingURL=allow.test.js.map