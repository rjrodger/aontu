"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nil = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const ValBase_1 = require("../val/ValBase");
class Nil extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec && 'string' !== typeof spec ? spec : {}, ctx);
        this.nil = true;
        this.msg = '';
        if (spec && 'object' === typeof spec) {
            this.why = spec === null || spec === void 0 ? void 0 : spec.why;
            this.msg = 'string' === typeof (spec === null || spec === void 0 ? void 0 : spec.msg) ? spec.msg : this.msg;
            this.err = spec ? (Array.isArray(spec.err) ? [...spec.err] : [spec.err]) : [];
        }
        // Nil is always DONE, by definition.
        this.done = type_1.DONE;
    }
    unify(_peer, _ctx) {
        return this;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.why = this.why;
        // Should these clone?
        // out.primary = this.primary?.clone()
        // out.secondary = this.secondary?.clone()
        out.primary = this.primary;
        out.secondary = this.secondary;
        out.msg = this.msg;
        return out;
    }
    get canon() {
        return 'nil';
    }
    gen(ctx) {
        // Unresolved nil cannot be generated, so always an error.
        (0, err_1.descErr)(this);
        if (ctx) {
            ctx.err.push(this);
        }
        else {
            throw new Error(this.msg);
        }
        return undefined;
    }
}
exports.Nil = Nil;
// TODO: include Val generating nil, thus capture type
// A Nil is an error - should not happen - unify failed
// refactor ,make(spec,ctx)
Nil.make = (ctx, why, av, bv) => {
    let nil = new Nil({ why }, ctx);
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