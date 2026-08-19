"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EachFuncVal = void 0;
exports.dataValues = dataValues;
const unify_1 = require("../unify");
const err_1 = require("../err");
const top_1 = require("./top");
const ListVal_1 = require("./ListVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
const keyorder_1 = require("../keyorder");
// The children a data bag holds, in the order the result must carry
// them, or the code naming what is wrong with the argument.
function dataValues(data) {
    const d = data;
    if (true === d?.isMap) {
        return Object.keys(d.peg).sort(keyorder_1.cmpCodePoint).map((k) => d.peg[k]);
    }
    if (true === d?.isList) {
        return [...d.peg];
    }
    return 'each_data';
}
class EachFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isEachFunc = true;
        // THE STAGING RULE, for the reason given in PackFuncVal.
        this.staged = true;
    }
    funcname() {
        return 'each';
    }
    // The template is not an argument to drive (see PackFuncVal.prepare).
    prepare(_ctx, _args) {
        return null;
    }
    unify(peer, ctx) {
        const data = this.peg?.[0];
        if (null != data && !data.done) {
            this.peg[0] = (0, unify_1.withDepth)(ctx, data, (0, top_1.top)(), () => data.unify((0, top_1.top)(), ctx));
        }
        if (!ctx.settle || true !== this.peg?.[0]?.done) {
            return this.residuate(peer, ctx);
        }
        return super.unify(peer, ctx);
    }
    resolve(ctx, args) {
        const vals = dataValues(args?.[0]);
        if ('string' === typeof vals) {
            return (0, err_1.makeNilErr)(ctx, vals, this);
        }
        const tmpl = args?.[1];
        const peg = [];
        for (let i = 0; i < vals.length; i++) {
            const elctx = ctx.descend(String(i));
            const el = vals[i].clone(elctx);
            // The template is CLONED per element, never shared: see
            // PackFuncVal.resolve.
            peg.push(undefined === tmpl ? el :
                (0, unify_1.unite)(elctx, el, tmpl.clone(elctx), 'each'));
        }
        return new ListVal_1.ListVal({ peg }, ctx);
    }
} /* node:coverage ignore next 7 */
exports.EachFuncVal = EachFuncVal;
//# sourceMappingURL=EachFuncVal.js.map