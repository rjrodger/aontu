"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberVal = void 0;
const err_1 = require("../err");
const ScalarVal_1 = require("./ScalarVal");
const utility_1 = require("../utility");
class NumberVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        if (isNaN(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-number: ' + spec.peg);
        }
        super({ ...spec, kind: Number }, ctx);
        this.isNumber = true;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Number', this, peer);
        let out = this;
        if (null != peer) {
            if (peer.isScalarKind) {
                out = peer.unify(this, ctx);
            }
            else if (peer.isScalar &&
                peer.peg === this.peg) {
                out = peer.isInteger ? peer : this;
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
exports.NumberVal = NumberVal;
//# sourceMappingURL=NumberVal.js.map