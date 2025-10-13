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
        this.kind = spec.kind;
        this.dc = type_1.DONE;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, {
            peg: this.peg,
            kind: this.kind,
            ...(spec || {})
        });
        return out;
    }
    unify(peer, ctx) {
        // Exactly equal scalars are handled in unify.unite
        if (peer.isScalarKindVal) {
            return peer.unify(this, ctx);
        }
        else if (peer.top) {
            return this;
        }
        return Nil_1.Nil.make(ctx, 'scalar', this, peer);
    }
    get canon() {
        return null === this.peg ? 'null' :
            undefined === this.peg ? 'undefined' :
                this.peg.toString();
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