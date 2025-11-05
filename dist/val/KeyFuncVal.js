"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyFuncVal = void 0;
const StringVal_1 = require("../val/StringVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
class KeyFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isKeyFunc = true;
        // this.dc = DONE
    }
    make(_ctx, spec) {
        return new KeyFuncVal(spec);
    }
    funcname() {
        return 'key';
    }
    resolve(_ctx, _args) {
        let out = this;
        if (!this.mark.type && !this.mark.hide) {
            let move = this.peg?.[0]?.peg;
            move = isNaN(move) ? 1 : +move;
            const key = this.path[this.path.length - (1 + move)] ?? '';
            out = new StringVal_1.StringVal({ peg: key });
        }
        return out;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.KeyFuncVal = KeyFuncVal;
//# sourceMappingURL=KeyFuncVal.js.map