"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nil = void 0;
const type_1 = require("../type");
const ValBase_1 = require("../val/ValBase");
class Nil extends ValBase_1.ValBase {
    constructor(why, ctx) {
        super(null, ctx);
        this.nil = true;
        this.msg = '';
        this.why = why;
        // Nil is always DONE, by definition.
        this.done = type_1.DONE;
    }
    unify(_peer, _ctx) {
        return this;
    }
    get canon() {
        return 'nil';
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.Nil = Nil;
// TODO: include Val generating nil, thus capture type
// A Nil is an error - should not happen - unify failed
Nil.make = (ctx, why, av, bv) => {
    let nil = new Nil(why, ctx);
    // TODO: this should be done lazily, for multiple terms
    // Terms later in same file are considered the primary error location.
    if (null != av) {
        nil.row = av.row;
        nil.col = av.col;
        nil.url = av.url;
        nil.primary = av;
        if (null != bv) {
            nil.secondary = bv;
            let bv_loc_wins = (nil.url === bv.url) && ((nil.row < bv.row) ||
                (nil.row === bv.row && nil.col < bv.col));
            if (bv_loc_wins) {
                nil.row = bv.row;
                nil.col = bv.col;
                nil.url = bv.url;
                nil.primary = bv;
                nil.secondary = av;
            }
        }
    }
    if (ctx) {
        ctx.err.push(nil);
    }
    return nil;
};
//# sourceMappingURL=Nil.js.map