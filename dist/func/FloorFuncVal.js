"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloorFuncVal = void 0;
const val_1 = require("../val");
const FuncBaseVal_1 = require("./FuncBaseVal");
class FloorFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFloorFuncVal = true;
    }
    make(_ctx, spec) {
        return new FloorFuncVal(spec);
    }
    funcname() {
        return 'floor';
    }
    resolve(_ctx, args) {
        const oldpeg = args?.[0].peg;
        const peg = isNaN(oldpeg) ? undefined : Math.floor(oldpeg);
        const out = null == peg ? new val_1.Nil({ msg: 'Not a number: ' + oldpeg }) :
            new val_1.IntegerVal({ peg });
        return out;
    }
}
exports.FloorFuncVal = FloorFuncVal;
//# sourceMappingURL=FloorFuncVal.js.map