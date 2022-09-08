"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unify = exports.Context = void 0;
const type_1 = require("./type");
const lang_1 = require("./lang");
const op_1 = require("./op/op");
const MapVal_1 = require("../lib/val/MapVal");
class Context {
    constructor(cfg) {
        this.root = cfg.root;
        this.path = [];
        this.err = cfg.err || [];
        // Multiple unify passes will keep incrementing Val counter.
        this.vc = null == cfg.vc ? 1000000000 : cfg.vc;
    }
    clone(cfg) {
        return new Context({
            root: cfg.root || this.root,
            err: cfg.err || this.err,
            vc: this.vc,
        });
    }
    descend(key) {
        return this.clone({
            root: this.root,
            path: this.path.concat(key),
        });
    }
    find(ref) {
        // console.log('FIND', ref.path, ref.peg)
        // TODO: relative paths
        if (this.root instanceof MapVal_1.MapVal && ref.absolute) {
            let node = this.root;
            let pI = 0;
            for (; pI < ref.parts.length && node instanceof MapVal_1.MapVal; pI++) {
                let part = ref.parts[pI];
                node = node.peg[part];
            }
            if (pI === ref.parts.length) {
                return node;
            }
        }
    }
}
exports.Context = Context;
class Unify {
    constructor(root, lang) {
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        this.root = root;
        this.res = root;
        this.err = [];
        let res = root;
        let ctx = new Context({
            root: res,
            err: this.err,
        });
        // TODO: derive maxdc from res deterministically
        // perhaps parse should count intial vals, paths, etc?
        let maxdc = 999;
        for (this.dc = 0; this.dc < maxdc && type_1.DONE !== res.done; this.dc++) {
            res = (0, op_1.unite)(ctx, res, type_1.TOP);
            ctx = ctx.clone({ root: res });
        }
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map