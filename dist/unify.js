"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unify = exports.Context = void 0;
const type_1 = require("./type");
const val_1 = require("./val");
const lang_1 = require("./lang");
const op_1 = require("./op/op");
class Context {
    constructor(cfg) {
        this.cc = -1;
        this.var = {};
        this.root = cfg.root;
        this.path = cfg.path || [];
        this.err = cfg.err || [];
        // Multiple unify passes will keep incrementing Val counter.
        this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc;
        this.cc = null == cfg.cc ? this.cc : cfg.cc;
        this.var = cfg.var || this.var;
    }
    clone(cfg) {
        return new Context({
            root: cfg.root || this.root,
            path: cfg.path,
            err: cfg.err || this.err,
            vc: this.vc,
            cc: this.cc,
            var: { ...this.var },
        });
    }
    descend(key) {
        return this.clone({
            root: this.root,
            path: this.path.concat(key),
        });
    }
}
exports.Context = Context;
class Unify {
    constructor(root, lang, ctx) {
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        this.cc = 0;
        this.root = root;
        this.res = root;
        this.err = root.err || [];
        let res = root;
        // Only unify if no syntax errors
        if (!root.nil) {
            ctx = ctx || new Context({
                root: res,
                err: this.err,
            });
            let maxdc = 9; // 99
            for (; this.cc < maxdc && type_1.DONE !== res.done; this.cc++) {
                ctx.cc = this.cc;
                res = (0, op_1.unite)(ctx, res, val_1.TOP);
                ctx = ctx.clone({ root: res });
            }
        }
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map