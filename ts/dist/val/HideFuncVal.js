"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HideFuncVal = void 0;
const err_1 = require("../err");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class HideFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isHideFunc = true;
        // The function does not mark itself!
        this.mark.type = false;
        this.mark.hide = false;
    }
    make(_ctx, spec) {
        return new HideFuncVal(spec);
    }
    funcname() {
        return 'hide';
    }
    /*
    unify(peer: Val, ctx: AontuContext): Val {
      const te = ctx.explain && explainOpen(ctx, ctx.explain, 'HideFunc', this, peer)
      let out: Val | undefined = this.resolved
  
      if (null == out) {
        out = this.resolve(ctx, this.peg)
      }
  
      explainClose(te, out)
      return out
    }
    */
    resolve(ctx, args) {
        let out = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        if (!out.isNil) {
            out = out.clone(ctx);
            (0, utility_1.walk)(out, (_key, val) => {
                val.mark.hide = true;
                return val;
            });
        }
        return out;
    }
}
exports.HideFuncVal = HideFuncVal;
//# sourceMappingURL=HideFuncVal.js.map