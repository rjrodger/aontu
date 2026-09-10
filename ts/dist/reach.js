"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNodePath = parseNodePath;
exports.reachCheck = reachCheck;
/* Copyright (c) 2025 Richard Rodger, MIT License */
const utility_1 = require("./utility");
const aontu_1 = require("./aontu");
const vet_1 = require("./vet");
const graph_1 = require("./graph");
const keyorder_1 = require("./keyorder");
function parseNodePath(s) {
    if ('$' === s) {
        return [];
    }
    if (!s.startsWith('$.')) {
        return undefined;
    }
    const parts = s.slice(2).split('.');
    return parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p)) ? parts : undefined;
}
function nodeAt(root, path) {
    let node = root;
    for (const seg of path) {
        if (true !== node?.isMap && true !== node?.isList) {
            return false;
        }
        node = node.peg[seg];
        if (null == node) {
            return false;
        }
    }
    return null != node;
}
function endpointFinding(name, known) {
    return {
        code: 'refer_unresolved',
        class: 'reference',
        severity: 'error',
        path: '$',
        message: `${name} names no node in this document.`,
        sites: [],
        ...(0 === known.length ? {} : {
            note: 'nodes with links: ' + known.join(', '),
        }),
    };
}
// The reachability check for one document.
function reachCheck(src, from, to, opts) {
    const options = opts ?? {};
    const aontu = new aontu_1.Aontu((0, utility_1.includeOpts)(options));
    const ctx = aontu.ctx({ collect: true });
    const parseOpts = null == options.path ? undefined : { path: options.path };
    const root = aontu.unify(src, parseOpts, ctx);
    // A document that does not stand up is not a document with an
    // unreachable pair: the errors it already has are the answer.
    if (0 < ctx.err.length || true === root?.isNil) {
        return {
            verdict: 'error',
            errors: [(0, vet_1.failureFinding)(ctx, options.path, root)],
        };
    }
    const graph = (0, graph_1.graphOf)(root);
    // The nodes the graph actually touches, for the error note: a
    // document has every path in it, and listing them all would drown the
    // one fact a mistyped endpoint needs.
    const linked = [...new Set(graph.edges
            .flatMap((e) => [e.from, e.to]))].sort(keyorder_1.cmpCodePoint);
    const missing = [from, to].filter((n) => {
        const parts = parseNodePath(n);
        return undefined === parts || !nodeAt(root, parts);
    });
    if (0 < missing.length) {
        return {
            verdict: 'error',
            errors: missing.map((n) => endpointFinding(n, linked)),
        };
    }
    // The successor map, restricted to one relation when the caller asked
    // for one. Sorted, so the path the search finds is the same one in
    // both ports.
    const succ = new Map();
    for (const e of graph.edges) {
        if (null != options.relation && options.relation !== e.key) {
            continue;
        }
        const list = succ.get(e.from);
        const dest = e.to;
        if (undefined === list) {
            succ.set(e.from, [dest]);
        }
        else if (!list.includes(dest)) {
            list.push(dest);
        }
    }
    for (const list of succ.values()) {
        list.sort(keyorder_1.cmpCodePoint);
    }
    const prev = new Map();
    const seen = new Set();
    let front = [from];
    while (0 < front.length) {
        const next = [];
        for (const node of front) {
            for (const dest of succ.get(node) ?? []) {
                if (dest === to) {
                    const path = [dest];
                    let step = node;
                    while (step !== from) {
                        path.unshift(step);
                        step = prev.get(step);
                    }
                    path.unshift(from);
                    return { verdict: 'reaches', path };
                }
                if (!seen.has(dest)) {
                    seen.add(dest);
                    prev.set(dest, node);
                    next.push(dest);
                }
            }
        }
        front = next;
    }
    return { verdict: 'unreachable' };
}
//# sourceMappingURL=reach.js.map