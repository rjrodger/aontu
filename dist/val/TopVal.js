"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopVal = void 0;
const node_util_1 = require("node:util");
const type_1 = require("../type");
const BaseVal_1 = require("./BaseVal");
// There can be only one.
class TopVal extends BaseVal_1.BaseVal {
    // path: string[] = []
    // row = -1
    // col = -1
    // url = ''
    // top = true
    // Map of boolean flags.
    // mark: ValMark = { type: false, hide: false }
    // Actual native value.
    // peg: any = undefined
    // TODO: used for top level result - not great
    // err: Omit<any[], "push"> = []
    // err: any[] = []
    // explain: any[] | null = null
    // uh: number[] = []
    // #ctx: any = undefined
    constructor(spec, ctx) {
        super(spec, ctx);
        // static SPREAD = Symbol('spread')
        // isVal = true
        this.isTop = true;
        // isNil = false
        // isMap = false
        // isList = false
        // isScalar = false
        // isScalarKind = false
        // isConjunct = false
        // isDisjunct = false
        // isJunction = false
        // isPref = false
        // isRef = false
        // isVar = false
        // isNumber = false
        // isInteger = false
        // isString = false
        // isBoolean = false
        // isBag = false
        // isOp = true
        // isPlusOp = true
        // isFunc = false
        // isCloseFunc = false
        // isCopyFunc = false
        // isHideFunc = false
        // isMoveFunc = false
        // isKeyFunc = false
        // isLowerFunc = false
        // isOpenFunc = false
        // isPathFunc = false
        // isPrefFunc = false
        // isSuperFunc = false
        // isTypeFunc = false
        // isUpperFunc = false
        this.id = 0;
        this.dc = type_1.DONE;
        // TOP is always DONE, by definition.
        this.dc = type_1.DONE;
        this.mark.type = false;
        this.mark.hide = false;
    }
    // get done() {
    //   return this.dc === DONE
    // }
    // ctx() {
    //   return this.#ctx
    // }
    same(peer) {
        // return this === peer
        return peer.isTop;
    }
    // place(v: Val) {
    //   v.row = this.row
    //   v.col = this.col
    //   v.url = this.url
    //   return v
    // }
    // get site(): Site {
    //   return new Site(this)
    // }
    // notdone() {
    //   this.dc = DONE === this.dc ? DONE : this.dc + 1
    // }
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
    [node_util_1.inspect.custom](_d, _o, _inspect) {
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
//# sourceMappingURL=TopVal.js.map