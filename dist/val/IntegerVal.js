"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = void 0;
const ScalarVal_1 = require("./ScalarVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
class IntegerVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        if (!Number.isInteger(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-integer');
        }
        super({ peg: spec.peg, kind: ScalarKindVal_1.Integer }, ctx);
        this.isIntegerVal = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarTypeVal && (peer.peg === Number || peer.peg === ScalarKindVal_1.Integer)) {
                return this;
            }
            else if (peer.isScalarVal &&
                // peer.type === Number &&
                peer.peg === this.peg) {
                return this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.IntegerVal = IntegerVal;
//# sourceMappingURL=IntegerVal.js.map