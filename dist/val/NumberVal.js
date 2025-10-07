"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberVal = void 0;
const ScalarVal_1 = require("./ScalarVal");
class NumberVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, kind: Number }, ctx);
        this.isNumberVal = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarTypeVal && peer.type === Number) {
                return this;
            }
            else if (peer.isScalarVal &&
                peer.peg === this.peg) {
                return peer.isIntegerVal ? peer : this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.NumberVal = NumberVal;
//# sourceMappingURL=NumberVal.js.map