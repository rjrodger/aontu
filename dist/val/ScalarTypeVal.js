"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarTypeVal = exports.Integer = void 0;
const type_1 = require("../type");
const Nil_1 = require("./Nil");
const ValBase_1 = require("./ValBase");
// A ScalarType for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarTypeVal = true;
        this.dc = type_1.DONE;
    }
    unify(peer, ctx) {
        if (peer?.isScalarVal) {
            if (peer.type === this.peg) {
                return peer;
            }
            else if (Number === this.peg && Integer === peer.type) {
                return peer;
            }
            return Nil_1.Nil.make(ctx, 'no-scalar-unify', this, peer);
        }
        else {
            if (peer?.isScalarTypeVal) {
                if (Number === this.peg && Integer === peer.peg) {
                    return peer;
                }
                else if (Number === peer.peg && Integer === this.peg) {
                    return this;
                }
            }
            return Nil_1.Nil.make(ctx, 'scalar-type', this, peer);
        }
    }
    get canon() {
        let ctor = this.peg;
        return ctor.name.toLowerCase();
    }
    same(peer) {
        let out = peer?.isScalarTypeVal ? this.peg === peer?.peg : super.same(peer);
        return out;
    }
}
exports.ScalarTypeVal = ScalarTypeVal;
//# sourceMappingURL=ScalarTypeVal.js.map