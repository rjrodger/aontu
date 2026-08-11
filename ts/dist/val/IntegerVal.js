"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = void 0;
const err_1 = require("../err");
const ScalarVal_1 = require("./ScalarVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
const numkind_1 = require("./numkind");
const utility_1 = require("../utility");
class IntegerVal extends ScalarVal_1.ScalarVal {
    // Canon renders the EXACT digits of the value, not JavaScript's
    // shortest round-tripping form.
    //
    // A JS number's toString emits the shortest decimal that parses back
    // to the same double — at most 17 significant digits — so 2^60 printed
    // as `1152921504606847000`, a DIFFERENT integer that merely rounds to
    // the same double, while the Go port printed the true
    // `1152921504606846976` from its int64. That was the one entry in the
    // parity ledger (issue #21).
    //
    // Neither rendering was "the wrong number" while lossy literals were
    // still accepted, which is why the ledger deferred to the Phase 6
    // refusal — but Phase 6 refuses INEXACT literals, and every value in
    // this window (2^60, 2^63-1024, …) is exactly representable and so is
    // accepted. The divergence was never about exactness; it was about
    // rendering. Once the value is exactly what the source asked for,
    // there IS a right answer, and it is the exact digits.
    //
    // BigInt is exact here by construction: an IntegerVal's peg is
    // integral and inside the int64 window (isIntegerKind, enforced in the
    // constructor), so the bigint conversion cannot lose anything.
    get canon() {
        return BigInt(this.peg).toString();
    }
    constructor(spec, ctx) {
        // An IntegerVal must hold a value of *integer kind*: integral AND
        // within the int64 range, so it can never hold something the Go
        // port's int64 storage could not (see isIntegerKind). Every
        // construction site pre-checks with the same helper, so reaching
        // here is a programming error, not user input — hence a throw.
        if (!(0, numkind_1.isIntegerKind)(spec.peg)) {
            throw new err_1.AontuError('not-integer-kind: ' + spec.peg);
        }
        // super({ peg: spec.peg, kind: Integer }, ctx)
        super({ ...spec, kind: ScalarKindVal_1.Integer }, ctx);
        this.isInteger = true;
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Integer', this, peer);
        let out = this;
        if (null != peer) {
            if (peer.isScalarKind) {
                out = peer.unify(this, te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'KND') }) : ctx);
            }
            else if (peer.isScalar &&
                peer.kind === this.kind &&
                peer.peg === this.peg) {
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
}
exports.IntegerVal = IntegerVal;
//# sourceMappingURL=IntegerVal.js.map