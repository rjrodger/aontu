"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeFuncVal = void 0;
const val_1 = require("../val");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class TypeFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isTypeFuncVal = true;
        this.type = true;
        // console.log('TFV', this.id, this.peg?.[0]?.canon)
    }
    make(_ctx, spec) {
        return new TypeFuncVal(spec);
    }
    funcname() {
        return 'type';
    }
    unify(peer, ctx) {
        let out = this.resolved;
        if (null == out) {
            out = this.resolve(ctx, this.peg);
        }
        return out;
    }
    resolve(ctx, args) {
        let out = args[0] ?? val_1.Nil.make(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            // out.type = true
            (0, utility_1.walk)(out, (_key, val) => {
                val.type = true;
                return val;
            });
        }
        console.log('TYPE-RESOLVE', args[0]?.canon, '->', out.canon);
        return out;
    }
}
exports.TypeFuncVal = TypeFuncVal;
//# sourceMappingURL=TypeFuncVal.js.map