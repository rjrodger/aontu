"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullVal = void 0;
const Nil_1 = require("../val/Nil");
const ValBase_1 = require("../val/ValBase");
class NullVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isNullVal = true;
        this.peg = null;
    }
    unify(peer, ctx) {
        let out;
        // console.log('NULLVAL-U', peer)
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
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
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