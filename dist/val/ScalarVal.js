"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarVal = void 0;
const type_1 = require("../type");
const Nil_1 = require("./Nil");
const BaseVal_1 = require("./BaseVal");
class ScalarVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarVal = true;
        this.type = spec.type;
        this.dc = type_1.DONE;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, {
            peg: this.peg,
            type: this.type,
            ...(spec || {})
        });
        return out;
    }
    unify(peer, ctx) {
        // Exactly equal scalars are handled in op/unite
        if (peer?.isScalarTypeVal) {
            return peer.unify(this, ctx);
        }
        else if (peer.top) {
            return this;
        }
        return Nil_1.Nil.make(ctx, 'scalar', this, peer);
    }
    get canon() {
        return this.peg.toString();
    }
    same(peer) {
        return peer?.isScalarVal ? peer.peg === this.peg : super.same(peer);
    }
    gen(_ctx) {
        return this.peg;
    }
}
exports.ScalarVal = ScalarVal;
//# sourceMappingURL=ScalarVal.js.map