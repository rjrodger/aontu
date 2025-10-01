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
const type_1 = require("../type");
const lang_1 = require("../lang");
let ID = 1000;
class ValBase {
    // TODO: Site needed in ctor
    constructor(spec, ctx) {
        this.isVal = true;
        this.isTop = false;
        this.isNil = false;
        this.dc = 0;
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
        // TODO: make this work
        // this.id = spec?.id ?? (ctx ? ++ctx.vc : ++ID)
        this.id = ++ID;
        this.uh = [];
    }
    ctx() {
        return __classPrivateFieldGet(this, _ValBase_ctx, "f");
    }
    get done() {
        return this.dc === type_1.DONE;
    }
    same(peer) {
        return null == peer ? false : this.id === peer.id;
    }
    clone(ctx, spec) {
        let cloneCtx;
        let cut = this.path.indexOf('&');
        cut = -1 < cut ? cut + 1 : ctx.path.length;
        cloneCtx = ctx.clone({
            path: ctx.path.concat(this.path.slice(cut))
        });
        let out = new this
            .constructor(spec || { peg: this.peg }, cloneCtx);
        out.row = spec?.row || this.row || -1;
        out.col = spec?.col || this.col || -1;
        out.url = spec?.url || this.url || '';
        return out;
    }
    get site() {
        return new lang_1.Site(this);
    }
    // NOTE: MUST not mutate! Val immutability is a critical assumption. 
    unify(_peer, _ctx) { return this; }
    get canon() { return ''; }
    errcanon() {
        return 0 === this.err.length ? '' : `<ERRS:${this.err.length}>`;
    }
    gen(_ctx) {
        return undefined;
    }
    notdone() {
        this.dc = type_1.DONE === this.dc ? type_1.DONE : this.dc + 1;
    }
}
exports.ValBase = ValBase;
_ValBase_ctx = new WeakMap();
//# sourceMappingURL=ValBase.js.map