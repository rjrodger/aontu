"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchFuncVal = void 0;
const err_1 = require("../err");
const top_1 = require("./top");
const FuncBaseVal_1 = require("./FuncBaseVal");
class MatchFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMatchFunc = true;
        // THE STAGING RULE (G8 phase 0). A scrutinee that is still being
        // narrowed can match an EARLIER pattern than the one it will end up
        // matching, and the arm a match takes is not a thing to guess at.
        this.staged = true;
    }
    funcname() {
        return 'match';
    }
    prepare(_ctx, _args) {
        return null;
    }
    // The scrutinee is argument 0 and the patterns are the odd
    // arguments; the results are the even ones after 0, and the last
    // argument is a DEFAULT when the count is even. Written once, read
    // by both the driver below and resolve.
    hasDefault() {
        return 0 === this.peg.length % 2;
    }
    unify(peer, ctx) {
        // The scrutinee and the PATTERNS are driven; the results are not
        // (see the header). driveStagedArgs takes a prefix, so the odd
        // positions are driven one at a time.
        let ready = this.driveStagedArgs(ctx, 1);
        const last = this.peg.length - (this.hasDefault() ? 1 : 0);
        for (let i = 1; i < last; i += 2) {
            const arg = this.peg[i];
            if (!arg.done) {
                this.peg[i] = arg.unify((0, top_1.top)(), ctx);
            }
            ready = ready && true === this.peg[i].done;
        }
        if (!ready || !ctx.settle) {
            return this.residuate(peer, ctx);
        }
        return super.unify(peer, ctx);
    }
    resolve(ctx, args) {
        const scrutinee = args[0];
        const dflt = this.hasDefault() ?
            args[args.length - 1] : undefined;
        const last = args.length - (undefined === dflt ? 0 : 1);
        const tried = [];
        for (let i = 1; i < last; i += 2) {
            const pattern = args[i];
            tried.push(pattern.canon);
            // The trial is against CLONES: `unite` refines a bag in place
            // against a TOP peer, and a pattern that failed must be
            // untouched for the next document that reads its canon.
            if (undefined !== (0, FuncBaseVal_1.trialUnify)(ctx, scrutinee.clone(ctx), pattern.clone(ctx))) {
                return args[i + 1].clone(ctx);
            }
        }
        if (undefined !== dflt) {
            return dflt.clone(ctx);
        }
        return (0, err_1.makeNilErr)(ctx, 'match_none', this, undefined, 'resolve', {
            value: scrutinee.canon,
            tried: tried.join(' '),
        });
    }
} /* node:coverage ignore next 5 */
exports.MatchFuncVal = MatchFuncVal;
//# sourceMappingURL=MatchFuncVal.js.map