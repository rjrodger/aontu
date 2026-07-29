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
const BooleanVal_1 = require("./val/BooleanVal");
const ConjunctVal_1 = require("./val/ConjunctVal");
const DisjunctVal_1 = require("./val/DisjunctVal");
const IntegerVal_1 = require("./val/IntegerVal");
const ListVal_1 = require("./val/ListVal");
const MapVal_1 = require("./val/MapVal");
const NilVal_1 = require("./val/NilVal");
const NullVal_1 = require("./val/NullVal");
const NumberVal_1 = require("./val/NumberVal");
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
                'number': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: Number }), r, ctx)
                },
                'integer': {
                    val: (r, ctx) => addsite(new ScalarKindVal_1.ScalarKindVal({ peg: ScalarKindVal_1.Integer }), r, ctx)
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
            const out = val instanceof IntegerVal_1.IntegerVal
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
                // 1.0 in source is *not* an integer
                else if (Number.isInteger(r.node) && !r.o0.src.includes('.')) {
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
        return Number.isInteger(n) ?
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