"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberVal = void 0;
const ScalarVal_1 = require("./ScalarVal");
class NumberVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        if (isNaN(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-number: ' + spec.peg);
        }
        super({ peg: spec.peg, kind: Number }, ctx);
        this.isNumber = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarKind && peer.type === Number) {
                return this;
            }
            else if (peer.isScalar &&
                peer.peg === this.peg) {
                return peer.isInteger ? peer : this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.NumberVal = NumberVal;
//# sourceMappingURL=NumberVal.js.map