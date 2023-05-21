"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValBase = void 0;
const lang_1 = require("../lang");
class ValBase {
    // deps?: any
    constructor(peg, ctx) {
        this.isVal = true;
        this.done = 0;
        this.row = -1;
        this.col = -1;
        this.url = '';
        this.peg = peg;
        this.path = (ctx === null || ctx === void 0 ? void 0 : ctx.path) || [];
        this.id = (ctx && ctx.vc++) || (9e9 + Math.floor(Math.random() * (1e9)));
    }
    same(peer) {
        // return this === peer
        return null == peer ? false : this.id === peer.id;
    }
    clone(ctx) {
        let cloneCtx = ctx ? ctx.clone({
            path: ctx.path.concat(this.path.slice(ctx.path.length))
            // path: ctx.path.concat(this.path)
        }) : undefined;
        let out = new this.constructor(this.peg, cloneCtx);
        if (null == cloneCtx) {
            out.path = this.path.slice(0);
        }
        return out;
    }
    get site() {
        return new lang_1.Site(this);
    }
}
exports.ValBase = ValBase;
//# sourceMappingURL=ValBase.js.map