"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const err_1 = require("../err");
const utility_1 = require("../utility");
const top_1 = require("./top");
const FeatureVal_1 = require("./FeatureVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
class PrefVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPref = true;
        this.isGenable = true;
        this.cjo = 30000;
        this.rank = 0;
        // this.pref = spec.pref || spec.peg
        // this.superpeg = makeSuper(spec.peg)
        if (spec.peg instanceof PrefVal) {
            this.rank = 1 + spec.peg.rank;
        }
        this.resuper();
        // console.log('PVC', this.peg.canon, this.superpeg.canon)
    }
    // Recompute the type yardstick and the override gate from the current
    // peg. Called again whenever the peg resolves (e.g. a ref).
    resuper() {
        const peg = this.peg;
        // A preference whose peg is ITSELF a kind (`*integer`) constrains
        // nothing: there is no type-of-a-type in this lattice, so any peer
        // wins. (Pinned by test/spec/var.tsv:var-pref-kind-narrow. Before
        // the tower this fell out of a ScalarKindVal's superior being top;
        // now that a leaf kind lifts to `number`, it has to be said.)
        if (true === peg.isScalarKind) {
            this.superpeg = (0, top_1.top)();
            this.familypeg = this.superpeg;
            return;
        }
        const sup = peg.superior();
        this.superpeg = sup;
        // No optional chain: superior() is contractually non-null (every
        // Val returns one, a NilVal returning itself), so guarding against
        // nullish here would claim a possibility the type does not have.
        if (true === sup.isScalarKind) {
            const family = (0, ScalarKindVal_1.kindFamily)(sup.peg);
            // The gate stands in for the preferred value in any conflict it
            // reports, so it must carry the same site and path as the type it
            // widens -- otherwise NilVal.make picks a different primary and
            // the error moves to the wrong path.
            this.familypeg = family === sup.peg ?
                sup : sup.place(new ScalarKindVal_1.ScalarKindVal({ peg: family, path: sup.path }));
        }
        else {
            this.familypeg = sup;
        }
    }
    // PrefVal unify always returns a PrefVal
    // PrefVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        peer = peer ?? (0, top_1.top)();
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Pref', this, peer);
        let out = this;
        let why = '';
        if (!this.peg.done) {
            const resolved = (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'RES') }) : ctx, this.peg, (0, top_1.top)(), 'pref/resolve');
            // console.log('PREF-RESOLVED', this.peg.canon, '->', resolved)
            this.peg = resolved;
            this.resuper();
        }
        if (peer instanceof PrefVal) {
            why += 'pref-';
            if (this.id === peer.id) {
                out = this;
                why += 'same';
            }
            // Avoid MAXCYCLE errors
            else if (this.peg.id === peer.peg.id) {
                out = this;
                why += 'same-peg';
            }
            else if (this.rank < peer.rank) {
                out = this;
                why += 'rank-win';
            }
            else if (peer.rank < this.rank) {
                out = peer;
                why += 'rank-lose';
            }
            else {
                // console.log('PREF-PEER',
                //   this.peg.id, this.peg, this.peg.done,
                //   peer.peg.id, peer.peg, peer.peg.done,
                // )
                let peg = (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'PREF-PEER') }) : ctx, this.peg, peer.peg, 'pref-peer/' + this.id);
                out = new PrefVal({ peg }, ctx);
                // console.log('PREF-RANK-SAME-OUT', peg, peg.done, out, out.done)
                why += 'rank-same';
            }
        }
        else if (!peer.isTop) {
            why += 'super-';
            out = (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'SUPER') }) : ctx, this.familypeg, peer, 'pref-super/' + this.id);
            // The peer added nothing beyond a type the preferred value already
            // satisfies (`*1 & integer`, `*1 & number`), so the preference
            // stands. Anything else is a concrete override and wins.
            if (out.same(this.superpeg) || out.same(this.familypeg)) {
                out = this.peg;
                why += 'same';
            }
            // }
        }
        else {
            why += 'none';
        }
        // Every pref result is DONE, including a stuck conjunct from the
        // superior-unify (mirrored by PrefVal.Unify in go/pref.go).
        out.dc = type_1.DONE;
        // console.log('PREFVAL-OUT', why, this.canon, peer.canon, '->', out.canon, out.done)
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    same(peer) {
        if (null == peer) {
            return false;
        }
        let pegsame = (this.peg === peer.peg) ||
            (this.peg.isVal && this.peg.same(peer.peg));
        return pegsame;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        // out.pref = this.pref.clone(null, ctx)
        return out;
    }
    get canon() {
        // return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
        return '*' + this.peg.canon;
    }
    gen(ctx) {
        let val = this.peg;
        if (val.isNil) {
            if (null == ctx) {
                throw new err_1.AontuError(val.msg);
            }
        }
        return val.gen(ctx);
    }
} /* node:coverage ignore next 6 */
exports.PrefVal = PrefVal;
//# sourceMappingURL=PrefVal.js.map