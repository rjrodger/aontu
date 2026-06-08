"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeFuncVal = void 0;
const err_1 = require("../err");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class TypeFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isTypeFunc = true;
        // The function does not mark itself!
        this.mark.type = false;
        this.mark.hide = false;
    }
    make(_ctx, spec) {
        return new TypeFuncVal(spec);
    }
    funcname() {
        return 'type';
    }
    resolve(ctx, args) {
        let out = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            (0, utility_1.walk)(out, (_key, val) => {
                val.mark.type = true;
                return val;
            });
        }
        return out;
    }
}
exports.TypeFuncVal = TypeFuncVal;
//# sourceMappingURL=TypeFuncVal.js.map