"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TopVal_ctx;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopVal = exports.TOP = void 0;
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
        this.type = false;
        // Actual native value.
        this.peg = undefined;
        // TODO: used for top level result - not great
        this.err = [];
        this.uh = [];
        _TopVal_ctx.set(this, undefined);
        // TOP is always DONE, by definition.
        this.dc = type_1.DONE;
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
}
exports.TopVal = TopVal;
_TopVal_ctx = new WeakMap();
TopVal.SPREAD = Symbol('spread');
const TOP = new TopVal();
exports.TOP = TOP;
//# sourceMappingURL=TopVal.js.map