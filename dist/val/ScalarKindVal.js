"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarKindVal = exports.Null = exports.Integer = void 0;
const type_1 = require("../type");
const utility_1 = require("../utility");
const err_1 = require("../err");
// import { BaseVal } from './BaseVal'
const FeatureVal_1 = require("./FeatureVal");
// A ScalarKind for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
// A ScalarKind for null.
class Null {
}
exports.Null = Null;
// class ScalarKindVal extends BaseVal {
class ScalarKindVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarKind = true;
        if (null == this.peg) {
            throw new err_1.AontuError('ScalarKindVal spec.peg undefined');
        }
        this.dc = type_1.DONE;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'ScalarKind', this, peer);
        const peerIsScalarVal = peer.isScalar;
        const peerIsScalarKind = peer.isScalarKind;
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
                out = (0, err_1.makeNilErr)(ctx, 'no-scalar-unify', this, peer);
            }
        }
        else if (peerIsScalarKind) {
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
                out = (0, err_1.makeNilErr)(ctx, 'scalar-type', this, peer);
            }
        }
        else {
            out = (0, err_1.makeNilErr)(ctx, 'not-scalar-type', this, peer);
        }
        ctx.explain && (0, utility_1.explainClose)(te, out);
        // console.log('SCALARKINDVAL', this.canon.peer.canon, '->', out.canon)
        return out;
    }
    get canon() {
        let ctor = this.peg;
        return ctor.name.toLowerCase();
    }
    same(peer) {
        let out = peer?.isScalarKind ? this.peg === peer?.peg : super.same(peer);
        return out;
    }
}
exports.ScalarKindVal = ScalarKindVal;
//# sourceMappingURL=ScalarKindVal.js.map