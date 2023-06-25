"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = exports.Lang = void 0;
const jsonic_next_1 = require("@jsonic/jsonic-next");
// import { Debug } from '@jsonic/jsonic-next/debug'
const multisource_1 = require("@jsonic/multisource");
const file_1 = require("@jsonic/multisource/dist/resolver/file");
const pkg_1 = require("@jsonic/multisource/dist/resolver/pkg");
const mem_1 = require("@jsonic/multisource/dist/resolver/mem");
const expr_1 = require("@jsonic/expr");
const path_1 = require("@jsonic/path");
const DisjunctVal_1 = require("./val/DisjunctVal");
const ConjunctVal_1 = require("./val/ConjunctVal");
const ListVal_1 = require("./val/ListVal");
const MapVal_1 = require("./val/MapVal");
const Nil_1 = require("./val/Nil");
const PrefVal_1 = require("./val/PrefVal");
const RefVal_1 = require("./val/RefVal");
const VarVal_1 = require("./val/VarVal");
const val_1 = require("./val");
class Site {
    // static NONE = new Site(TOP)
    constructor(val) {
        this.row = -1;
        this.col = -1;
        this.url = '';
        // TODO: logic to select most meaningful site if val has no site,
        // but has peg children that do.
        this.row = val.row;
        this.col = val.col;
        this.url = val.url;
    }
}
exports.Site = Site;
let AontuJsonic = function aontu(jsonic) {
    jsonic.use(path_1.Path);
    // TODO: refactor Val constructor
    let addpath = (v, p) => (v.path = [...(p || [])], v);
    jsonic.options({
        value: {
            def: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                // TODO: jsonic should be able to pass context into these
                'string': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: String }), r.keep.path)
                },
                'number': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: Number }), r.keep.path)
                },
                'integer': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: val_1.Integer }), r.keep.path)
                },
                'boolean': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: Boolean }), r.keep.path)
                },
                'nil': {
                    val: (r) => addpath(new Nil_1.Nil('literal'), r.keep.path)
                },
                // TODO: FIX: need a TOP instance to hold path
                'top': { val: () => val_1.TOP },
            }
        },
        map: {
            merge: (prev, curr) => {
                let pval = prev;
                let cval = curr;
                if ((pval === null || pval === void 0 ? void 0 : pval.isVal) && (cval === null || cval === void 0 ? void 0 : cval.isVal)) {
                    // TODO: test multi element conjuncts work
                    if (pval instanceof ConjunctVal_1.ConjunctVal && cval instanceof ConjunctVal_1.ConjunctVal) {
                        pval.append(cval);
                        return pval;
                    }
                    else if (pval instanceof ConjunctVal_1.ConjunctVal) {
                        pval.append(cval);
                        return pval;
                    }
                    // else if (cval instanceof ConjunctVal) {
                    //   cval.append(pval)
                    //   return cval
                    // }
                    else {
                        return addpath(new ConjunctVal_1.ConjunctVal({ peg: [pval, cval] }), prev.path);
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
    let opmap = {
        'conjunct-infix': (r, _op, terms) => addpath(new ConjunctVal_1.ConjunctVal({ peg: terms }), r.keep.path),
        'disjunct-infix': (r, _op, terms) => addpath(new DisjunctVal_1.DisjunctVal({ peg: terms }), r.keep.path),
        'dot-prefix': (r, _op, terms) => {
            return addpath(new RefVal_1.RefVal({ peg: terms, prefix: true }), r.keep.path);
        },
        'dot-infix': (r, _op, terms) => {
            return addpath(new RefVal_1.RefVal({ peg: terms }), r.keep.path);
        },
        'star-prefix': (r, _op, terms) => addpath(new PrefVal_1.PrefVal({ peg: terms[0] }), r.keep.path),
        'dollar-prefix': (r, _op, terms) => {
            // $.a.b absolute path
            if (terms[0] instanceof RefVal_1.RefVal) {
                terms[0].absolute = true;
                return terms[0];
            }
            return addpath(new VarVal_1.VarVal({ peg: terms[0] }), r.keep.path);
        },
    };
    jsonic
        .use(expr_1.Expr, {
        op: {
            // disjunct > conjunct: c & b|a -> c & (b|a)
            'conjunct': {
                infix: true, src: '&', left: 14000000, right: 15000000
            },
            'disjunct': {
                infix: true, src: '|', left: 16000000, right: 17000000
            },
            'dollar-prefix': {
                src: '$',
                prefix: true,
                right: 31000000,
            },
            'dot-infix': {
                src: '.',
                infix: true,
                left: 25000000,
                right: 24000000,
            },
            'dot-prefix': {
                src: '.',
                prefix: true,
                right: 24000000,
            },
            'star': {
                src: '*',
                prefix: true,
                right: 24000000,
            },
        },
        evaluate: (r, op, terms) => {
            let val = opmap[op.name](r, op, terms);
            return val;
        }
    });
    let CJ = jsonic.token['#E&'];
    let CL = jsonic.token.CL;
    jsonic.rule('val', (rs) => {
        rs
            .open([{ s: [CJ, CL], p: 'map', b: 2, g: 'spread' }])
            .bc((r, ctx) => {
            let valnode = r.node;
            let valtype = typeof valnode;
            if ('string' === valtype) {
                valnode = addpath(new val_1.StringVal({ peg: r.node }), r.keep.path);
            }
            else if ('number' === valtype) {
                if (Number.isInteger(r.node)) {
                    valnode = addpath(new val_1.IntegerVal({ peg: r.node }), r.keep.path);
                }
                else {
                    valnode = addpath(new val_1.NumberVal({ peg: r.node }), r.keep.path);
                }
            }
            else if ('boolean' === valtype) {
                valnode = addpath(new val_1.BooleanVal({ peg: r.node }), r.keep.path);
            }
            let st = r.o0;
            valnode.row = st.rI;
            valnode.col = st.cI;
            // JSONIC-UPDATE: still valid? check multisource
            valnode.url = ctx.meta.multisource && ctx.meta.multisource.path;
            r.node = valnode;
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('map', (rs) => {
        // let orig_bc = rs.def.bc
        // rs.def.bc = function(rule: Rule, ctx: Context) {
        //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined
        rs
            .open([{ s: [CJ, CL], p: 'pair', b: 2, g: 'spread' }])
            .bc((r) => {
            let mo = r.node;
            //  Handle defered conjuncts, e.g. `{x:1 @"foo"}`
            if (mo.___merge) {
                let mop = { ...mo };
                delete mop.___merge;
                // TODO: needs addpath?
                let mopv = new MapVal_1.MapVal({ peg: mop });
                r.node =
                    addpath(new ConjunctVal_1.ConjunctVal({ peg: [mopv, ...mo.___merge] }), r.keep.path);
            }
            else {
                r.node = addpath(new MapVal_1.MapVal({ peg: mo }), r.keep.path);
            }
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('list', (rs) => {
        // let orig_bc = rs.def.bc
        // rs.def.bc = function(rule: Rule, ctx: Context) {
        //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined
        rs.bc((r) => {
            r.node = addpath(new ListVal_1.ListVal({ peg: r.node }), r.keep.path);
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        rs
            .open([{
                s: [CJ, CL], p: 'val',
                // pair:true not set, so key ignored by normal pair close
                u: { spread: true },
                g: 'spread'
            }])
            // NOTE: manually adjust path - @jsonic/path ignores as not pair:true
            .ao((r) => {
            if (0 < r.d && r.use.spread) {
                r.child.keep.path = [...r.keep.path, '&'];
                r.child.keep.key = '&';
            }
        })
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.use.spread) {
                rule.node[MapVal_1.MapVal.SPREAD] =
                    (rule.node[MapVal_1.MapVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[MapVal_1.MapVal.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        });
        return rs;
    });
    jsonic.rule('elem', (rs) => {
        rs
            .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.use.spread) {
                rule.node[ListVal_1.ListVal.SPREAD] =
                    (rule.node[ListVal_1.ListVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[ListVal_1.ListVal.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        });
        return rs;
    });
};
// const includeFileResolver = makeFileResolver((spec: any) => {
//   return 'string' === typeof spec ? spec : spec?.peg
// })
function makeModelResolver(options) {
    var _a, _b;
    const useRequire = options.require || require;
    let memResolver = (0, mem_1.makeMemResolver)({
        ...(((_a = options.resolver) === null || _a === void 0 ? void 0 : _a.mem) || {})
    });
    // let fileResolver = makeFileResolver({
    //   ...(options.resolver?.file || {})
    // })
    // TODO: make this consistent with other resolvers
    let fileResolver = (0, file_1.makeFileResolver)((spec) => {
        return 'string' === typeof spec ? spec : spec === null || spec === void 0 ? void 0 : spec.peg;
    });
    let pkgResolver = (0, pkg_1.makePkgResolver)({
        require: useRequire,
        ...(((_b = options.resolver) === null || _b === void 0 ? void 0 : _b.pkg) || {})
    });
    return function ModelResolver(spec, popts, rule, ctx, jsonic) {
        let path = 'string' === typeof spec ? spec : spec === null || spec === void 0 ? void 0 : spec.peg;
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
class Lang {
    constructor(options) {
        this.options = {
            src: '',
            print: -1,
        };
        this.options = Object.assign({}, this.options, options);
        const modelResolver = makeModelResolver(this.options);
        this.jsonic = jsonic_next_1.Jsonic.make()
            // .use(Debug, { trace: true })
            .use(AontuJsonic)
            .use(multisource_1.MultiSource, {
            // resolver: options?.resolver || includeFileResolver
            resolver: (options === null || options === void 0 ? void 0 : options.resolver) || modelResolver
        });
    }
    parse(src, opts) {
        // JSONIC-UPDATE - check meta
        let jm = {
            multisource: {
                path: this.options.path,
                deps: (opts && opts.deps) || undefined
            }
        };
        // Pass through Jsonic debug log value
        if (opts && null != opts.log && Number.isInteger(opts.log)) {
            jm.log = opts.log;
        }
        // jm.log = -1
        let val;
        try {
            val = this.jsonic(src, jm);
        }
        catch (e) {
            if (e instanceof jsonic_next_1.JsonicError) {
                val = new Nil_1.Nil({
                    why: 'parse',
                    err: new Nil_1.Nil({
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