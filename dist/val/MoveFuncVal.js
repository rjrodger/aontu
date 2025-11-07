"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveFuncVal = void 0;
const err_1 = require("../err");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
const CopyFuncVal_1 = require("./CopyFuncVal");
class MoveFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMoveFunc = true;
    }
    make(_ctx, spec) {
        return new MoveFuncVal(spec);
    }
    funcname() {
        return 'move';
    }
    resolve(ctx, args) {
        let out = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        const orig = out;
        const origcanon = orig.canon;
        if (!orig.isNil) {
            const src = orig.clone(ctx);
            (0, utility_1.walk)(orig, (_key, val) => {
                val.mark.hide = true;
                return val;
            });
            out = new CopyFuncVal_1.CopyFuncVal({ peg: [src] }, ctx);
        }
        Object.defineProperty(out, 'canon', {
            get: () => 'move(' + origcanon + ')',
            configurable: true
        });
        // console.log('MOVE-resolve', out)
        return out;
    }
}
exports.MoveFuncVal = MoveFuncVal;
//# sourceMappingURL=MoveFuncVal.js.map