"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = exports.Lang = void 0;
// import { performance } from 'node:perf_hooks'
const jsonic_1 = require("@tabnas/jsonic");
const debug_1 = require("@tabnas/debug");
const multisource_1 = require("@tabnas/multisource");
// TODO: @tabnas/multisource should support virtual fs
const file_1 = require("@tabnas/multisource/resolver/file");
const pkg_1 = require("@tabnas/multisource/resolver/pkg");
const mem_1 = require("@tabnas/multisource/resolver/mem");
const expr_1 = require("@tabnas/expr");
const path_1 = require("@tabnas/path");
const type_1 = require("./type");
const site_1 = require("./site");
Object.defineProperty(exports, "Site", { enumerable: true, get: function () { return site_1.Site; } });
const top_1 = require("./val/top");
const ScalarKindVal_1 = require("./val/ScalarKindVal");
const BigDecimalVal_1 = require("./val/BigDecimalVal");
const BigIntegerVal_1 = require("./val/BigIntegerVal");
const Decimal_1 = require("./val/Decimal");
const BooleanVal_1 = require("./val/BooleanVal");
const ConjunctVal_1 = require("./val/ConjunctVal");
const DisjunctVal_1 = require("./val/DisjunctVal");
const IntegerVal_1 = require("./val/IntegerVal");
const ListVal_1 = require("./val/ListVal");
const MapVal_1 = require("./val/MapVal");
const NilVal_1 = require("./val/NilVal");
const NullVal_1 = require("./val/NullVal");
const NumberVal_1 = require("./val/NumberVal");
const numkind_1 = require("./val/numkind");
const PrefVal_1 = require("./val/PrefVal");
const RefVal_1 = require("./val/RefVal");
const StringVal_1 = require("./val/StringVal");
const VarVal_1 = require("./val/VarVal");
const PlusOpVal_1 = require("./val/PlusOpVal");
const UpperFuncVal_1 = require("./val/UpperFuncVal");
const LowerFuncVal_1 = require("./val/LowerFuncVal");
const CopyFuncVal_1 = require("./val/CopyFuncVal");
const KeyFuncVal_1 = require("./val/KeyFuncVal");
const TypeFuncVal_1 = require("./val/TypeFuncVal");
const HideFuncVal_1 = require("./val/HideFuncVal");
const MoveFuncVal_1 = require("./val/MoveFuncVal");
const PathFuncVal_1 = require("./val/PathFuncVal");
const PrefFuncVal_1 = require("./val/PrefFuncVal");
const CloseFuncVal_1 = require("./val/CloseFuncVal");
const OpenFuncVal_1 = require("./val/OpenFuncVal");
const SuperFuncVal_1 = require("./val/SuperFuncVal");
const asPlugin = (p) => p;
// Build the Val for a matched `0d` literal (see the `0d` value matcher
// below). Leaf by source: digits only is a biginteger, a `.` or an
// exponent makes it a bigdecimal.
//
// A literal over the D6 exactness budget becomes a LOCATED ERROR here
// and not a rounded or expanded value: `0d1e1000000000` has a one-digit
// coefficient, so only the scale bound catches it, and it is caught at
// parse -- before plain-form rendering would try to materialise a
// gigabyte of zeros.
// The source text of a negated exact literal. `-` is a prefix OPERATOR,
// not part of the literal, so the text has to be rebuilt here to keep
// `src` meaning "how this value is spelled" (see bigVal).
function negsrc(src) {
    return '' === src ? '' : src.startsWith('-') ? src.slice(1) : '-' + src;
}
function bigVal(res) {
    const lit = (0, Decimal_1.readBigLiteral)(res);
    // `src` is the literal's own text, and it is not decoration: a path
    // segment is spelled text, so `$.a.0d1` must address the key `0d1` --
    // the same key `a:{0d1:7}` creates -- rather than the number 1. See
    // RefVal.append. Without it the segment was empty and the reference
    // silently resolved to its own container.
    const src = res[0];
    return 'biginteger' === lit.leaf ? new BigIntegerVal_1.BigIntegerVal({ peg: lit.int, src }) :
        'bigdecimal' === lit.leaf ? new BigDecimalVal_1.BigDecimalVal({ peg: lit.dec, src }) :
            new NilVal_1.NilVal({ why: lit.code });
}
// Char codes of the literal's fixed opening, for the guard below.
const CC_0 = 48;
const CC_d = 100;
const CC_D = 68;
let AontuJsonic = function AontuLang(jsonic) {
    jsonic.use(asPlugin(path_1.Path));
    // Only # line comments are valid Aontu syntax (see
    // docs/reference-language.md; go/lang.go sets the same). Clear the
    // underlying jsonic comment markers entirely, then define # directly,
    // so the comment set is hash-only regardless of those defaults.
    jsonic.options({ comment: { def: null } });
    jsonic.options({
        comment: {
            lex: true,
            def: {
                hash: { line: true, start: '#', lex: true },
            },
        },
    });
    // Digit separators are legal only as a SINGLE separator BETWEEN
    // digits (the rule test/spec/engine-parity.tsv records as the engine's
    // adjudication; pinned by the sep-* rows in
    // test/spec/number-model.tsv). The engine's number matcher
    // enforces most of that already — `1_`, `_1`, `1_.5`, `1._5`, `1e_2`,
    // `1e2_` all fall through to text — but two gaps remain: a REPEATED
    // separator (`1__0` lexed as 10) and a separator at the edge of a
    // base-prefixed digit run (`0x_ff`, `0xff_` lexed as 255). Both
    // silently accept a typo as a different number, so aontu declines the
    // whole run instead and it lexes as text ("1__0"), exactly as `1_`
    // already does.
    //
    // `number.exclude` is tested against the matched number source and,
    // when it matches, makes the matcher decline the entire span. Kept in
    // lock-step with sepInvalid in go/lang.go, which is wired to the
    // equivalent `Number.Exclude` hook (and to the Check hook, which
    // constructs big base-prefixed tokens itself and so bypasses Exclude).
    jsonic.options({
        number: {
            // `__` repeated separator; `0x_`/`0o_`/`0b_` separator opening a
            // base-prefixed run; `_` closing any run. The prefix letter is
            // matched case-insensitively so the rule does not depend on which
            // prefix spellings the engine accepts.
            exclude: /__|^[-+]?0[xXoObB]_|_$/,
        },
    });
    // D3 -- the `0d` literal, the only route to the exact leaves
    // (biginteger and bigdecimal). See BIG_LITERAL_RE for the grammar and
    // the leaf-by-source rule.
    //
    // The literal is claimed by the TEXT MATCHER'S CHECK HOOK (the sibling
    // of the `Number.Check` hook the Go port already uses for big
    // base-prefixed literals), not by a `value.def` entry, because a `0d`
    // run may contain a `.` and the two claim source differently:
    //
    //   - A value def -- even a consuming one, matched against the full
    //     forward source -- is applied INSIDE the text matcher, AFTER its
    //     ender regexp has already carved the run at the `.`. The def
    //     claims `0d1.5` whole, but the matcher then still emits the
    //     ender's `.` as a fixed token, so `x:0d1.5` lexed as the
    //     bigdecimal FOLLOWED BY a dangling member-access dot (a path
    //     cycle). Verified, not theorised.
    //   - The check hook runs BEFORE that ender regexp and returns the
    //     token outright, so the run is claimed whole and nothing else is
    //     emitted.
    //
    // A `match.value` matcher (which runs ahead of every other matcher)
    // also claims it correctly, but it is a candidate at EVERY lex
    // position and materializes the forward source there: ~8% on a
    // text-heavy document, for a syntax almost none of them use. The check
    // hook only runs where the text matcher already runs, and measures at
    // parity with not having it.
    //
    // The number matcher never sees these runs at all: it declines `0d…`
    // outright, since `d` is not an ender.
    jsonic.options({
        text: {
            check: (lex) => {
                // Guard first, on char codes: this hook runs at every text
                // position, and the common case (any run that cannot be a `0d`
                // literal) must cost two char reads and no allocation.
                const pnt = lex.pnt;
                const src = lex.src;
                if (CC_0 !== src.charCodeAt(pnt.sI)) {
                    return undefined;
                }
                const c1 = src.charCodeAt(pnt.sI + 1);
                if (CC_d !== c1 && CC_D !== c1) {
                    return undefined;
                }
                // BIG_LITERAL_RE is `^`-anchored and read against the forward
                // source (memoized per position by refwd), which is what lets
                // it claim the `.` of `0d1.5`.
                const res = Decimal_1.BIG_LITERAL_RE.exec(lex.refwd());
                if (null == res) {
                    return undefined;
                }
                const msrc = res[0];
                // The token value is a FUNCTION so Val construction happens at
                // parse time, where the rule and context needed for the site
                // exist (jsonic calls a #VL token's function value with them).
                // A `0d` literal never spans a line, so only the source and
                // column positions advance.
                const tkn = lex.token('#VL', (r, ctx) => addsite(bigVal(res), r, ctx), msrc, pnt);
                pnt.sI += msrc.length;
                pnt.cI += msrc.length;
                return { done: true, token: tkn };
            },
        },
    });
    // TODO: refactor Val constructor
    // let addsite = (v: Val, p: string[]) => (v.path = [...(p || [])], v)
    let addsite = (v, r, ctx) => {
        v.site.row = null == r.o0 ? -1 : r.o0.rI;
        v.site.col = null == r.o0 ? -1 : r.o0.cI;
        v.site.url = ctx.meta.multisource ? ctx.meta.multisource.path : '';
        v.path = r.k ? [...(r.k.path || [])] : [];
        return v;
    };
    jsonic.options({
        hint: {
            unknown: `
Since the error is unknown, this is probably a bug. Please consider
posting a github issue - thanks!

Code: {code}, Details: 
{details}`,
            unexpected: `
The character(s) {src} were not expected at this point as they do not
match the expected syntax. Use the # character to comment out lines to
help isolate the syntax error.`,
        },
        errmsg: {
            name: 'aontu',
            suffix: false,
        },
        fixed: {
            token: {
                '#QM': '?'
            },
        },
        value: {
            def: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                // TODO: jsonic should be able to pass context into these
                'string': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: String }), r, ctx)
                },
                // `number` is a pure supertype: it matches a concrete value of
                // any numeric leaf and never tags one itself. `integer` and
                // `float` are the leaves (see ScalarKindVal for the lattice).
                'number': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: Number }), r, ctx)
                },
                'integer': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: ScalarKindVal_1.Integer }), r, ctx)
                },
                'float': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: ScalarKindVal_1.Float }), r, ctx)
                },
                // The two exact leaves. Their keywords are the marker class
                // names lowercased, which is also how ScalarKindVal canons them.
                'biginteger': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: ScalarKindVal_1.BigInteger }), r, ctx)
                },
                'bigdecimal': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: ScalarKindVal_1.BigDecimal }), r, ctx)
                },
                'boolean': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: Boolean }), r, ctx)
                },
                'nil': {
                    val: (r, ctx) => addsite(new NilVal_1.NilVal({ why: 'literal_nil' }), r, ctx)
                },
                // TODO: FIX: need a TOP instance to hold path
                'top': { val: () => (0, top_1.top)() },
            }
        },
        map: {
            merge: (prev, curr, _r, ctx) => {
                let pval = prev;
                let cval = curr;
                if (pval?.isVal && cval?.isVal) {
                    // TODO: test multi element conjuncts work
                    if (pval.isConjunct && cval.isConjunct) {
                        pval.append(cval);
                        return pval;
                    }
                    else if (pval.isConjunct) {
                        pval.append(cval);
                        return pval;
                    }
                    else {
                        return addsite(new ConjunctVal_1.ConjunctVal({ peg: [pval, cval] }), prev, ctx);
                    }
                }
                // Handle defered conjuncts, where MapVal does not yet
                // exist, by creating ConjunctVal later.
                else {
                    prev.___merge = (prev.___merge || []);
                    prev.___merge.push(curr);
                    return prev;
                }
            }
        }
    });
    const funcMap = {
        upper: UpperFuncVal_1.UpperFuncVal,
        lower: LowerFuncVal_1.LowerFuncVal,
        copy: CopyFuncVal_1.CopyFuncVal,
        key: KeyFuncVal_1.KeyFuncVal,
        type: TypeFuncVal_1.TypeFuncVal,
        hide: HideFuncVal_1.HideFuncVal,
        move: MoveFuncVal_1.MoveFuncVal,
        path: PathFuncVal_1.PathFuncVal,
        pref: PrefFuncVal_1.PrefFuncVal,
        close: CloseFuncVal_1.CloseFuncVal,
        open: OpenFuncVal_1.OpenFuncVal,
        super: SuperFuncVal_1.SuperFuncVal,
    };
    // A dangling operator (`a:1|`, `a:$`, `a:*` at end of input) leaves
    // null/undefined unfilled terms. Junction ops drop them (so `a:1&`
    // and `a:1|` are just 1); ops missing a required operand become an
    // incomplete_expression nil, surfaced by generate() as a "Cannot
    // resolve value" error (the Go port mirrors this in lang.go).
    const dropUnfilled = (terms) => terms.filter((t) => null != t);
    const incompleteNil = (r, ctx) => addsite(new NilVal_1.NilVal({ why: 'incomplete_expression' }), r, ctx);
    let opmap = {
        'conjunct-infix': (r, ctx, _op, terms) => addsite(new ConjunctVal_1.ConjunctVal({ peg: dropUnfilled(terms) }), r, ctx),
        'disjunct-infix': (r, ctx, _op, terms) => addsite(new DisjunctVal_1.DisjunctVal({ peg: dropUnfilled(terms) }), r, ctx),
        'dot-prefix': (r, ctx, _op, terms) => {
            terms = dropUnfilled(terms);
            if (0 === terms.length)
                return incompleteNil(r, ctx);
            return addsite(new RefVal_1.RefVal({ peg: terms, prefix: true }), r, ctx);
        },
        'dot-infix': (r, ctx, _op, terms) => {
            terms = dropUnfilled(terms);
            if (0 === terms.length)
                return incompleteNil(r, ctx);
            return addsite(new RefVal_1.RefVal({ peg: terms }), r, ctx);
        },
        'star-prefix': (r, ctx, _op, terms) => {
            if (null == terms[0])
                return incompleteNil(r, ctx);
            return addsite(new PrefVal_1.PrefVal({ peg: terms[0] }), r, ctx);
        },
        'dollar-prefix': (r, ctx, _op, terms) => {
            if (null == terms[0])
                return incompleteNil(r, ctx);
            // $.a.b absolute path
            if (terms[0] instanceof RefVal_1.RefVal) {
                terms[0].absolute = true;
                return terms[0];
            }
            return addsite(new VarVal_1.VarVal({ peg: terms[0] }), r, ctx);
        },
        'plus-infix': (r, ctx, _op, terms) => {
            if (null == terms[0] || null == terms[1])
                return incompleteNil(r, ctx);
            return addsite(new PlusOpVal_1.PlusOpVal({ peg: [terms[0], terms[1]] }), r, ctx);
        },
        'negative-prefix': (r, ctx, _op, terms) => {
            let val = terms[0];
            if (null == val)
                return incompleteNil(r, ctx);
            // The exact leaves negate exactly and never change kind. R2/D5
            // holds here too: bigint has a single zero, and Decimal's
            // normalising constructor sends every zero to the same form, so
            // `-0d0` is `0d0` and `-0d0.0` is `0d0.0`.
            if (val instanceof BigIntegerVal_1.BigIntegerVal) {
                return addsite(new BigIntegerVal_1.BigIntegerVal({ peg: -val.peg, src: negsrc(val.src) }), r, ctx);
            }
            if (val instanceof BigDecimalVal_1.BigDecimalVal) {
                return addsite(new BigDecimalVal_1.BigDecimalVal({ peg: val.peg.negate(), src: negsrc(val.src) }), r, ctx);
            }
            // Negating a non-numeric operand (`k-x` splits into k, -x) is an
            // error nil, not NaN (mirrors negate() in go/lang.go).
            if (!(val instanceof IntegerVal_1.IntegerVal) && !(val instanceof NumberVal_1.NumberVal)) {
                return addsite(new NilVal_1.NilVal({ why: 'negative' }), r, ctx);
            }
            // Build a fresh Val rather than mutating in place: the expr plugin
            // can evaluate the same node twice (e.g. inside `*-1` or a
            // disjunct member), and an in-place `peg = -peg` applied twice
            // silently un-negates the number.
            let peg = -1 * val.peg;
            // Normalize -0 to 0 (keeps the AST and canon free of negative zero).
            if (0 === peg)
                peg = 0;
            // Negation never narrows the kind: a number stays a number. An
            // integer stays an integer unless the negation leaves the int64
            // range (only -(-2^63), which no literal can express), in which
            // case it widens to a number rather than failing.
            const out = val instanceof IntegerVal_1.IntegerVal && (0, numkind_1.isIntegerKind)(peg)
                ? new IntegerVal_1.IntegerVal({ peg })
                : new NumberVal_1.NumberVal({ peg });
            return addsite(out, r, ctx);
        },
        'positive-prefix': (r, ctx, _op, terms) => {
            let val = terms[0];
            if (null == val)
                return incompleteNil(r, ctx);
            return addsite(val, r, ctx);
        },
        'func-paren': (r, ctx, _op, terms) => {
            let val = terms[1];
            const fname = terms[0];
            if ('' !== fname) {
                const funcval = funcMap[fname];
                const args = terms.slice(1);
                val = null == funcval ?
                    new NilVal_1.NilVal({ why: 'unknown_function' }) :
                    new funcval({
                        peg: args
                    });
            }
            // `a:()` — grouping parens with nothing inside.
            if (null == val)
                return incompleteNil(r, ctx);
            const out = addsite(val, r, ctx);
            return out;
        },
    };
    jsonic
        .use(asPlugin(expr_1.Expr), {
        op: {
            // disjunct < conjunct: c & b | a -> (c & b) | a
            'conjunct': {
                infix: true, src: '&', left: 16_000_000, right: 17_000_000
            },
            'disjunct': {
                infix: true, src: '|', left: 14_000_000, right: 15_000_000
            },
            'plus-infix': {
                src: '+',
                infix: true,
                left: 20_000_000,
                right: 21_000_000,
            },
            // Re-base the unary prefixes for the same reason. Every aontu
            // operator sits far above the @tabnas/expr defaults, so the
            // default prefix binding power of 4_000_000 left unary `-`/`+`
            // LOOSER than every infix operator: `-1 & integer` parsed as
            // `-(1 & integer)`, and negative-prefix (below) then rejected
            // the composite operand as a `negative` error nil (likewise
            // `-2+3`, `-1|2`). Unary minus must bind tighter than `+`, `&`
            // and `|` — but still looser than `.` (dot-infix left is
            // 25_000_000), so `-0xFF.5` stays `-(0xFF.5)` and `$`.
            // Kept in lock-step with the op table in go/lang.go.
            'negative': {
                src: '-',
                prefix: true,
                right: 22_000_000,
            },
            'positive': {
                src: '+',
                prefix: true,
                right: 22_000_000,
            },
            'dollar-prefix': {
                src: '$',
                prefix: true,
                right: 31_000_000,
            },
            'dot-infix': {
                src: '.',
                infix: true,
                left: 25_000_000,
                right: 24_000_000,
            },
            'dot-prefix': {
                src: '.',
                prefix: true,
                right: 24_000_000,
            },
            'star': {
                src: '*',
                prefix: true,
                right: 24_000_000,
            },
            'func': {
                paren: true,
                preval: {
                    active: true,
                    // allow: ['floor'], //Object.keys(funcMap)
                },
                osrc: '(',
                csrc: ')',
            },
            plain: null,
            addition: null,
            subtraction: null,
            multiplication: null,
            division: null,
            remainder: null,
        },
        evaluate: (r, ctx, op, terms) => {
            // // console.log('EVAL-START', r.u)
            if ('func-paren' === op.name
                // && !r.parent.prev?.u?.paren_preval
                && !r.u?.paren_preval) {
                // terms = [new StringVal({ peg: '' }), ...terms]
                terms = ['', ...terms];
            }
            let val = opmap[op.name](r, ctx, op, terms);
            // // console.log('EVAL', terms, '->', val)
            return val;
        }
    });
    const CJ = jsonic.token['#E&'];
    const CL = jsonic.token.CL;
    const ST = jsonic.token.ST;
    const TX = jsonic.token.TX;
    const NR = jsonic.token.NR;
    const QM = jsonic.token.QM;
    const OPTKEY = [TX, ST, NR];
    jsonic.rule('expr', (rs) => {
        rs.close([
            // A `&` followed by `:` after an expression value belongs to the
            // enclosing map as a spread, not to the expression as a conjunct
            // — backtrack both tokens so the expression completes (and
            // evaluates to a Val) and the map's spread alts take over. This
            // is what makes `k1:$flag &:boolean` parse: without it the expr
            // plugin consumes the `&` as an infix conjunct, chokes on the
            // `:`, and leaves the raw unevaluated expr node in the map
            // (mirrors the expr-rule PrependClose in go/lang.go). The
            // `n: { expr: 0 }` reset matches the plugin's own expr-end alts —
            // the evaluation after-close only fires when the counter is 0.
            { s: [CJ, CL], b: 2, n: { expr: 0 }, g: 'expr,expr-end,spread' },
        ]);
        return rs;
    });
    jsonic.rule('val', (rs) => {
        rs
            .open([
            {
                s: [CJ, CL], p: 'map', b: 2, n: { pk: 1 },
                // @tabnas seeds a descended rule's node from its parent; without
                // a fresh node here the nested spread map (`a:&:{x:1}`) would
                // share the parent map's node object and self-reference.
                a: (r) => { r.node = {}; },
                g: 'spread'
            },
            {
                s: [OPTKEY, QM],
                c: (r) => 0 == r.d,
                p: 'map',
                b: 2,
                // Fresh node (see spread alt above): the optional dive descends
                // to a map and must not share the parent's node object.
                a: (r) => { r.node = {}; },
                g: 'pair,jsonic,top,aontu-optional',
            },
            {
                s: [OPTKEY, QM],
                p: 'map',
                b: 2,
                n: { pk: 1 },
                a: (r) => { r.node = {}; },
                g: 'pair,jsonic,top,dive,aontu-optional',
            },
        ])
            .ac((r, ctx) => {
            let valnode = r.node;
            let valtype = typeof valnode;
            if ('string' === valtype) {
                valnode = addsite(new StringVal_1.StringVal({ peg: r.node }), r, ctx);
            }
            else if ('number' === valtype) {
                // An overflowing literal (1e999) lexes to Infinity; that is an
                // error value, not a number (mirrors not_number in go/lang.go).
                if (!Number.isFinite(r.node)) {
                    valnode = addsite(new NilVal_1.NilVal({ why: 'not_number' }), r, ctx);
                }
                // D7 -- A LOSSY INTEGER LITERAL IS REFUSED, NOT ROUNDED. The
                // token above is already a double, so a literal the double
                // cannot hold exactly (2^53+1, 0x7fffffffffffffff,
                // 0xffffffffffffffff) has ALREADY become a different number by
                // the time it gets here. Storing it would mean the document
                // silently means something other than what it says, so the
                // literal becomes a located error whose hint names the escape:
                // write it `0d…` and get the exact value.
                //
                // The rule is EXACTNESS, not magnitude -- 10^20 and 2^124 are
                // both far outside the int64 window and both land exactly on a
                // binary64, so both stay values (see isLossyIntegerLiteral).
                else if ((0, numkind_1.isLossyIntegerLiteral)(r.node, r.o0.src)) {
                    const nil = new NilVal_1.NilVal({ why: 'lossy_integer_literal' });
                    nil.details = { src: r.o0.src };
                    valnode = addsite(nil, r, ctx);
                }
                // A literal is integer kind only if its source has no '.', its
                // value is integral, and it fits the int64 range: `1.0` is a
                // number, and so are 1e21 and 100000000000000000000 (see
                // isIntegerKind).
                else if ((0, numkind_1.isIntegerKind)(r.node, r.o0.src)) {
                    valnode = addsite(new IntegerVal_1.IntegerVal({ peg: r.node, src: r.o0.src }), r, ctx);
                }
                else {
                    valnode = addsite(new NumberVal_1.NumberVal({ peg: r.node, src: r.o0.src }), r, ctx);
                }
            }
            else if ('boolean' === valtype) {
                valnode = addsite(new BooleanVal_1.BooleanVal({ peg: r.node }), r, ctx);
            }
            else if (null === valnode) {
                valnode = addsite(new NullVal_1.NullVal({ peg: r.node }), r, ctx);
            }
            if (null != valnode && 'object' === typeof valnode && valnode.site) {
                let st = r.o0;
                valnode.site.row = st.rI;
                valnode.site.col = st.cI;
                valnode.site.url = ctx.meta.multisource && ctx.meta.multisource.path;
            }
            // else { ERROR? }
            r.node = valnode;
            return undefined;
        })
            .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }]);
        return rs;
    });
    jsonic.rule('map', (rs) => {
        rs
            .open([
            { s: [CJ, CL], p: 'pair', b: 2, g: 'spread' },
            { s: [OPTKEY, QM], p: 'pair', b: 2, g: 'pair,list,val,imp,jsonic,aontu-optional' },
        ])
            .bc((r, ctx) => {
            const optionalKeys = r.u.aontu_optional_keys ?? [];
            let mo = r.node;
            // An elided value (`a:`) leaves a raw null/undefined that never
            // passed through the val rule; make it an explicit NullVal.
            for (const k in mo) {
                if (null == mo[k] && '___merge' !== k) {
                    mo[k] = addsite(new NullVal_1.NullVal({ peg: null }), r, ctx);
                }
            }
            //  Handle defered conjuncts, e.g. `{x:1 @"foo"}`
            if (mo.___merge) {
                let mop = { ...mo };
                delete mop.___merge;
                // TODO: needs addpath?
                let mopv = new MapVal_1.MapVal({ peg: mop });
                mopv.optionalKeys = optionalKeys;
                r.node =
                    addsite(new ConjunctVal_1.ConjunctVal({ peg: [mopv, ...mo.___merge] }), r, ctx);
            }
            else {
                r.node = addsite(new MapVal_1.MapVal({ peg: mo }), r, ctx);
                r.node.optionalKeys = optionalKeys;
            }
            return undefined;
        })
            .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }]);
        return rs;
    });
    jsonic.rule('list', (rs) => {
        rs
            // .open([{ s: [CJ, CL], p: 'pair', b: 2, g: 'spread' }])
            .bc((r, ctx) => {
            const optionalKeys = r.u.aontu_optional_keys ?? [];
            let ao = r.node;
            // An elided element (`[,]`) is a raw null that never passed
            // through the val rule; make it an explicit NullVal.
            for (let i = 0; i < ao.length; i++) {
                if (null == ao[i]) {
                    ao[i] = addsite(new NullVal_1.NullVal({ peg: null }), r, ctx);
                }
            }
            if (ao.___merge) {
                let aop = [...ao];
                delete aop.___merge;
                // TODO: needs addpath?
                let aopv = new ListVal_1.ListVal({ peg: aop });
                aopv.optionalKeys = optionalKeys;
                r.node =
                    addsite(new ConjunctVal_1.ConjunctVal({ peg: [aopv, ...ao.___merge] }), r, ctx);
            }
            else {
                r.node = addsite(new ListVal_1.ListVal({ peg: ao }), r, ctx);
                r.node.optionalKeys = optionalKeys;
            }
            return undefined;
        });
        // .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])
        return rs;
    });
    // TODO: copied from jsonic grammar
    // jsonic should provide a way to export this
    const pairkey = (r) => {
        // Get key string value from first matching token of `Open` state.
        const key_token = r.o0;
        const key = ST === key_token.tin || TX === key_token.tin
            ? key_token.val // Was text
            : key_token.src; // Was number, use original text
        r.u.key = key;
    };
    jsonic.rule('pair', (rs) => {
        rs
            .open([
            {
                s: [CJ, CL], p: 'val',
                u: { spread: true },
                g: 'spread'
            },
            {
                s: [OPTKEY, QM], b: 1, r: 'pair', u: { aontu_optional: true },
                g: 'aontu-optional-key'
            },
            {
                s: [QM, CL],
                c: (r) => r.prev.u.aontu_optional,
                p: 'val',
                u: { pair: true },
                a: (r) => {
                    pairkey(r.prev);
                    r.u.key = r.prev.u.key;
                    r.parent.u.aontu_optional_keys = (r.parent.u.aontu_optional_keys || []);
                    r.parent.u.aontu_optional_keys.push('' + r.u.key);
                },
                g: 'aontu-optional-pair'
            }
        ])
            // NOTE: manually adjust path - @tabnas/path ignores as not pair:true
            .ao((r) => {
            if (0 < r.d && r.u.spread) {
                r.child.k.path = [...r.k.path, '&'];
                r.child.k.key = '&';
            }
        })
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.u.spread) {
                rule.node[type_1.SPREAD] =
                    (rule.node[type_1.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[type_1.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        })
            .close([
            // A following `&:` starts a sibling spread pair in the current
            // map: directly inside a braced map (pk<=0) at any depth, or in
            // the implicit top-level map (dmap<=1). Inside an implicit
            // colon-chain map (pk>0) it bubbles up instead (second alt), so
            // `a:b:1 &:2` attaches the spread to a's map, not b's.
            { s: [CJ, CL], c: (r) => r.lte('pk', 0) || r.lte('dmap', 1), r: 'pair', b: 2, g: 'spread,json,pair' },
            { s: [CJ, CL], b: 2, g: 'spread,json,more' }
        ]);
        return rs;
    });
    jsonic.rule('elem', (rs) => {
        rs
            .open([
            {
                s: [CJ, CL],
                p: 'val',
                n: { pk: 1, dmap: 1 },
                u: { spread: true, done: true, list: true },
                g: 'spread'
            },
            {
                s: [OPTKEY, QM], b: 1, r: 'elem', u: { aontu_optional: true },
                g: 'aontu-optional-key-elem'
            },
            {
                s: [QM, CL],
                c: (r) => r.prev.u.aontu_optional,
                p: 'val',
                u: { spread: true, done: true, list: true, pair: true },
                a: (r) => {
                    pairkey(r.prev);
                    r.u.key = r.prev.u.key;
                    r.parent.u.aontu_optional_keys = (r.parent.u.aontu_optional_keys || []);
                    r.parent.u.aontu_optional_keys.push('' + r.u.key);
                },
                g: 'aontu-optional-elem'
            }
        ])
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.u.spread) {
                rule.node[type_1.SPREAD] =
                    (rule.node[type_1.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[type_1.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        })
            .close([{ s: [CJ, CL], r: 'elem', b: 2, g: 'spread,json,more' }]);
        return rs;
    });
};
// SECURITY: the default resolver reads any file/package the process can
// reach — @"path" follows relative paths (`@"../../etc/passwd"`) and
// symlinks with no containment check, and @"pkg" can require() arbitrary
// installed modules. This is intentional for the CLI, but it means a
// `.aon` source can read referenced files; the LSP uses this same
// resolver, so treat opening an untrusted source as running it. Pass a
// confined `options.resolver` to restrict reads in less-trusted contexts.
function makeModelResolver(options) {
    const useRequire = options.require || require;
    let memResolver = (0, mem_1.makeMemResolver)({
        ...(options.resolver?.mem || {})
    });
    // TODO: make this consistent with other resolvers
    let fileResolver = (0, file_1.makeFileResolver)((spec) => {
        return 'string' === typeof spec ? spec : spec?.peg;
    });
    let pkgResolver = (0, pkg_1.makePkgResolver)({
        require: useRequire,
        ...(options.resolver?.pkg || {})
    });
    return function ModelResolver(spec, popts, rule, ctx, jsonic) {
        let path = 'string' === typeof spec ? spec : spec?.peg;
        // A bare `@` with no path (`a:@`) has nothing to resolve; report
        // not-found instead of crashing in the underlying resolvers.
        if (null == path || '' === path) {
            return { found: false, path: '' + (path ?? ''), search: [] };
        }
        let search = [];
        let res = memResolver(path, popts, rule, ctx, jsonic);
        res.path = path;
        if (res.found) {
            return res;
        }
        search = search.concat(res.search);
        res = fileResolver(path, popts, rule, ctx, jsonic);
        res.path = path;
        if (res.found) {
            return res;
        }
        search = search.concat(res.search);
        res = pkgResolver(path, popts, rule, ctx, jsonic);
        res.path = path;
        if (res.found) {
            return res;
        }
        res.search = search.concat(res.search);
        return res;
    };
}
// rawToVal converts a raw parse node (or raw elements inside one) into
// the matching Val. Used for implicit top-level lists, whose nodes skip
// the aontu val rule conversions (mirrors asVal in go/lang.go; like
// there, source text is unavailable, so an integral number is an
// integer).
function rawToVal(n) {
    if (null == n) {
        return new NullVal_1.NullVal({ peg: null });
    }
    if (true === n.isVal) {
        return n;
    }
    if (Array.isArray(n)) {
        return new ListVal_1.ListVal({ peg: n.map(rawToVal) });
    }
    const t = typeof n;
    if ('string' === t) {
        return new StringVal_1.StringVal({ peg: n });
    }
    if ('number' === t) {
        // No source text here, so the "no '.'" condition is vacuous and the
        // integral + int64-range conditions decide (same helper as the val
        // rule, so the two paths cannot drift).
        return (0, numkind_1.isIntegerKind)(n) ?
            new IntegerVal_1.IntegerVal({ peg: n }) : new NumberVal_1.NumberVal({ peg: n });
    }
    if ('boolean' === t) {
        return new BooleanVal_1.BooleanVal({ peg: n });
    }
    if ('object' === t) {
        // An expr-plugin internal (operator descriptor) leaking through a
        // degenerate parse (`k2.b K:1`) is not data — reject it rather
        // than emitting raw internals in generated output.
        if (undefined !== n.OP_MARK) {
            return new NilVal_1.NilVal({ why: 'parse_unknown' });
        }
        const peg = {};
        for (const k in n) {
            peg[k] = rawToVal(n[k]);
        }
        return new MapVal_1.MapVal({ peg });
    }
    return new NilVal_1.NilVal({ why: 'parse_unknown' });
}
class Lang {
    constructor(options) {
        // const start = performance.now()
        this.opts = Object.assign((0, type_1.DEFAULT_OPTS)(), options);
        const modelResolver = makeModelResolver(this.opts);
        this.jsonic = jsonic_1.Jsonic.make();
        if (this.opts.debug) {
            this.jsonic.use(asPlugin(debug_1.Debug), {
                trace: this.opts.trace
            });
        }
        this.jsonic
            .use(asPlugin(multisource_1.MultiSource), {
            resolver: options?.resolver || modelResolver,
            // `.aon` is the preferred Aontu source extension; `.aontu` also
            // works. `.jsonic` is retired (no longer auto-resolved); the
            // default `['jsonic','jsc','json','js']` is overridden here.
            // (Upstream option name is the misspelled `implictExt`.)
            implictExt: ['aon', 'aontu'],
            processor: {
                aontu: 'jsonic',
                aon: 'jsonic',
            }
        })
            .use(AontuJsonic);
    }
    parse(src, opts) {
        // const start = performance.now()
        // JSONIC-UPDATE - check meta
        let jm = {
            fs: opts?.fs,
            fileName: opts?.path ?? this.opts.path,
            multisource: {
                path: opts?.path ?? this.opts.path,
                deps: (opts && opts.deps) || undefined
            }
        };
        if (null != opts?.idcount) {
            this.idcount = opts.idcount;
        }
        // Pass through Jsonic debug log value
        if (opts && null != opts.log && Number.isInteger(opts.log)) {
            jm.log = opts.log;
        }
        // jm.log = -1
        let val;
        try {
            val = this.jsonic(src, jm);
            // An implicit top-level list (`a b`, `1,2`) is built by the core
            // jsonic grammar without passing through the aontu val/list rules,
            // so the root (and its elements) arrive as raw JS values. Convert
            // them the same way the Go port's asVal post-walk does.
            if (null != val && true !== val.isVal) {
                val = rawToVal(val);
            }
        }
        catch (e) {
            if (e instanceof jsonic_1.JsonicError || 'JsonicError' === e.constructor.name) {
                val = new NilVal_1.NilVal({
                    why: 'parse',
                    err: new NilVal_1.NilVal({
                        why: 'syntax',
                        msg: e.message,
                        err: e,
                    })
                });
            }
            else {
                throw e;
            }
        }
        return val;
    }
}
exports.Lang = Lang;
//# sourceMappingURL=lang.js.map