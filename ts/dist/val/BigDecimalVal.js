"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigDecimalVal = void 0;
const err_1 = require("../err");
const ScalarVal_1 = require("./ScalarVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
const Decimal_1 = require("./Decimal");
const utility_1 = require("../utility");
// The exact base-10 decimal leaf of the number tower, reached only by a
// `0d` literal carrying a `.` or an exponent (`0d1.5`, `0d1e3`) or by
// direct construction.
//
// Its peg is a Decimal -- an OBJECT, so unlike every other scalar leaf
// its identity cannot be `===` on the peg. Two bigdecimals are the same
// value when their NUMBERS are equal (D2), which normalisation at
// construction reduces to a two-field comparison; `samePeg` and `unify`
// below are the two places that must not forget it.
class BigDecimalVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        // Exact-input construction (D8): a Decimal, or a decimal literal as
        // text (`'1.5'`, `'0d1e3'`). A JS `number` is deliberately NOT
        // accepted -- binary64 has already rounded it, so `0.1` could never
        // arrive exact.
        let peg = spec.peg;
        if ('string' === typeof peg) {
            try {
                peg = Decimal_1.Decimal.fromString(peg);
            }
            catch {
                // Includes a budget refusal (Decimal.fromString enforces D6),
                // so an over-budget string cannot enter through this route
                // either.
                throw new err_1.AontuError('not-bigdecimal: ' + spec.peg);
            }
        }
        if (!(peg instanceof Decimal_1.Decimal)) {
            throw new err_1.AontuError('not-bigdecimal: ' + peg);
        }
        super({ ...spec, peg, kind: ScalarKindVal_1.BigDecimal }, ctx);
        this.isBigDecimal = true;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'BigDecimal', this, peer);
        let out = this;
        if (null != peer) {
            if (peer.isScalarKind || peer.isConstraint) {
                out = peer.unify(this, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'KND') }) : ctx);
            }
            else if (peer.isScalar &&
                peer.kind === this.kind &&
                this.peg.equals(peer.peg)) {
                // Same kind and equal NUMBER. Never `peer.peg === this.peg`:
                // that is object identity, and `0d0.10 & 0d0.1` (two Decimals
                // holding one value) has to succeed.
                out = this;
            }
            else if (peer.isTop) {
                out = this;
            }
            else {
                out = (0, err_1.makeNilErr)(ctx, 'scalar_' +
                    (peer.kind === this.kind ? 'value' : 'kind'), this, peer);
            }
        }
        else {
            out = super.unify(peer, ctx);
        }
        (0, utility_1.explainClose)(te, out);
        return out;
    }
    samePeg(peg) {
        return peg instanceof Decimal_1.Decimal && this.peg.equals(peg);
    }
    get canon() {
        return this.peg.canon();
    }
}
exports.BigDecimalVal = BigDecimalVal;
//# sourceMappingURL=BigDecimalVal.js.map