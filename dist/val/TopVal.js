"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TopVal_ctx;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopVal = exports.TOP = void 0;
const node_util_1 = require("node:util");
const type_1 = require("../type");
const lang_1 = require("../lang");
// There can be only one.
class TopVal {
    constructor() {
        this.isVal = true;
        this.isTop = true;
        this.isNil = false;
        this.isMap = false;
        this.isList = false;
        this.isScalar = false;
        this.isScalarKind = false;
        this.isConjunct = false;
        this.isDisjunct = false;
        this.isJunction = false;
        this.isPref = false;
        this.isRef = false;
        this.isVar = false;
        this.isNumber = false;
        this.isInteger = false;
        this.isString = false;
        this.isBoolean = false;
        this.isBag = false;
        this.isOp = true;
        this.isPlusOp = true;
        this.isFunc = false;
        this.isCloseFunc = false;
        this.isCopyFunc = false;
        this.isHideFunc = false;
        this.isMoveFunc = false;
        this.isKeyFunc = false;
        this.isLowerFunc = false;
        this.isOpenFunc = false;
        this.isPrefFunc = false;
        this.isSuperFunc = false;
        this.isTypeFunc = false;
        this.isUpperFunc = false;
        this.id = 0;
        this.dc = type_1.DONE;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        this.top = true;
        // Map of boolean flags.
        this.mark = { type: false, hide: false };
        // Actual native value.
        this.peg = undefined;
        // TODO: used for top level result - not great
        // err: Omit<any[], "push"> = []
        this.err = [];
        this.explain = null;
        this.uh = [];
        _TopVal_ctx.set(this, undefined);
        // TOP is always DONE, by definition.
        this.dc = type_1.DONE;
        this.mark.type = false;
        this.mark.hide = false;
    }
    get done() {
        return this.dc === type_1.DONE;
    }
    ctx() {
        return __classPrivateFieldGet(this, _TopVal_ctx, "f");
    }
    same(peer) {
        // return this === peer
        return peer.isTop;
    }
    place(v) {
        v.row = this.row;
        v.col = this.col;
        v.url = this.url;
        return v;
    }
    get site() {
        return new lang_1.Site(this);
    }
    notdone() {
        this.dc = type_1.DONE === this.dc ? type_1.DONE : this.dc + 1;
    }
    unify(peer, _ctx) {
        return peer;
    }
    get canon() { return 'top'; }
    clone(_ctx, _spec) {
        return this;
    }
    gen(_ctx) {
        return undefined;
    }
    superior() {
        return this;
    }
    [(_TopVal_ctx = new WeakMap(), node_util_1.inspect.custom)](d, o, inspect) {
        let s = ['<' + this.constructor.name.replace(/Val$/, '') + '/' + this.id];
        s.push('/' + this.path.join('.') + '/');
        s.push([
            this.dc,
            ...Object.entries(this.mark).filter(n => n[1]).map(n => n[0]).sort()
        ].filter(n => null != n).join(','));
        s.push('>');
        return s.join('');
    }
}
exports.TopVal = TopVal;
TopVal.SPREAD = Symbol('spread');
const TOP = new TopVal();
exports.TOP = TOP;
//# sourceMappingURL=TopVal.js.map