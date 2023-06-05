"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValBase = void 0;
const lang_1 = require("../lang");
class ValBase {
    // deps?: any
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
        this.peg = spec === null || spec === void 0 ? void 0 : spec.peg;
        this.path = (ctx === null || ctx === void 0 ? void 0 : ctx.path) || [];
        this.id = (9e9 + Math.floor(Math.random() * (1e9)));
    }
    same(peer) {
        return null == peer ? false : this.id === peer.id;
    }
    clone(spec, ctx) {
        let cloneCtx = ctx ? ctx.clone({
            path: ctx.path.concat(this.path.slice(ctx.path.length))
        }) : undefined;
        let out = new this
            .constructor(spec || { peg: this.peg }, cloneCtx);
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
//# sourceMappingURL=ValBase.js.map