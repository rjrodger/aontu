"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HideFuncVal = void 0;
const NilVal_1 = require("../val/NilVal");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class HideFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isHideFunc = true;
        this.mark.type = false;
        this.mark.hide = true;
        // console.log('HFV', this.id, this.peg?.[0]?.canon)
    }
    make(_ctx, spec) {
        return new HideFuncVal(spec);
    }
    funcname() {
        return 'hide';
    }
    unify(peer, ctx, trace) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, trace, 'HideFunc', this, peer);
        let out = this.resolved;
        if (null == out) {
            out = this.resolve(ctx, this.peg);
        }
        (0, utility_1.explainClose)(te, out);
        return out;
    }
    resolve(ctx, args) {
        let out = args[0] ?? NilVal_1.NilVal.make(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            // out.mark.hide = true
            (0, utility_1.walk)(out, (_key, val) => {
                val.mark.hide = true;
                return val;
            });
        }
        // console.log('HIDE-RESOLVE', args[0]?.canon, '->', out.canon)
        // TODO: since hide is self-erasing, we need this hack - find a better way
        const origcanon = out.canon;
        Object.defineProperty(out, 'canon', {
            get: () => 'hide(' + origcanon + ')',
            configurable: true
        });
        return out;
    }
}
exports.HideFuncVal = HideFuncVal;
//# sourceMappingURL=HideFuncVal.js.map