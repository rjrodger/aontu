"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyFuncVal = void 0;
const val_1 = require("../val");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class CopyFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isCopyFunc = true;
        this.mark.type = false;
        this.mark.hide = false;
    }
    make(_ctx, spec) {
        return new CopyFuncVal(spec);
    }
    funcname() {
        return 'copy';
    }
    resolve(ctx, args) {
        const val = args?.[0];
        const out = null == val || null == ctx ?
            val_1.NilVal.make(ctx, 'invalid-arg', this) :
            val.clone(ctx, { mark: { type: false, hide: false } });
        (0, utility_1.walk)(out, (_key, val) => {
            val.mark.type = false;
            val.mark.hide = false;
            return val;
        });
        return out;
    }
}
exports.CopyFuncVal = CopyFuncVal;
//# sourceMappingURL=CopyFuncVal.js.map