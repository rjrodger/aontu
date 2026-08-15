"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReConstraintVal = exports.NeqConstraintVal = exports.BelowConstraintVal = exports.AboveConstraintVal = exports.MaxConstraintVal = exports.MinConstraintVal = exports.ConstraintVal = void 0;
const type_1 = require("../type");
const utility_1 = require("../utility");
const err_1 = require("../err");
const FeatureVal_1 = require("./FeatureVal");
const ScalarKindVal_1 = require("./ScalarKindVal");
const numcmp_1 = require("./numcmp");
// THE PORTABLE PATTERN SUBSET (G1 phase 2).
//
// `re(p)` must mean the same thing in both engines, and the two host
// regex engines are not the same language: TypeScript compiles with
// JavaScript's backtracking RegExp, Go with RE2. Each accepts patterns
// the other rejects, and — worse — each accepts patterns the other
// accepts with DIFFERENT meaning. So the pattern is checked against one
// shared syntactic subset BEFORE either host engine sees it, and this
// scanner is mirrored statement for statement in go/constraint.go.
//
// The rule is a whitelist where the spellings diverge, because a
// blacklist of known-bad constructs silently admits the next one:
//
//  - `(?` opens only the non-capturing group `(?:`. That single rule
//    refuses lookahead, lookbehind, atomic groups, conditionals,
//    recursion, inline flags, and named groups — whose spelling differs
//    (`(?P<n>` in RE2, `(?<n>` in JS) even where both support them.
//  - Backreferences (`\1`..`\9`, `\k<name>`) are not in RE2 at all;
//    accepting them in TypeScript alone would be a silent divergence.
//  - `\u`, `\p`, `\P` and `\x{...}` are spelled differently or gated on
//    a flag: JS writes `￿` where RE2 writes `\x{FFFF}`, and JS
//    `\p{...}` needs the `u` flag it is not given here (without it, JS
//    reads `\p` as a literal `p` — accepted, and wrong).
//  - POSIX classes (`[[:alpha:]]`) are RE2-only.
//  - An empty character class (`[]`, `[^]`) is a valid never-matching
//    class in JS and a parse error in RE2.
//
// Everything else is handed to the host engine, whose own compile
// failure is the same refusal under the same code. The subset is
// deliberately smaller than the intersection of the two engines —
// sound, not complete, exactly as the algebra treats regex emptiness.
// Widening it later is compatible; narrowing it would not be.
function nonPortableRe(src) {
    let inClass = false;
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if ('\\' === c) {
            const n = src[i + 1];
            if (null == n) {
                return 'a trailing backslash';
            }
            if ('1' <= n && n <= '9') {
                return 'a backreference (\\' + n + '), which RE2 has no equivalent for';
            }
            if ('k' === n) {
                return 'a named backreference (\\k), which RE2 has no equivalent for';
            }
            if ('u' === n) {
                return 'a \\u escape, which RE2 spells \\x{...}';
            }
            if ('p' === n || 'P' === n) {
                return 'a Unicode class (\\' + n + '), which JavaScript reads as a literal here';
            }
            if ('x' === n && '{' === src[i + 2]) {
                return 'a \\x{...} escape, which JavaScript spells \\u';
            }
            i++;
            continue;
        }
        // A POSIX class opener, anywhere. Checked BEFORE the in-class
        // branch because the POSIX form lives inside an ordinary class
        // (`[[:alpha:]]`), and refused everywhere rather than only there:
        // one rule is easier to mirror exactly than two, and a literal
        // `[:` costs an author nothing to rewrite.
        if ('[' === c && ':' === src[i + 1]) {
            return 'a POSIX class ([:...:]), which JavaScript does not have';
        }
        if (inClass) {
            if (']' === c) {
                inClass = false;
            }
            continue;
        }
        if ('[' === c) {
            // An empty class: `[]` in JS is a class that never matches, in
            // RE2 it does not compile. `[^]` is the same disagreement one
            // character along — everything in JS, a parse error in RE2.
            const first = '^' === src[i + 1] ? src[i + 2] : src[i + 1];
            if (']' === first) {
                return 'an empty character class, which RE2 refuses';
            }
            inClass = true;
            continue;
        }
        if ('(' === c && '?' === src[i + 1] && ':' !== src[i + 2]) {
            return 'a (?...) group other than the non-capturing (?:';
        }
    }
    if (inClass) {
        return 'an unterminated character class';
    }
    return undefined;
}
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
        this.res = [];
        if (spec.state) {
            this.domain = spec.state.domain;
            this.kind = spec.state.kind;
            this.lo = spec.state.lo;
            this.hi = spec.state.hi;
            this.neqs = spec.state.neqs;
            // A state built by an embedder (or by a per-port test) may predate
            // the pattern field; an absent one means "no patterns", not undefined.
            this.res = spec.state.res ?? [];
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
        // `re` is the one atom whose argument is not an ORDER point: a
        // pattern is a membership test, so it takes the string domain
        // outright rather than inferring a domain from the argument's leaf.
        if ('re' === atom) {
            if (!stringLeaf(a)) {
                return bad('invalid-arg');
            }
            const src = a.peg;
            const why = nonPortableRe(src);
            if (null != why) {
                this.invalidWhy = why;
                return bad('constraint_pattern');
            }
            let re;
            try {
                re = new RegExp(src);
            }
            catch (e) {
                // The host engine refuses what the subset scanner passed — a
                // malformed quantifier, an unbalanced group. Same refusal under
                // the same code: the author gets one rule, not two. The message
                // is the host's, so it is NOT pinned by a shared row; the code
                // and the located frame are.
                this.invalidWhy = 'not a valid pattern';
                return bad('constraint_pattern');
            }
            this.domain = 'string';
            this.res = [{ v: a, src, re }];
            return;
        }
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
            out = (0, err_1.makeNilErr)(ctx, this.invalid, this, undefined, 'constrain', null == this.invalidWhy ? undefined : { reason: this.invalidWhy });
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
        // Every accumulated pattern must match: the meet of two `re` atoms
        // is conjunction, and matching is UNANCHORED in both engines
        // (JS RegExp.test, Go regexp.MatchString), so `re("el")` admits
        // "hello". Anchor with ^ and $ to mean the whole string.
        for (const r of this.res) {
            if (!r.re.test(peer.peg)) {
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
            return (0, err_1.makeNilErr)(ctx, peer.invalid, peer, undefined, 'constrain', null == peer.invalidWhy ? undefined : { reason: peer.invalidWhy });
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
        merged.res = dedupSortedRes([...this.res, ...peer.res]);
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
            res: [...this.res],
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
        out.res = [...this.res];
        out.invalid = this.invalid;
        out.invalidWhy = this.invalidWhy;
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
        for (const r of this.res) {
            parts.push('re(' + r.v.canon + ')');
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
// Sort accumulated patterns by source in code-point order and drop
// exact duplicates. Patterns are NEVER simplified or compared for
// containment: deciding `re("a")` subsumes `re("a|b")` is regex
// containment, which the algebra deliberately does not do (emptiness
// stays approximate — sound, incomplete). Two spellings of one language
// therefore both survive, and both are tested.
function dedupSortedRes(res) {
    const sorted = [...res].sort((a, b) => (0, numcmp_1.cmpCodePoints)(a.src, b.src));
    const out = [];
    for (const r of sorted) {
        if (0 === out.length || out[out.length - 1].src !== r.src) {
            out.push(r);
        }
    }
    return out;
}
// The six atom classes registered in the parser's funcMap: each is a
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
}
exports.NeqConstraintVal = NeqConstraintVal;
class ReConstraintVal extends ConstraintVal {
    constructor(spec, ctx) {
        super({ ...spec, atom: 're' }, ctx);
    }
} /* node:coverage ignore next 12 */
exports.ReConstraintVal = ReConstraintVal;
//# sourceMappingURL=ConstraintVal.js.map