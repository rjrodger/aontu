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
var _BaseVal_ctx;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseVal = void 0;
const type_1 = require("../type");
const lang_1 = require("../lang");
let ID = 1000;
class BaseVal {
    // TODO: Site needed in ctor
    constructor(spec, ctx) {
        this.isVal = true;
        this.isTop = false;
        this.isNil = false;
        this.isMap = false;
        this.isList = false;
        this.isScalar = false;
        this.isScalarKind = false;
        this.isRef = false;
        this.isPref = false;
        this.isVar = false;
        this.isBag = false;
        this.isNumber = false;
        this.isInteger = false;
        this.isString = false;
        this.isBoolean = false;
        this.isConjunct = false;
        this.isDisjunct = false;
        this.isJunction = false;
        this.isOp = false;
        this.isPlusOp = false;
        this.isFunc = false;
        this.isCloseFunc = false;
        this.isCopyFunc = false;
        this.isKeyFunc = false;
        this.isLowerFunc = false;
        this.isOpenFunc = false;
        this.isPrefFunc = false;
        this.isSuperFunc = false;
        this.isTypeFunc = false;
        this.isUpperFunc = false;
        this.dc = 0;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        // Map of boolean flags.
        this.mark = {};
        // Actual native value.
        this.peg = undefined;
        // TODO: used for top level result - not great
        this.err = [];
        // TODO: implement!
        // site: Site
        _BaseVal_ctx.set(this, void 0);
        __classPrivateFieldSet(this, _BaseVal_ctx, ctx, "f");
        this.peg = spec?.peg;
        if (Array.isArray(this.peg)) {
            let spread = this.peg[type_1.SPREAD];
            this.peg = this.peg.filter(n => undefined !== n);
            this.peg[type_1.SPREAD] = spread;
        }
        this.path = ctx?.path || [];
        // TODO: make this work
        // this.id = spec?.id ?? (ctx ? ++ctx.vc : ++ID)
        this.id = ++ID;
        this.uh = [];
        this.mark.type = !!spec.type;
        this.mark.hide = !!spec.hide;
        // console.log('BV', this.id, this.constructor.name, this.peg?.canon)
    }
    ctx() {
        return __classPrivateFieldGet(this, _BaseVal_ctx, "f");
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
        let fullspec = { peg: this.peg, type: this.mark.type, hide: this.mark.hide, ...(spec ?? {}) };
        let out = new this
            .constructor(fullspec, cloneCtx);
        out.row = spec?.row || this.row || -1;
        out.col = spec?.col || this.col || -1;
        out.url = spec?.url || this.url || '';
        // TODO: should not be needed - update all VAL ctors to handle spec.type
        out.mark.type = this.mark.type && fullspec.type;
        out.mark.hide = this.mark.hide && fullspec.hide;
        return out;
    }
    // TODO: should use Site
    place(v) {
        v.row = this.row;
        v.col = this.col;
        v.url = this.url;
        return v;
    }
    // TODO: make Site work
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
exports.BaseVal = BaseVal;
_BaseVal_ctx = new WeakMap();
//# sourceMappingURL=BaseVal.js.map