"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpectVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const err_1 = require("../err");
const FeatureVal_1 = require("./FeatureVal");
class ExpectVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isExpect = true;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Expect', this, peer);
        let out = this;
        if (!peer.isTop) {
            this.peer = undefined === this.peer ? peer :
                (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PEER') }) : ctx, this.peer, peer, 'expect-peer');
            // Unwrap nested ExpectVals to prevent infinite recursion
            let peg = this.peg;
            while (peg?.isExpect) {
                peg = peg.peg;
            }
            // Guard against re-entrant recursion
            if (this._expectDepth > 0) {
                out.dc = this.dc + 1;
            }
            else {
                this._expectDepth = (this._expectDepth || 0) + 1;
                const peeru = (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'EXPECT') }) : ctx, this.peer, peg, 'expect-self');
                this._expectDepth--;
                if (peeru.isGenable) {
                    out = peeru;
                }
            }
        }
        out.dc = type_1.DONE;
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    gen(ctx) {
        // Unresolved expect cannot be generated, so always an error.
        let nil = (0, err_1.makeNilErr)(ctx, 'expect', this.peg, this.peer);
        return undefined;
    }
    inspection(d) {
        return 'key=' + this.key +
            ',peg=' + this.peg?.inspect(d) +
            ',peer=' + this.peer?.inspect(d) +
            ',parent=' + this.parent?.inspect(d);
    }
}
exports.ExpectVal = ExpectVal;
//# sourceMappingURL=ExpectVal.js.map