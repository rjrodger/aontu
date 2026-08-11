"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveFuncVal = void 0;
const err_1 = require("../err");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
const PrefFuncVal_1 = require("./PrefFuncVal");
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
    prepare(_ctx, _args) {
        return null;
    }
    resolve(ctx, args) {
        let out = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        const orig = out;
        if (!orig.isNil) {
            const src = orig.clone(ctx);
            // THE HIDE-WALK ONLY RUNS WHEN THE CLONE IS A SEPARATE OBJECT.
            //
            // move() is the only function that marks the ORIGINAL rather than
            // the clone -- that is how the value disappears from its old home
            // and reappears at the destination. It relies on clone() returning
            // something distinct to carry to the destination.
            //
            // TopVal.clone is the IDENTITY function, so for `move(top)` the
            // clone and the original are the same object and the walk hid the
            // very value being returned: the key vanished from generated output
            // with no error, while canon still showed `x:top` -- the port
            // disagreeing with itself.
            //
            // With the walk skipped, `move(top)` keeps `top` at the destination
            // and then errors there because top is not generable, which is
            // already what `x:top`, `x:copy(top)` and `x:pref(top)` do in both
            // ports, and what `move(number)` does for the same reason.
            if (src !== orig) {
                if (src.isRef) {
                    src.mark._hide_found = true;
                }
                (0, utility_1.walk)(orig, (_key, val) => {
                    val.mark.hide = true;
                    return val;
                });
            }
            out = new PrefFuncVal_1.PrefFuncVal({ peg: [src] }, ctx);
        }
        // console.log('MOVE-resolve', orig, out)
        return out;
    }
}
exports.MoveFuncVal = MoveFuncVal;
//# sourceMappingURL=MoveFuncVal.js.map