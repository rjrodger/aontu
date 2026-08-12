"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeqConstraintVal = exports.BelowConstraintVal = exports.AboveConstraintVal = exports.MaxConstraintVal = exports.MinConstraintVal = exports.ConstraintVal = void 0;
const type_1 = require("../type");
const utility_1 = require("../utility");
const err_1 = require("../err");
const FeatureVal_1 = require("./FeatureVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
const numcmp_1 = require("./numcmp");
// True for a scalar Val the algebra can order: a numeric leaf or a
// string. (Booleans and null have no order and no bounds.)
function numericLeaf(v) {
    return true === v?.isScalar &&
        (v.isInteger || v.isNumber || v.isBigInteger || v.isBigDecimal) &&
        !(v.isNumber && Number.isNaN(v.peg));
}
function stringLeaf(v) {
    return true === v?.isScalar && 'string' === typeof v.peg && v.isString;
}
// Scalar identity: leaf AND value, the lattice's own rule (1 and 1.0
// are different scalars). Exact numeric comparison decides the value
// half for numeric leaves.
function sameScalar(a, b) {
    if (numericLeaf(a) && numericLeaf(b)) {
        return (0, numcmp_1.towerRank)(a) === (0, numcmp_1.towerRank)(b) && 0 === (0, numcmp_1.cmpNumeric)(a, b);
    }
    if (stringLeaf(a) && stringLeaf(b)) {
        return a.peg === b.peg;
    }
    return false;
}
// Domain-aware value comparison for bounds and neq ordering.
function cmpVal(domain, a, b) {
    return 'number' === domain ? (0, numcmp_1.cmpNumeric)(a, b) : (0, numcmp_1.cmpCodePoints)(a.peg, b.peg);
}
// The numeric leaf marker a concrete scalar carries, for the kind
// narrowing check.
function leafMarker(v) {
    return v.isBigDecimal ? ScalarKindVal_1.BigDecimal : v.isBigInteger ? ScalarKindVal_1.BigInteger :
        v.isInteger ? ScalarKindVal_1.Integer : ScalarKindVal_1.Float;
}
class ConstraintVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super({ ...spec, peg: spec.peg ?? [] }, ctx);
        this.isConstraint = true;
        this.cjo = 50000;
        this.neqs = [];
        if (spec.state) {
            this.domain = spec.state.domain;
            this.kind = spec.state.kind;
            this.lo = spec.state.lo;
            this.hi = spec.state.hi;
            this.neqs = spec.state.neqs;
            this.invalid = spec.state.invalid;
        }
        else if (spec.atom) {
            this.fromAtom(spec.atom, spec.peg ?? []);
        }
        // A residual constraint is stable, like a ScalarKindVal.
        this.dc = type_1.DONE;
    }
    // Normalise one atom call (min/max/above/below/neq) into state.
    // Arguments must be concrete orderable scalars in phase 1;
    // reference-valued arguments are phase 4 (residuation).
    fromAtom(atom, args) {
        // Mark the residual invalid and report so (a plain boolean, so no
        // void value is consumed by the callers' `return` statements).
        const bad = (why) => {
            this.invalid = why;
            return true;
        };
        if ('neq' === atom) {
            // Multiple arguments arrive from the func-paren grammar as one
            // entry holding the comma group: a raw array of Vals (or an
            // implicit ListVal via some spellings). `neq(3,1,2)` therefore
            // has peg [[3,1,2]], and `neq([3,1,2])` means the same thing.
            if (1 === args.length && Array.isArray(args[0])) {
                args = args[0];
            }
            else if (1 === args.length && true === args[0]?.isList) {
                args = args[0].peg;
            }
            if (0 === args.length) {
                return bad('arg');
            }
            let domain = undefined;
            for (const a of args) {
                const d = numericLeaf(a) ? 'number' : stringLeaf(a) ? 'string' : undefined;
                if (null == d || (null != domain && d !== domain)) {
                    return bad('invalid-arg');
                }
                domain = d;
            }
            this.domain = domain;
            this.neqs = dedupSorted(domain, args);
            return;
        }
        if (1 !== args.length) {
            return bad('arg');
        }
        const a = args[0];
        const domain = numericLeaf(a) ? 'number' : stringLeaf(a) ? 'string' : undefined;
        if (null == domain) {
            return bad('invalid-arg');
        }
        this.domain = domain;
        const open = 'above' === atom || 'below' === atom;
        const bound = { v: a, open };
        if ('min' === atom || 'above' === atom) {
            this.lo = bound;
        }
        else {
            this.hi = bound;
        }
    }
    unify(peer, ctx) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Constraint', this, peer);
        // Every branch of the ladder assigns, so no initialiser: a
        // residual is stable and the ladder is total.
        let out;
        if (null != this.invalid) {
            out = (0, err_1.makeNilErr)(ctx, this.invalid, this, undefined, 'constrain');
        }
        else if (null == peer || peer.isTop) {
            out = this;
        }
        else if (peer.isNil) {
            out = peer;
        }
        else if (peer.isConstraint) {
            out = this.meetConstraint(peer, ctx);
        }
        else if (peer.isScalarKind) {
            out = this.meetKind(peer, ctx);
        }
        else if (peer.isScalar) {
            out = this.admit(peer, ctx);
        }
        else {
            // Maps, lists, and every other non-scalar shape: no order, no
            // membership — a conflict of the constraint family.
            out = this.fail(ctx, peer);
        }
        ctx.explain && (0, utility_1.explainClose)(te, out);
        return out;
    }
    // Membership: the peer scalar passes every part of the residual, or
    // the whole meet is a located conflict.
    admit(peer, ctx) {
        const domainOf = numericLeaf(peer) ? 'number' :
            stringLeaf(peer) ? 'string' : undefined;
        if (domainOf !== this.domain) {
            return this.fail(ctx, peer);
        }
        if (null != this.kind && leafMarker(peer) !== this.kind) {
            return this.fail(ctx, peer);
        }
        const d = this.domain;
        if (null != this.lo) {
            const c = cmpVal(d, peer, this.lo.v);
            if (c < 0 || (0 === c && this.lo.open)) {
                return this.fail(ctx, peer);
            }
        }
        if (null != this.hi) {
            const c = cmpVal(d, peer, this.hi.v);
            if (c > 0 || (0 === c && this.hi.open)) {
                return this.fail(ctx, peer);
            }
        }
        for (const n of this.neqs) {
            if (sameScalar(peer, n)) {
                return this.fail(ctx, peer);
            }
        }
        return peer;
    }
    // Meet with a kind: `number` (or `string` on the string domain) is
    // already implied; a numeric LEAF narrows the residual; anything
    // else has an empty intersection with the constraint's domain.
    meetKind(peer, ctx) {
        const marker = peer.peg;
        if (Number === marker) {
            return 'number' === this.domain ? this : this.fail(ctx, peer);
        }
        if (String === marker) {
            return 'string' === this.domain ? this : this.fail(ctx, peer);
        }
        const isLeaf = ScalarKindVal_1.Integer === marker || ScalarKindVal_1.Float === marker ||
            ScalarKindVal_1.BigInteger === marker || ScalarKindVal_1.BigDecimal === marker;
        if (!isLeaf || 'number' !== this.domain) {
            return this.fail(ctx, peer);
        }
        if (null != this.kind && this.kind !== marker) {
            return this.fail(ctx, peer);
        }
        const merged = this.cloneState();
        merged.kind = marker;
        return this.finish(merged, ctx, peer);
    }
    // Meet with another residual: interval intersection, exclusion
    // union, kind union — then the eager emptiness rules.
    meetConstraint(peer, ctx) {
        if (null != peer.invalid) {
            return (0, err_1.makeNilErr)(ctx, peer.invalid, peer, undefined, 'constrain');
        }
        if (null != this.domain && null != peer.domain && this.domain !== peer.domain) {
            return this.fail(ctx, peer);
        }
        if (null != this.kind && null != peer.kind && this.kind !== peer.kind) {
            return this.fail(ctx, peer);
        }
        const d = (this.domain ?? peer.domain);
        const merged = this.cloneState();
        merged.domain = d;
        merged.kind = this.kind ?? peer.kind;
        merged.lo = tighter(d, this.lo, peer.lo, true);
        merged.hi = tighter(d, this.hi, peer.hi, false);
        merged.neqs = dedupSorted(d, [...this.neqs, ...peer.neqs]);
        return this.finish(merged, ctx, peer);
    }
    // Build the merged residual, applying the eager emptiness rules.
    finish(state, ctx, peer) {
        const d = state.domain;
        if (null != state.lo && null != state.hi) {
            const c = cmpVal(d, state.hi.v, state.lo.v);
            if (c < 0 || (0 === c && (state.lo.open || state.hi.open))) {
                return this.fail(ctx, peer);
            }
        }
        const integral = ScalarKindVal_1.Integer === state.kind || ScalarKindVal_1.BigInteger === state.kind;
        // Integral gap: an integer-narrowed interval containing no whole
        // number is empty (integer & above(1) & below(2)).
        if (integral && null != state.lo && null != state.hi) {
            const lo = (0, numcmp_1.scaledOfNumeric)(state.lo.v);
            const hi = (0, numcmp_1.scaledOfNumeric)(state.hi.v);
            if (!lo.inf && !hi.inf) {
                // Smallest admissible integer above/at the lower bound.
                let n = (0, numcmp_1.scaledFloor)(lo);
                if (!(0, numcmp_1.scaledIsIntegral)(lo) || state.lo.open) {
                    n += 1n;
                }
                // Largest admissible integer below/at the upper bound.
                let m = (0, numcmp_1.scaledFloor)(hi);
                if (state.hi.open && (0, numcmp_1.scaledIsIntegral)(hi)) {
                    m -= 1n;
                }
                if (m < n) {
                    return this.fail(ctx, peer);
                }
            }
        }
        // Point deletion under a narrowed leaf: a closed point interval
        // whose single value of the narrowed leaf is excluded is empty
        // (integer & min(3) & max(3) & neq(3)). Without a narrowing the
        // point survives in the other leaves.
        if (null != state.kind && null != state.lo && null != state.hi &&
            !state.lo.open && !state.hi.open &&
            0 === cmpVal(d, state.lo.v, state.hi.v)) {
            for (const n of state.neqs) {
                if (leafMarker(n) === state.kind && 0 === (0, numcmp_1.cmpNumeric)(n, state.lo.v)) {
                    return this.fail(ctx, peer);
                }
            }
        }
        const out = new ConstraintVal({ peg: [], state }, ctx);
        out.path = this.path;
        out.site.row = this.site.row;
        out.site.col = this.site.col;
        out.site.url = this.site.url;
        // Marks ratchet across a meet (the propagateMarks rule): a fresh
        // residual must carry both operands' type/hide marks, or a
        // `type(min(0)) & max(10)` merge would silently unmark the field
        // (the Go fold re-ratchets from its terms; this is the TS twin).
        (0, utility_1.propagateMarks)(this, out);
        (0, utility_1.propagateMarks)(peer, out);
        return out;
    }
    fail(ctx, peer) {
        return (0, err_1.makeNilErr)(ctx, 'constraint', this, peer, undefined, {
            expected: this.canon,
            actual: peer?.canon,
        });
    }
    cloneState() {
        return {
            domain: this.domain,
            kind: this.kind,
            lo: this.lo,
            hi: this.hi,
            neqs: [...this.neqs],
            invalid: this.invalid,
        };
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, {
            ...(spec || {}),
            peg: this.peg,
        });
        out.domain = this.domain;
        out.kind = this.kind;
        out.lo = this.lo;
        out.hi = this.hi;
        out.neqs = [...this.neqs];
        out.invalid = this.invalid;
        return out;
    }
    // The fixed canonical atom order: kind, lower, upper, neq (arguments
    // sorted). No spaces; reparses to a conjunct that normalises back to
    // this exact residual.
    get canon() {
        const parts = [];
        if (null != this.kind) {
            parts.push(this.kind.name.toLowerCase());
        }
        if (null != this.lo) {
            parts.push((this.lo.open ? 'above(' : 'min(') + this.lo.v.canon + ')');
        }
        if (null != this.hi) {
            parts.push((this.hi.open ? 'below(' : 'max(') + this.hi.v.canon + ')');
        }
        if (0 < this.neqs.length) {
            parts.push('neq(' + this.neqs.map((n) => n.canon).join(',') + ')');
        }
        if (0 === parts.length) {
            // Raw invalid atom: render the call so the error frame shows it.
            return 'constraint()';
        }
        return parts.join('&');
    }
    same(peer) {
        return true === peer?.isConstraint && this.canon === peer.canon;
    }
}
exports.ConstraintVal = ConstraintVal;
// The tighter of two like-direction bounds: the higher lower bound (or
// lower upper bound); on the same point the OPEN bound wins, and on a
// full tie the tower-lowest endpoint spelling survives.
function tighter(domain, a, b, lower) {
    if (null == a)
        return b;
    if (null == b)
        return a;
    const c = cmpVal(domain, a.v, b.v);
    if (0 !== c) {
        return (lower ? 0 < c : c < 0) ? a : b;
    }
    if (a.open !== b.open) {
        return a.open ? a : b;
    }
    if ('number' === domain && (0, numcmp_1.towerRank)(b.v) < (0, numcmp_1.towerRank)(a.v)) {
        return b;
    }
    return a;
}
// Sort excluded scalars for canon (numeric: by point then tower rank;
// string: code-point order) and drop identity duplicates.
function dedupSorted(domain, neqs) {
    const sorted = [...neqs].sort((a, b) => {
        const c = cmpVal(domain, a, b);
        if (0 !== c)
            return c;
        return 'number' === domain ? (0, numcmp_1.towerRank)(a) - (0, numcmp_1.towerRank)(b) : 0;
    });
    const out = [];
    for (const n of sorted) {
        if (0 === out.length || !sameScalar(out[out.length - 1], n)) {
            out.push(n);
        }
    }
    return out;
}
// The five atom classes registered in the parser's funcMap: each is a
// ConstraintVal that knows its atom name. Constructed by the
// func-paren handler as `new funcval({peg: args})`.
class MinConstraintVal extends ConstraintVal {
    constructor(spec, ctx) {
        super({ ...spec, atom: 'min' }, ctx);
    }
}
exports.MinConstraintVal = MinConstraintVal;
class MaxConstraintVal extends ConstraintVal {
    constructor(spec, ctx) {
        super({ ...spec, atom: 'max' }, ctx);
    }
}
exports.MaxConstraintVal = MaxConstraintVal;
class AboveConstraintVal extends ConstraintVal {
    constructor(spec, ctx) {
        super({ ...spec, atom: 'above' }, ctx);
    }
}
exports.AboveConstraintVal = AboveConstraintVal;
class BelowConstraintVal extends ConstraintVal {
    constructor(spec, ctx) {
        super({ ...spec, atom: 'below' }, ctx);
    }
}
exports.BelowConstraintVal = BelowConstraintVal;
class NeqConstraintVal extends ConstraintVal {
    constructor(spec, ctx) {
        super({ ...spec, atom: 'neq' }, ctx);
    }
} /* node:coverage ignore next 11 */
exports.NeqConstraintVal = NeqConstraintVal;
//# sourceMappingURL=ConstraintVal.js.map