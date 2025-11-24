"use strict";
/* Copyright (c) 2023-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.propagateMarks = propagateMarks;
exports.formatPath = formatPath;
exports.walk = walk;
exports.explainOpen = explainOpen;
exports.ec = ec;
exports.explainClose = explainClose;
exports.formatExplain = formatExplain;
// Mark value in source is propagated to target (true ratchets).
function propagateMarks(source, target) {
    // Don't infect top!
    if (source.isTop || target.isTop) {
        return;
    }
    for (let name in source.mark) {
        target.mark[name] = target.mark[name] || source.mark[name];
    }
}
function formatPath(path, absolute) {
    let parts;
    if (Array.isArray(path)) {
        parts = path;
    }
    else {
        parts = path.path;
    }
    let pathstr = (0 < parts.length && false !== absolute ? '$.' : '') + parts.join('.');
    return pathstr;
}
/**
 * Walk a Val structure depth first, applying functions before and after descending.
 * Only traverses Val instances - stops at non-Val children.
 */
function walk(
// These arguments are the public interface.
val, 
// Before descending into a node.
before, 
// After descending into a node.
after, 
// Maximum recursive depth, default: 32. Use null for infinite depth.
maxdepth, 
// These arguments are used for recursive state.
key, parent, path) {
    let out = null == before ? val : before(key, val, parent, path || []);
    maxdepth = null != maxdepth && 0 <= maxdepth ? maxdepth : 32;
    if (null != maxdepth && 0 === maxdepth) {
        return out;
    }
    if (null != path && null != maxdepth && 0 < maxdepth && maxdepth <= path.length) {
        return out;
    }
    const child = out.peg;
    // Container Vals (Map etc) have peg = plain {} or []
    if (null != child && !child.isVal) {
        if ('object' === typeof child) {
            for (let ckey in child) {
                if (child[ckey] && child[ckey].isVal) {
                    child[ckey] = walk(child[ckey], before, after, maxdepth, ckey, out, [...(path || []), ckey]);
                }
            }
        }
        else if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                if (child[i] && child[i].isVal) {
                    child[i] = walk(child[i], before, after, maxdepth, i, out, [...(path || []), '' + i]);
                }
            }
        }
    }
    out = null == after ? out : after(key, out, parent, path || []);
    return out;
}
const T_NOTE = 0;
const T_WHY = 1;
const T_PATH = 2;
const T_AVAL = 3;
const T_BVAL = 4;
const T_OVAL = 5;
const T_CHILDREN = 6;
function explainOpen(ctx, t, note, ac, bc) {
    if (false === t)
        return null;
    t = t ?? [null, 'root', null, null, null, null];
    t[T_WHY] = t[T_WHY] ?? '';
    t[T_NOTE] = (0 <= ctx.cc ? ctx.cc + '~' : '') + note;
    t[T_PATH] = ['$', ctx.path.join('.')].filter(p => '' != p).join('.') + '  ';
    if (ac) {
        t[T_AVAL] = ac.id + (ac.done ? '' : '!') + '=' + ac.canon;
    }
    if (bc) {
        t[T_BVAL] = bc.id + (bc.done ? '' : '!') + '=' + bc.canon;
    }
    return t;
}
function ec(t, why) {
    if (null == t)
        return;
    const child = [null, why, null, null, null, null];
    t[T_CHILDREN] = t[T_CHILDREN] ?? [];
    t[T_CHILDREN].push(child);
    return child;
}
function explainClose(t, out) {
    if (null == t)
        return;
    if (out) {
        t[T_OVAL] = '-> ' + out.id + (out.done ? '' : '!') + '=' + out.canon;
    }
}
function formatExplain(t, d) {
    d = null == d ? 0 : d;
    const indent = ('  '.repeat(d));
    if (Array.isArray(t)) {
        const b = [
            indent + t.slice(0, t.length - 1).join(' ')
        ];
        const children = t[t.length - 1];
        if (Array.isArray(children)) {
            for (let ce of children) {
                b.push(formatExplain(ce, d + 1));
            }
        }
        return b.join('\n');
    }
    else {
        return indent + t;
    }
}
//# sourceMappingURL=utility.js.map