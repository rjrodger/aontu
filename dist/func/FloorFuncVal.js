"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloorFuncVal = void 0;
const FuncValBase_1 = require("./FuncValBase");
class FloorFuncVal extends FuncValBase_1.FuncValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFloorFuncVal = true;
    }
    unify(peer, ctx) {
        if (this.id === peer.id) {
            return this;
        }
        if (this.peg.done) {
        }
        return this;
    }
    get canon() {
        return '';
    }
}
exports.FloorFuncVal = FloorFuncVal;
//# sourceMappingURL=FloorFuncVal.js.map