"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_REFUSAL_CODES = exports.MODULE_MAX_DEPTH = exports.MODULE_MAX_ELEMS = exports.MODULE_MAX_PATH = void 0;
exports.parseModuleRef = parseModuleRef;
exports.validateModulePath = validateModulePath;
exports.moduleDir = moduleDir;
exports.projectRoots = projectRoots;
exports.lockJson = lockJson;
exports.modCacheDir = modCacheDir;
exports.modCacheDirFor = modCacheDirFor;
exports.lockHash = lockHash;
exports.resolveModule = resolveModule;
const node_path_1 = require("node:path");
const MODULE_RE = /^([a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+(?:\/[A-Za-z0-9._-]+)*)@(\d+)(?:#(aon1-[A-Za-z0-9_-]+))?$/;
function parseModuleRef(spec) {
    const m = MODULE_RE.exec(spec);
    if (null == m) {
        return undefined;
    }
    return {
        path: m[1],
        major: +m[2],
        ...(null == m[3] ? {} : { hash: m[3] }),
    };
}
exports.MODULE_MAX_PATH = 512;
exports.MODULE_MAX_ELEMS = 32;
const RESERVED_ELEMS = new Set([
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);
function validateModulePath(path) {
    if (exports.MODULE_MAX_PATH < path.length) {
        return 'longer than ' + exports.MODULE_MAX_PATH + ' characters';
    }
    const elems = path.split('/');
    if (exports.MODULE_MAX_ELEMS < elems.length) {
        return 'more than ' + exports.MODULE_MAX_ELEMS + ' elements';
    }
    for (const elem of elems) {
        if ('' === elem) {
            return 'an element is empty';
        }
        if (elem.startsWith('.') || elem.endsWith('.')) {
            return 'an element begins or ends with "."';
        }
        if (RESERVED_ELEMS.has(elem.split('.')[0].toLowerCase())) {
            return 'an element is a reserved device name';
        }
    }
    return undefined;
}
function escapeElem(elem) {
    return elem.replace(/[A-Z]/g, (c) => '!' + c.toLowerCase());
}
function moduleDir(store, ref) {
    return (0, node_path_1.join)(store, ...ref.path.split('/').map(escapeElem)) + '@' + ref.major;
}
function projectRoots(from, fs) {
    const roots = [];
    let dir = from;
    for (;;) {
        if (fs.existsSync((0, node_path_1.join)(dir, 'mod.aon'))) {
            roots.push(dir);
        }
        const up = (0, node_path_1.dirname)(dir);
        if (up === dir) {
            return 0 < roots.length ? roots : [from];
        }
        dir = up;
    }
}
function lockJson(text) {
    return text
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');
}
function modCacheDir() {
    return modCacheDirFor(process.platform, process.env);
}
function modCacheDirFor(platform, env) {
    const xdg = env.XDG_CACHE_HOME;
    if ('string' === typeof xdg && '' !== xdg) {
        return (0, node_path_1.join)(xdg, 'aontu', 'mod');
    }
    const home = env.HOME;
    if ('string' === typeof home && '' !== home) {
        return (0, node_path_1.join)(home, '.cache', 'aontu', 'mod');
    }
    if ('win32' === platform) {
        const local = env.LOCALAPPDATA;
        if ('string' === typeof local && '' !== local) {
            return (0, node_path_1.join)(local, 'aontu', 'mod');
        }
    }
    return undefined;
}
function lockHash(root, ref, fs) {
    const file = (0, node_path_1.join)(root, 'aontu_meta', 'mod-lock.aon');
    if (!fs.existsSync(file)) {
        return undefined;
    }
    let lock;
    try {
        lock = JSON.parse(lockJson(fs.readFileSync(file, 'utf8')));
    }
    catch {
        return undefined;
    }
    const entry = lock?.lock?.[ref.path + '@' + ref.major];
    return 'string' === typeof entry?.canon ? entry.canon : undefined;
}
exports.MODULE_MAX_DEPTH = 16;
exports.MODULE_REFUSAL_CODES = new Set([
    'module_path', 'module_missing', 'module_integrity', 'module_depth',
]);
function refuse(code, message) {
    const err = new Error(message);
    err.code = code;
    throw err;
}
// Resolve one module import against the local stores.
function resolveModule(ref, fromDir, fs, options) {
    const badpath = validateModulePath(ref.path);
    if (undefined !== badpath) {
        refuse('module_path', 'module path: ' + ref.path + '@' + ref.major + ' (' + badpath + ')');
    }
    if (exports.MODULE_MAX_DEPTH <= (options.depth ?? 0)) {
        refuse('module_depth', 'module depth: ' + ref.path + '@' + ref.major +
            ' (verification nested past ' + exports.MODULE_MAX_DEPTH + ')');
    }
    // EVERY enclosing project, innermost first (see projectRoots): a
    // vendored module is a project inside a project, and its nested
    // imports have to reach the tree the consumer vendored them into.
    const roots = projectRoots(fromDir, fs);
    // The PIN comes from the first lockfile that names this import. A
    // vendored module usually ships none, so that is the consumer's --
    // which is right: the consumer's lock is what its build is pinned to.
    const expect = ref.hash ??
        roots.map((r) => lockHash(r, ref, fs)).find((h) => null != h);
    const stores = roots.map((r) => moduleDir((0, node_path_1.join)(r, 'aontu_meta', 'vendor'), ref));
    if (null != options.cache && null != expect) {
        // Content-addressed: the cache is keyed by the hash, so a cache hit
        // is already the right MEANING before anything is read from it.
        stores.push((0, node_path_1.join)(options.cache, expect));
    }
    const dir = stores.find((d) => fs.existsSync((0, node_path_1.join)(d, 'mod.aon')));
    if (undefined === dir) {
        refuse('module_missing', 'module not fetched: ' + ref.path + '@' + ref.major +
            ' (run: aontu mod get)');
    }
    // The module's own `mod.aon` names its entry file. Read with the
    // evaluator rather than a regexp: a module file is ordinary Aontu,
    // and the language reading its own metadata is the point.
    const main = moduleMain((0, node_path_1.join)(dir, 'mod.aon'), fs, options);
    const full = (0, node_path_1.join)(dir, main);
    if (!fs.existsSync(full)) {
        refuse('module_missing', 'module not fetched: ' + ref.path + '@' + ref.major +
            ' (run: aontu mod get)');
    }
    const src = fs.readFileSync(full, 'utf8');
    if (null != expect) {
        // VERIFICATION IS ALWAYS LOCAL. The registry's annotation is
        // advisory; what decides is the hash of the module as it is on this
        // machine, recomputed now.
        const got = options.eval(src, full).hash;
        if (got !== expect) {
            refuse('module_integrity', 'module integrity: ' + ref.path + '@' + ref.major +
                ' expected ' + expect + ' got ' + got);
        }
    }
    return { full, src };
}
function moduleMain(file, fs, options) {
    const gen = options.eval(fs.readFileSync(file, 'utf8'), file).gen;
    const main = gen?.mod?.main;
    return 'string' === typeof main && '' !== main ? main : DEFAULT_MAIN;
}
const DEFAULT_MAIN = 'main.aon';
//# sourceMappingURL=mod.js.map