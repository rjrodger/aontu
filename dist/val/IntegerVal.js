"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = void 0;
const err_1 = require("../err");
const ScalarVal_1 = require("./ScalarVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
const utility_1 = require("../utility");
class IntegerVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        if (!Number.isInteger(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-integer: ' + spec.peg);
        }
        // super({ peg: spec.peg, kind: Integer }, ctx)
        super({ ...spec, kind: ScalarKindVal_1.Integer }, ctx);
        this.isInteger = true;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Integer', this, peer);
        let out = this;
        if (null != peer) {
            if (peer.isScalarKind) {
                out = peer.unify(this, ctx.clone({ explain: (0, utility_1.ec)(te, 'KND') }));
            }
            else if (peer.isScalar &&
                peer.peg === this.peg) {
                out = this;
            }
            else if (peer.isTop) {
                out = this;
            }
            else {
                out = (0, err_1.makeNilErr)(ctx, 'scalar_' +
                    (peer.kind === this.kind ? 'value' : 'kind'), this, peer);
            }
        }
        else {
            out = super.unify(peer, ctx);
        }
        (0, utility_1.explainClose)(te, out);
        return out;
    }
}
exports.IntegerVal = IntegerVal;
//# sourceMappingURL=IntegerVal.js.map