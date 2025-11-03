"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeFuncVal = void 0;
const NilVal_1 = require("../val/NilVal");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class TypeFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isTypeFunc = true;
        // this.mark.type = true
        this.mark.type = false;
        this.mark.hide = false;
        // console.log('TFV', this.id, this.peg?.[0]?.canon)
    }
    make(_ctx, spec) {
        return new TypeFuncVal(spec);
    }
    funcname() {
        return 'type';
    }
    resolve(ctx, args) {
        let out = args[0] ?? NilVal_1.NilVal.make(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            // out.mark.type = true
            (0, utility_1.walk)(out, (_key, val) => {
                val.mark.type = true;
                return val;
            });
        }
        // console.log('TYPE-RESOLVE', args[0]?.canon, '->', out.canon)
        // TODO: since type is self-erasing, we need this hack - find a better way
        /*
        const origcanon = out.canon
        Object.defineProperty(out, 'canon', {
          get: () => 'type(' + origcanon + ')',
          configurable: true
        })
        */
        // console.log('TYPE-OUT', out.canon)
        return out;
    }
}
exports.TypeFuncVal = TypeFuncVal;
//# sourceMappingURL=TypeFuncVal.js.map