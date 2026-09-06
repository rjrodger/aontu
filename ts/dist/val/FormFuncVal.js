"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormFuncVal = void 0;
const err_1 = require("../err");
const ListVal_1 = require("./ListVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
const Val_1 = require("./Val");
const PlaceVal_1 = require("./PlaceVal");
const members_1 = require("./members");
class FormFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFormFunc = true;
        // THE STAGING RULE, for the reason given in PackFuncVal: the data
        // is not settled merely by being `done` once.
        this.staged = true;
    }
    funcname() {
        return 'form';
    }
    // The template is not an argument to drive (see PackFuncVal.prepare).
    prepare(_ctx, _args) {
        return null;
    }
    unify(peer, ctx) {
        // ONE argument is driven: the data. The template is not (see
        // prepare above).
        if (!this.stagedReady(peer, ctx, 1)) {
            return this.residuate(peer, ctx);
        }
        return super.unify(peer, ctx);
    }
    resolve(ctx, args) {
        const vals = (0, members_1.memberVals)(args?.[0], ctx);
        if (undefined === vals) {
            return (0, err_1.makeNilErr)(ctx, 'form_data', this);
        }
        // Arity is checked at parse (funcArity), so the template is here.
        const tmpl = args[1];
        const peg = [];
        for (let i = 0; i < vals.length; i++) {
            const elctx = ctx.descend(String(i));
            // A FULL INSTANCE per element, to the leaves (`dup`, ADR-005),
            // at the element's own position -- see PackFuncVal.resolve --
            // with `_` bound to the source child and NOTHING met into it.
            const inst = tmpl.clone(elctx, { dup: true });
            (0, Val_1.repathInstance)(inst, inst.path);
            peg.push((0, PlaceVal_1.fillPlace)(inst, vals[i], elctx));
        }
        return new ListVal_1.ListVal({ peg }, ctx);
    }
} /* node:coverage ignore next 6 */
exports.FormFuncVal = FormFuncVal;
//# sourceMappingURL=FormFuncVal.js.map