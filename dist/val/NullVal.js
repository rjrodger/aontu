"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullVal = void 0;
const Nil_1 = require("./Nil");
const BaseVal_1 = require("./BaseVal");
class NullVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isNullVal = true;
        this.peg = null;
    }
    unify(peer, ctx) {
        let out;
        if (peer.isTop || peer.isNullVal) {
            out = this;
        }
        else {
            out = Nil_1.Nil.make(ctx, 'null', this, peer);
        }
        return out;
    }
    same(peer) {
        return null == peer ? false : peer instanceof NullVal && this.peg === peer.peg;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        return out;
    }
    get canon() {
        return '' + this.peg;
    }
    gen(_ctx) {
        return null;
    }
}
exports.NullVal = NullVal;
//# sourceMappingURL=NullVal.js.map