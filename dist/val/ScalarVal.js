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
        if (peer.isScalarKind) {
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
        return peer?.isScalar ? peer.peg === this.peg : super.same(peer);
    }
    gen(_ctx) {
        return this.peg;
    }
    superior() {
        return this.place(new ScalarKindVal_1.ScalarKindVal({
            peg: this.kind
        }));
    }
}
exports.ScalarVal = ScalarVal;
//# sourceMappingURL=ScalarVal.js.map