"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarVal = void 0;
const type_1 = require("../type");
const utility_1 = require("../utility");
const err_1 = require("../err");
const Val_1 = require("./Val");
const ScalarKindVal_1 = require("./ScalarKindVal");
class ScalarVal extends Val_1.Val {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalar = true;
        this.isGenable = true;
        this.kind = spec.kind;
        this.src = spec.src ?? '';
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
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Scalar', this, peer);
        let out;
        // Exactly equal scalars are handled in unify.unite
        if (peer.isScalarKind || peer.isConstraint) {
            out = peer.unify(this, ctx);
        }
        else if (peer.isTop) {
            out = this;
        }
        else {
            out = (0, err_1.makeNilErr)(ctx, 'scalar_' +
                (peer.kind === this.kind ? 'value' : 'kind'), this, peer);
        }
        // console.log('SCALAR', this.canon, peer.canon, '->', out.canon)
        (0, utility_1.explainClose)(te, out);
        return out;
    }
    get canon() {
        return null === this.peg ? 'null' :
            undefined === this.peg ? 'undefined' :
                this.peg.toString();
    }
    same(peer) {
        // Two concrete scalars are the same only when KIND and value both
        // match. Comparing peg alone is a leftover from before integer and
        // number were distinct kinds; without the kind test `1|1.0` would
        // collapse to a single alternative and `(1|1.0) & 1.0` could pick
        // the integer.
        return peer?.isScalar ?
            (peer.kind === this.kind && this.samePeg(peer.peg)) :
            super.same(peer);
    }
    // Value comparison for this leaf's peg (D2: identity is kind AND
    // value, NEVER the identity of the object holding the value). `===` is
    // right for every peg that is a primitive -- including a bigint, where
    // two separately built copies of the same number compare equal -- and
    // wrong for a peg that is an object, so BigDecimalVal overrides it.
    samePeg(peg) {
        return peg === this.peg;
    }
    gen(_ctx) {
        // Normalize negative zero to 0 for deterministic output (JSON has
        // no -0, and the Go port produces 0).
        return Object.is(this.peg, -0) ? 0 : this.peg;
    }
    superior() {
        return this.place(new ScalarKindVal_1.ScalarKindVal({
            peg: this.kind
        }));
    }
}
exports.ScalarVal = ScalarVal;
//# sourceMappingURL=ScalarVal.js.map