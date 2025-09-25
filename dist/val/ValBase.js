"use strict";
/* Copyright (c) 2021-2024 Richard Rodger, MIT License */
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
var _ValBase_ctx;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValBase = void 0;
const lang_1 = require("../lang");
let ID = 0;
class ValBase {
    // TODO: Site needed in ctor
    constructor(spec, ctx) {
        this.isVal = true;
        this.done = 0;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        this.top = false;
        // Actual native value.
        this.peg = undefined;
        // TODO: used for top level result - not great
        this.err = [];
        // TODO: implement!
        // site: Site
        _ValBase_ctx.set(this, void 0);
        __classPrivateFieldSet(this, _ValBase_ctx, ctx, "f");
        this.peg = spec?.peg;
        this.path = ctx?.path || [];
        // this.id = (9e9 + Math.floor(Math.random() * (1e9)))
        this.id = ++ID; // (9e9 + Math.floor(Math.random() * (1e5)))
        this.uh = [];
    }
    ctx() {
        return __classPrivateFieldGet(this, _ValBase_ctx, "f");
    }
    same(peer) {
        return null == peer ? false : this.id === peer.id;
    }
    clone(spec, ctx) {
        let cloneCtx;
        if (ctx) {
            let cut = this.path.indexOf('&');
            cut = -1 < cut ? cut + 1 : ctx.path.length;
            cloneCtx = ctx.clone({
                path: ctx.path.concat(this.path.slice(cut))
            });
        }
        let out = new this
            .constructor(spec || { peg: this.peg }, cloneCtx);
        out.row = spec?.row || this.row || -1;
        out.col = spec?.col || this.col || -1;
        out.url = spec?.url || this.url || '';
        if (null == cloneCtx) {
            out.path = this.path.slice(0);
        }
        return out;
    }
    get site() {
        return new lang_1.Site(this);
    }
    unify(_peer, _ctx) { return this; }
    get canon() { return ''; }
    gen(_ctx) { return null; }
}
exports.ValBase = ValBase;
_ValBase_ctx = new WeakMap();
//# sourceMappingURL=ValBase.js.map