"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AontuContext = void 0;
const type_1 = require("./type");
const MapVal_1 = require("./val/MapVal");
const ListVal_1 = require("./val/ListVal");
const err_1 = require("./err");
class AontuContext {
    constructor(cfg) {
        this.cc = -1;
        this.vars = {};
        this.root = cfg.root;
        this.path = [...(cfg.path ?? [])];
        this.src = cfg.src;
        this.collect = cfg.collect ?? null != cfg.err;
        this.err = cfg.err ?? [];
        this.explain = Array.isArray(cfg.explain) ? cfg.explain : null;
        this.fs = cfg.fs ?? null;
        // Multiple unify passes will keep incrementing Val counter.
        this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc;
        this.cc = null == cfg.cc ? this.cc : cfg.cc;
        this.vars = cfg.vars ?? this.vars;
        this.seenI = cfg.seenI ?? 0;
        this.seen = cfg.seen ?? {};
        this.srcpath = cfg.srcpath ?? undefined;
        this.deps = cfg.deps ?? {};
        this.opts = (0, type_1.DEFAULT_OPTS)();
        this.addopts(cfg.opts);
    }
    clone(cfg) {
        const ctx = Object.create(this);
        ctx.path = cfg.path ?? this.path;
        ctx.root = cfg.root ?? this.root;
        ctx.var = Object.create(this.vars);
        ctx.collect = null != cfg.collect ? !!cfg.collect : ctx.collect;
        ctx.err = cfg.err ?? ctx.err;
        ctx.explain = Array.isArray(cfg.explain) ? cfg.explain : ctx.explain;
        ctx._pathstr = undefined;
        return ctx;
    }
    descend(key) {
        return this.clone({
            root: this.root,
            path: this.path.concat(key),
        });
    }
    addopts(opts) {
        if (null != opts) {
            Object.assign(this.opts, opts);
        }
        this.collect = (this.opts.collect ?? null != this.opts.err) ?? this.collect;
        this.err = this.opts.err ?? this.err;
        this.deps = this.opts.deps ?? this.deps;
        this.fs = this.opts.fs ?? this.fs;
        this.explain = this.opts.explain ?? this.explain;
        this.src = ('string' === typeof this.opts.src ? this.opts.src : undefined) ?? this.src;
        // TODO: rename srcpath to file
        this.srcpath = this.opts.path ?? this.srcpath;
    }
    adderr(err) {
        if (null != err && err.isNil) {
            if (null == err.primary) {
                err.primary = err;
            }
            if (!this.err.includes(err)) {
                this.err.push(err);
            }
            if (null == err.msg || '' == err.msg) {
                (0, err_1.descErr)(err, this);
            }
        }
    }
    errmsg() {
        // return this.errlist
        return this.err
            .map((err) => err?.msg)
            .filter(msg => null != msg)
            .join('\n------\n');
    }
    find(path) {
        let node = this.root;
        let pI = 0;
        for (; pI < path.length; pI++) {
            let part = path[pI];
            if (node instanceof MapVal_1.MapVal) {
                node = node.peg[part];
            }
            else if (node instanceof ListVal_1.ListVal) {
                node = node.peg[part];
            }
            else {
                break;
            }
        }
        if (pI < path.length) {
            node = undefined;
        }
        return node;
    }
    get pathstr() {
        return this._pathstr ??
            (this._pathstr = this.path.map(p => p.replaceAll('.', '\\.')).join('.'));
    }
}
exports.AontuContext = AontuContext;
//# sourceMappingURL=ctx.js.map