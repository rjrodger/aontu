"use strict";
/* Copyright (c) 2023-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.propagateMarks = propagateMarks;
exports.formatPath = formatPath;
exports.walk = walk;
// Mark value in source is propagated to target (true ratchets).
function propagateMarks(source, target) {
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
    // console.log('WALK-START', val.constructor.name, val.canon)
    let out = null == before ? val : before(key, val, parent, path || []);
    maxdepth = null != maxdepth && 0 <= maxdepth ? maxdepth : 32;
    if (null != maxdepth && 0 === maxdepth) {
        return out;
    }
    if (null != path && null != maxdepth && 0 < maxdepth && maxdepth <= path.length) {
        return out;
    }
    // console.log('WALK-PEG', out.canon)
    const child = out.peg;
    // Container Vals (Map etc) have peg = plain {} or []
    if (null != child && !child.isVal) {
        if ('object' === typeof child) {
            for (let ckey in child) {
                child[ckey] = walk(child[ckey], before, after, maxdepth, ckey, out, [...(path || []), ckey]);
            }
        }
        else if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                child[i] = walk(child[i], before, after, maxdepth, i, out, [...(path || []), '' + i]);
            }
        }
    }
    out = null == after ? out : after(key, out, parent, path || []);
    return out;
}
//# sourceMappingURL=utility.js.map