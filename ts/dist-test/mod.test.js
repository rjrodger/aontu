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
// MODULES (G6 phase 2, docs/capability-review/g6-distribution.md). The
// shared contract rows are test/spec/mod.tsv (both runners,
// root-confined to the fixtures directory, which is also why they never
// reach the user cache); what is per-port — the cache location, the
// host-injected filesystem, the verification depth bound — is here,
// with go/mod_test.go as the twin.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Os = __importStar(require("node:os"));
const Path = __importStar(require("node:path"));
const aontu_1 = require("../dist/aontu");
// Forward slashes for paths EMBEDDED IN SOURCE text: inside an @"..."
// include a backslash is an ESCAPE character (trust.test.ts's `sp`).
const sp = (p) => p.split('\\').join('/');
const MODULE = 'name: string\nport: *8080 | integer\n';
// A project whose main.aon imports one module, and the module itself,
// placed wherever the caller says. Answers the paths and the module's
// canon-hash — which is what a pin IS, so a test that wants to pin
// something has to compute it the same way `aontu hash` does.
function world(store) {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-mod-'));
    const cache = Path.join(dir, 'cache');
    const hash = (0, aontu_1.canonHash)(new aontu_1.Aontu().unify(MODULE));
    const moddir = 'vendor' === store
        ? Path.join(dir, 'aon_vendor', 'corp.example', 'schemas', 'service@1')
        : Path.join(cache, hash);
    Fs.mkdirSync(moddir, { recursive: true });
    Fs.writeFileSync(Path.join(moddir, 'mod.aon'), 'mod: {path: "corp.example/schemas/service", main: "service.aon"}\n');
    Fs.writeFileSync(Path.join(moddir, 'service.aon'), MODULE);
    Fs.writeFileSync(Path.join(dir, 'mod.aon'), 'mod: {path: "corp.example/app"}\n');
    const main = Path.join(dir, 'main.aon');
    Fs.writeFileSync(main, 'svc: @"corp.example/schemas/service@1#' + hash + '"\nsvc: name: "auth"\n');
    return { dir, main, hash, cache };
}
(0, node_test_1.describe)('mod', () => {
    (0, node_test_1.test)('cache-is-content-addressed', () => {
        // No vendor copy at all: the module is in the user cache, under its
        // OWN HASH. That is what content-addressed means — a cache hit is
        // already the right meaning before anything is read from it, which
        // is also why the cache is consulted only when a pin is known.
        const w = world('cache');
        const a0 = new aontu_1.Aontu({ mod: { cache: w.cache } });
        Assert.deepEqual(a0.generate('x: @"' + sp(w.main) + '"'), { x: { svc: { name: 'auth', port: 8080 } } });
    });
    (0, node_test_1.test)('cache-is-not-consulted-under-a-root', () => {
        // A confined evaluation sees the project's own aon_vendor/ and
        // nothing else: the cache lives outside any root, so a rooted
        // profile that would have to reach it reports the module missing
        // instead. (docs/trust.md: confinement is about what may be READ.)
        const w = world('cache');
        const a0 = new aontu_1.Aontu({
            mod: { cache: w.cache },
            trust: { include: { root: w.dir } },
        });
        Assert.throws(() => a0.generate('x: @"' + sp(w.main) + '"'), (err) => String(err.message).includes('module not fetched:'));
    });
    (0, node_test_1.test)('cache-defaults-to-the-platform-location', () => {
        // With no host-named cache the platform's own is used. Pointed at a
        // temporary directory through XDG_CACHE_HOME so the test never
        // reads the developer's real cache — the point is the LOOKUP, not
        // where a particular machine keeps it.
        const w = world('cache');
        const xdg = Path.join(w.dir, 'xdg');
        Fs.mkdirSync(Path.join(xdg, 'aontu'), { recursive: true });
        Fs.renameSync(w.cache, Path.join(xdg, 'aontu', 'mod'));
        const saved = process.env.XDG_CACHE_HOME;
        process.env.XDG_CACHE_HOME = xdg;
        try {
            Assert.deepEqual(new aontu_1.Aontu().generate('x: @"' + sp(w.main) + '"'), { x: { svc: { name: 'auth', port: 8080 } } });
        }
        finally {
            if (undefined === saved) {
                delete process.env.XDG_CACHE_HOME;
            }
            else {
                process.env.XDG_CACHE_HOME = saved;
            }
        }
    });
    (0, node_test_1.test)('cache-falls-back-to-the-home-directory', () => {
        // No XDG_CACHE_HOME: `~/.cache/aontu/mod` is the platform default
        // this falls back to, and HOME is pointed at a temporary directory
        // for the same reason XDG was above.
        const w = world('cache');
        const home = Path.join(w.dir, 'home');
        Fs.mkdirSync(Path.join(home, '.cache', 'aontu'), { recursive: true });
        Fs.renameSync(w.cache, Path.join(home, '.cache', 'aontu', 'mod'));
        const savedXdg = process.env.XDG_CACHE_HOME;
        const savedHome = process.env.HOME;
        delete process.env.XDG_CACHE_HOME;
        process.env.HOME = home;
        try {
            Assert.deepEqual(new aontu_1.Aontu().generate('x: @"' + sp(w.main) + '"'), { x: { svc: { name: 'auth', port: 8080 } } });
        }
        finally {
            if (undefined !== savedXdg) {
                process.env.XDG_CACHE_HOME = savedXdg;
            }
            if (undefined === savedHome) {
                delete process.env.HOME;
            }
            else {
                process.env.HOME = savedHome;
            }
        }
    });
    (0, node_test_1.test)('no-home-means-no-cache', () => {
        // A host with no home directory has no cache, and that is a MISS
        // rather than a failure: the module is simply not in any store this
        // evaluation can read, which is what the message says.
        const w = world('cache');
        const savedXdg = process.env.XDG_CACHE_HOME;
        const savedHome = process.env.HOME;
        delete process.env.XDG_CACHE_HOME;
        delete process.env.HOME;
        try {
            Assert.throws(() => new aontu_1.Aontu().generate('x: @"' + sp(w.main) + '"'), (err) => String(err.message).includes('module not fetched:'));
        }
        finally {
            if (undefined !== savedXdg) {
                process.env.XDG_CACHE_HOME = savedXdg;
            }
            if (undefined !== savedHome) {
                process.env.HOME = savedHome;
            }
        }
    });
    (0, node_test_1.test)('host-filesystem-reports-a-missing-module', () => {
        // The same channel, missing: a store the host's filesystem does not
        // have is a module that is not fetched, not a crash on the stat.
        const w = world('vendor');
        Fs.rmSync(Path.join(w.dir, 'aon_vendor'), { recursive: true });
        const a0 = new aontu_1.Aontu({ fs: Fs });
        Assert.throws(() => a0.generate('x: @"' + sp(w.main) + '"'), (err) => String(err.message).includes('module not fetched:'));
    });
    (0, node_test_1.test)('host-filesystem-is-the-one-modules-are-read-from', () => {
        // An injected `fs` is the filesystem the host gave this evaluation,
        // and a module store read through any other one would escape it.
        // Injecting the real fs proves the channel: the module leg reads
        // through the host's handle rather than importing its own.
        const w = world('vendor');
        const a0 = new aontu_1.Aontu({ fs: Fs });
        Assert.deepEqual(a0.generate('x: @"' + sp(w.main) + '"'), { x: { svc: { name: 'auth', port: 8080 } } });
    });
    (0, node_test_1.test)('a-vendor-store-outside-the-root-is-denied', () => {
        // Confinement is about what may be READ (docs/trust.md), and a
        // project root found by walking UP can sit above the confinement
        // root — so the vendor store it names is outside, and reading it
        // would be the escape the root exists to refuse.
        const w = world('vendor');
        const sub = Path.join(w.dir, 'sub');
        Fs.mkdirSync(sub);
        const main = Path.join(sub, 'main.aon');
        Fs.copyFileSync(w.main, main);
        const a0 = new aontu_1.Aontu({ trust: { include: { root: sub } } });
        Assert.throws(() => a0.generate('x: @"' + sp(main) + '"'), (err) => String(err.message).includes('include denied:'));
    });
    (0, node_test_1.test)('verification-depth-is-bounded', () => {
        // A pinned module is verified by EVALUATING it, and that evaluation
        // resolves the module's own imports — so a vendor tree that led
        // back to itself would recurse until the host's stack gave out. The
        // bound makes it a stated refusal instead, exactly as unify_cycle
        // does, because a verdict that depends on the machine is what
        // docs/trust.md forbids. Entered at the bound directly: building a
        // sixteen-deep vendor tree would prove the same thing and nothing
        // more.
        const w = world('vendor');
        const a0 = new aontu_1.Aontu({ mod: { depth: 16 } });
        Assert.throws(() => a0.generate('x: @"' + sp(w.main) + '"'), (err) => String(err.message).includes('module depth:'));
    });
});
//# sourceMappingURL=mod.test.js.map