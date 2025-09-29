"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Context_errlist;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unify = exports.Context = void 0;
const type_1 = require("./type");
const val_1 = require("./val");
const lang_1 = require("./lang");
const op_1 = require("./op/op");
const err_1 = require("./err");
class Context {
    constructor(cfg) {
        this.cc = -1;
        this.var = {};
        _Context_errlist.set(this, void 0); // Nil error log of current unify.
        this.root = cfg.root;
        this.path = cfg.path || [];
        // this.err = cfg.err || []
        this.src = cfg.src;
        __classPrivateFieldSet(this, _Context_errlist, cfg.err || [], "f");
        // Multiple unify passes will keep incrementing Val counter.
        this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc;
        this.cc = null == cfg.cc ? this.cc : cfg.cc;
        this.var = cfg.var || this.var;
    }
    clone(cfg) {
        return new Context({
            root: cfg.root || this.root,
            path: cfg.path,
            err: cfg.err || __classPrivateFieldGet(this, _Context_errlist, "f"),
            vc: this.vc,
            cc: this.cc,
            var: { ...this.var },
            src: this.src,
        });
    }
    descend(key) {
        return this.clone({
            root: this.root,
            path: this.path.concat(key),
        });
    }
    get err() {
        let a = [...__classPrivateFieldGet(this, _Context_errlist, "f")];
        a.push = () => {
            throw new Error('ERR-PUSH');
        };
        return a;
    }
    adderr(err, whence) {
        // console.log('ADDERR', whence, err)
        ;
        __classPrivateFieldGet(this, _Context_errlist, "f").push(err);
        if (null == err.msg || '' == err.msg) {
            (0, err_1.descErr)(err, this);
        }
    }
}
exports.Context = Context;
_Context_errlist = new WeakMap();
class Unify {
    constructor(root, lang, ctx, src) {
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        this.cc = 0;
        this.root = root;
        this.res = root;
        this.err = root.err || [];
        let res = root;
        let uctx = ctx;
        // Only unify if no syntax errors
        if (!root.nil) {
            uctx = uctx ?? new Context({
                root: res,
                err: this.err,
                src,
            });
            let maxdc = 9; // 99
            for (; this.cc < maxdc && type_1.DONE !== res.done; this.cc++) {
                uctx.cc = this.cc;
                res = (0, op_1.unite)(uctx, res, val_1.TOP);
                uctx = uctx.clone({ root: res });
            }
        }
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map