"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberVal = void 0;
const err_1 = require("../err");
const ScalarVal_1 = require("./ScalarVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
const utility_1 = require("../utility");
// The IEEE-754 binary64 leaf of the number tower. Its KIND is Float (the
// keyword `float`), not the `number` supertype: `number` names the family
// of numeric leaves and never tags a concrete value. The class name is
// historical -- `number` used to name this leaf.
class NumberVal extends ScalarVal_1.ScalarVal {
    constructor(spec, ctx) {
        // Number.isFinite (not the coercing global isNaN, which lets null/''
        // through as "numbers") — only an actual finite number is valid.
        if (!Number.isFinite(spec.peg)) {
            // TODO: use Nil?
            throw new err_1.AontuError('not-number: ' + spec.peg);
        }
        super({ ...spec, kind: ScalarKindVal_1.Float }, ctx);
        this.isNumber = true;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Number', this, peer);
        let out = this;
        if (null != peer) {
            if (peer.isScalarKind) {
                out = peer.unify(this, ctx);
            }
            else if (peer.isScalar &&
                peer.kind === this.kind &&
                peer.peg === this.peg) {
                // Same kind (both Float) and equal value: integer/float no
                // longer cross-unify, so peer is necessarily a NumberVal here.
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
    // Canon must round-trip kind: reparsing the canon of a float-kind
    // value has to yield a float-kind value again. A rendering with no
    // '.' and no exponent (1 -> "1") would reparse as an integer, so it
    // gains a ".0" suffix. Renderings that already carry a fraction, an
    // exponent, or are NaN/Infinity are left alone.
    //
    // This is the CANON path only. String coercion inside `+` keeps plain
    // JS parity ("a"+1.0 is "a1"), so it must not pick up the suffix.
    get canon() {
        const s = super.canon;
        return (s.includes('.') ||
            s.includes('e') ||
            s.includes('E') ||
            s.includes('N') ||
            s.includes('I')) ? s : s + '.0';
    }
}
exports.NumberVal = NumberVal;
//# sourceMappingURL=NumberVal.js.map