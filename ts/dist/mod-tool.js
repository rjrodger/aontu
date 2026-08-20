"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionCompare = versionCompare;
exports.lockText = lockText;
exports.modTidy = modTidy;
exports.modVendor = modVendor;
// MODULE TOOLING (G6 phase 3, docs/capability-review/g6-distribution.md):
// the LOCAL half — `aontu mod tidy` and `aontu mod vendor`.
//
// Evaluation never touches the network, and neither does this: `tidy`
// resolves versions and rewrites the lockfile from what is already in
// the local stores, and `vendor` materialises the locked closure into
// the project. Fetching and publishing are the network half, and are
// not in this build (see the register).
//
// MINIMUM VERSION SELECTION, not a solver: each module declares the
// MINIMUM version of each dependency it needs, and the selected version
// is the maximum of those minima over the closure. Deterministic, and
// deterministic without backtracking — the lockfile CONFIRMS the
// resolution rather than determining it, which is why a tidy run can be
// re-run to the same bytes.
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const mod_1 = require("./mod");
// The `dep` block a module file declares: import string -> version.
function declaredDeps(file, options) {
    if (!(0, node_fs_1.existsSync)(file)) {
        return {};
    }
    const gen = options.eval((0, node_fs_1.readFileSync)(file, 'utf8'), file).gen;
    const dep = gen?.dep;
    if (null == dep || 'object' !== typeof dep) {
        return {};
    }
    const out = {};
    for (const key of Object.keys(dep)) {
        const v = dep[key]?.v;
        if ('string' === typeof v && '' !== v) {
            out[key] = v;
        }
    }
    return out;
}
// Numeric-dotted version order: `1.10.0` is above `1.9.0`, which
// STRING order gets wrong, and that is the whole reason this is not a
// `<` on the text. A part that is not a number compares as text, after
// every number — a pre-release tag is below no version and above none.
function versionCompare(a, b) {
    const ap = a.split('.');
    const bp = b.split('.');
    for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
        // A part the shorter version does not have is ZERO, so `1.2` and
        // `1.2.0` are the same version -- which is what everyone means by
        // them, and what a lockfile rewritten from either must agree on.
        const x = ap[i] ?? '0';
        const y = bp[i] ?? '0';
        if (x === y) {
            continue;
        }
        const xn = /^\d+$/.test(x);
        const yn = /^\d+$/.test(y);
        if (xn && yn) {
            return +x < +y ? -1 : 1;
        }
        if (xn !== yn) {
            return xn ? -1 : 1;
        }
        return x < y ? -1 : 1;
    }
    return 0;
}
// The directory a module is in, in the local stores: the project's
// vendor tree first, then the cache under the hash the lockfile pins.
function storeDir(root, ref, hash, options) {
    const stores = [(0, mod_1.moduleDir)((0, node_path_1.join)(root, 'aon_vendor'), ref)];
    if (null != options.cache && '' !== hash) {
        stores.push((0, node_path_1.join)(options.cache, hash));
    }
    return stores.find((d) => (0, node_fs_1.existsSync)((0, node_path_1.join)(d, 'mod.aon')));
}
// The lockfile's entries, as written.
function readLock(root) {
    const file = (0, node_path_1.join)(root, 'mod-lock.aon');
    if (!(0, node_fs_1.existsSync)(file)) {
        return {};
    }
    let lock;
    try {
        lock = JSON.parse((0, mod_1.lockJson)((0, node_fs_1.readFileSync)(file, 'utf8')));
    }
    catch {
        return {};
    }
    const out = {};
    for (const mod of Object.keys(lock?.lock ?? {})) {
        const e = lock.lock[mod];
        out[mod] = {
            mod,
            v: 'string' === typeof e?.v ? e.v : '',
            canon: 'string' === typeof e?.canon ? e.canon : '',
            oci: 'string' === typeof e?.oci ? e.oci : '',
        };
    }
    return out;
}
// The lockfile TEXT: canonical Aontu, one line, keys sorted. Built as
// source and canonicalised by the engine rather than printed by hand,
// so "canonical form" means what the language means by it and cannot
// drift from it.
function lockText(entries, options) {
    const parts = entries.map((e) => JSON.stringify(e.mod) + ':{' +
        '"canon":' + JSON.stringify(e.canon) + ',' +
        '"oci":' + JSON.stringify(e.oci) + ',' +
        '"v":' + JSON.stringify(e.v) + '}');
    // Canonicalised by the ENGINE rather than printed by hand, so
    // "canonical form" means what the language means by it and cannot
    // drift from it. For a map of scalars that canon is also JSON, which
    // is what lets the resolver read a pin back without an evaluator
    // (ts/src/mod.ts lockHash).
    return options.eval('{"lock":{' + parts.join(',') + '}}', 'mod-lock.aon').canon;
}
// `aontu mod tidy`: resolve the closure by MVS and rewrite the lockfile.
function modTidy(root, options) {
    const previous = readLock(root);
    const selected = {};
    const missing = [];
    // The closure, breadth-first from the project's own declarations. A
    // module already selected at a version at least as high contributes
    // nothing new, which is what makes this terminate without a cycle
    // check: the selected version only ever rises.
    let frontier = declaredDeps((0, node_path_1.join)(root, 'mod.aon'), options);
    for (; 0 < Object.keys(frontier).length;) {
        const next = {};
        for (const mod of Object.keys(frontier)) {
            const want = frontier[mod];
            const have = selected[mod];
            if (null != have && 0 <= versionCompare(have, want)) {
                continue;
            }
            selected[mod] = want;
            const ref = (0, mod_1.parseModuleRef)(mod);
            if (undefined === ref) {
                // A dependency key that is not a module path names nothing this
                // resolver can find, which is the same answer as a module that
                // is not there.
                missing.push(mod);
                continue;
            }
            const dir = storeDir(root, ref, previous[mod]?.canon ?? '', options);
            if (undefined === dir) {
                missing.push(mod);
                continue;
            }
            const deps = declaredDeps((0, node_path_1.join)(dir, 'mod.aon'), options);
            for (const key of Object.keys(deps)) {
                const bid = next[key];
                if (null == bid || 0 > versionCompare(bid, deps[key])) {
                    next[key] = deps[key];
                }
            }
        }
        frontier = next;
    }
    const lock = [];
    for (const mod of Object.keys(selected).sort()) {
        if (missing.includes(mod)) {
            continue;
        }
        const ref = (0, mod_1.parseModuleRef)(mod);
        const dir = storeDir(root, ref, previous[mod]?.canon ?? '', options);
        const main = (0, node_path_1.join)(dir, mainOf(dir, options));
        lock.push({
            mod,
            v: selected[mod],
            // RECOMPUTED, never carried over: the pin is what the module in
            // this store MEANS, and a tidy that copied the old hash forward
            // would pin what it used to mean.
            canon: (0, node_fs_1.existsSync)(main) ?
                options.eval((0, node_fs_1.readFileSync)(main, 'utf8'), main).hash : '',
            // Carried over: the OCI digest is the registry's word about the
            // bytes it served, and nothing local can hear it.
            oci: previous[mod]?.oci ?? '',
        });
    }
    const uniqueMissing = [...new Set(missing)].sort();
    if (0 === uniqueMissing.length) {
        (0, node_fs_1.writeFileSync)((0, node_path_1.join)(root, 'mod-lock.aon'), LOCK_HEADER + lockText(lock, options) + '\n');
    }
    return {
        verdict: 0 === uniqueMissing.length ? 'ok' : 'missing',
        lock,
        missing: uniqueMissing,
    };
}
// The generated-file header. A lockfile is machine-written, and the
// file says so where an editor will see it.
const LOCK_HEADER = '# mod-lock.aon (generated by `aontu mod tidy`; do not edit)\n';
// The entry file a module declares, or the default. `dir` is always a
// STORE directory, and `storeDir` only answers one that holds a
// `mod.aon` -- so there is no missing-file arm to take here.
function mainOf(dir, options) {
    const file = (0, node_path_1.join)(dir, 'mod.aon');
    const gen = options.eval((0, node_fs_1.readFileSync)(file, 'utf8'), file).gen;
    const main = gen?.mod?.main;
    return 'string' === typeof main && '' !== main ? main : 'main.aon';
}
// `aontu mod vendor`: materialise the locked closure into `aon_vendor/`.
function modVendor(root, options) {
    const locked = readLock(root);
    const vendored = [];
    const missing = [];
    for (const mod of Object.keys(locked).sort()) {
        const ref = (0, mod_1.parseModuleRef)(mod);
        if (undefined === ref) {
            missing.push(mod);
            continue;
        }
        const from = storeDir(root, ref, locked[mod].canon, options);
        if (undefined === from) {
            missing.push(mod);
            continue;
        }
        const to = (0, mod_1.moduleDir)((0, node_path_1.join)(root, 'aon_vendor'), ref);
        if (from !== to) {
            copyTree(from, to);
        }
        vendored.push(mod);
    }
    return {
        verdict: 0 === missing.length ? 'ok' : 'missing',
        vendored,
        missing: missing.sort(),
    };
}
// A whole module directory, copied. Modules are source trees — that is
// what an OCI layer holds — so this walks rather than reading one file.
function copyTree(from, to) {
    (0, node_fs_1.mkdirSync)(to, { recursive: true });
    for (const name of (0, node_fs_1.readdirSync)(from).sort()) {
        const src = (0, node_path_1.join)(from, name);
        const dst = (0, node_path_1.join)(to, name);
        if ((0, node_fs_1.statSync)(src).isDirectory()) {
            copyTree(src, dst);
        }
        else {
            (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(dst), { recursive: true });
            (0, node_fs_1.copyFileSync)(src, dst);
        }
    }
}
//# sourceMappingURL=mod-tool.js.map