"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveFuncVal = void 0;
const err_1 = require("../err");
const PathVal_1 = require("../val/PathVal");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
const PrefFuncVal_1 = require("./PrefFuncVal");
// Navigate the tree using a PathVal's resolved path and hide the source.
function hideAtPath(root, pv) {
    // Compute the refpath the same way PathVal.find does
    const parts = [];
    for (const part of pv.peg) {
        if ('string' === typeof part)
            parts.push(part);
    }
    let refpath;
    if (pv.absolute) {
        refpath = parts;
    }
    else {
        refpath = pv.path.slice(0, -1).concat(parts);
    }
    // Walk to the source, handling conjuncts/disjuncts
    let node = root;
    for (let i = 0; i < refpath.length; i++) {
        const part = refpath[i];
        if (node?.isMap || node?.isList) {
            node = node.peg[part];
        }
        else if (node?.isConjunct || node?.isDisjunct) {
            // Search junction terms for the key
            let found = null;
            const stack = [...node.peg];
            while (stack.length > 0) {
                const term = stack.pop();
                if (term?.isConjunct || term?.isDisjunct) {
                    stack.push(...term.peg);
                }
                else if ((term?.isMap || term?.isList) && term.peg[part] != null) {
                    found = term.peg[part];
                    break;
                }
            }
            node = found;
        }
        else {
            return;
        }
        if (node == null)
            return;
    }
    // Mark the source value hidden
    node.mark.hide = true;
    (0, utility_1.walk)(node, (_key, val) => {
        val.mark.hide = true;
        return val;
    });
}
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
        let arg = args[0] ?? (0, err_1.makeNilErr)(ctx, 'arg', this);
        if (arg.isNil)
            return arg;
        let src;
        if (arg instanceof PathVal_1.PathVal) {
            // Get clone for the destination
            src = arg.find(ctx);
            if (src == null || src.isNil)
                return (0, err_1.makeNilErr)(ctx, 'arg', this);
            // Hide the source in the tree by navigating to it
            hideAtPath(ctx.root, arg);
        }
        else {
            src = arg.clone(ctx);
            // Hide the original
            arg.mark.hide = true;
            (0, utility_1.walk)(arg, (_key, val) => {
                val.mark.hide = true;
                return val;
            });
        }
        // Clear marks on the clone (like copy)
        src.mark.type = false;
        src.mark.hide = false;
        (0, utility_1.walk)(src, (_key, val) => {
            val.mark.type = false;
            val.mark.hide = false;
            return val;
        });
        return new PrefFuncVal_1.PrefFuncVal({ peg: [src] }, ctx);
    }
}
exports.MoveFuncVal = MoveFuncVal;
//# sourceMappingURL=MoveFuncVal.js.map