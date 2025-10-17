"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarKindVal = exports.Null = exports.Integer = void 0;
const type_1 = require("../type");
const TopVal_1 = require("./TopVal");
const NilVal_1 = require("./NilVal");
const BaseVal_1 = require("./BaseVal");
// A ScalarKind for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
// A ScalarKind for null.
class Null {
}
exports.Null = Null;
class ScalarKindVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarKindVal = true;
        if (null == this.peg) {
            throw new Error('ScalarKindVal spec.peg undefined');
        }
        this.dc = type_1.DONE;
    }
    unify(peer, ctx) {
        const peerIsScalarVal = peer.isScalar;
        const peerIsScalarKindVal = peer.isScalarKindVal;
        let out = this;
        if (peerIsScalarVal) {
            let peerKind = peer.kind;
            if (peerKind === this.peg) {
                out = peer;
            }
            else if (Number === this.peg && Integer === peerKind) {
                out = peer;
            }
            else {
                out = NilVal_1.NilVal.make(ctx, 'no-scalar-unify', this, peer);
            }
        }
        else if (peerIsScalarKindVal) {
            if (Number === this.peg && Integer === peer.peg) {
                out = peer;
            }
            else if (Number === peer.peg && Integer === this.peg) {
                out = this;
            }
            else if (this.peg === peer.peg) {
                out = this;
            }
            else {
                out = NilVal_1.NilVal.make(ctx, 'scalar-type', this, peer);
            }
        }
        else {
            out = NilVal_1.NilVal.make(ctx, 'not-scalar-type', this, peer);
        }
        // console.log('SCALARKINDVAL', this.canon.peer.canon, '->', out.canon)
        return out;
    }
    get canon() {
        let ctor = this.peg;
        return ctor.name.toLowerCase();
    }
    same(peer) {
        let out = peer?.isScalarKindVal ? this.peg === peer?.peg : super.same(peer);
        return out;
    }
    superior() {
        return TopVal_1.TOP;
    }
}
exports.ScalarKindVal = ScalarKindVal;
//# sourceMappingURL=ScalarKindVal.js.map