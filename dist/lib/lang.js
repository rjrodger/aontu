"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.includeFileResolver = exports.Site = exports.Lang = void 0;
const jsonic_next_1 = require("@jsonic/jsonic-next");
const multisource_1 = require("@jsonic/multisource");
const file_1 = require("@jsonic/multisource/dist/resolver/file");
const expr_1 = require("@jsonic/expr");
const path_1 = require("@jsonic/path");
const val_1 = require("./val");
// console.log('TOP', TOP)
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
            map: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                // TODO: jsonic should be able to pass context into these
                'string': {
                    val: (r) => addpath(new val_1.ScalarTypeVal(String), r.keep.path)
                },
                'number': {
                    val: (r) => addpath(new val_1.ScalarTypeVal(Number), r.keep.path)
                },
                'integer': {
                    val: (r) => addpath(new val_1.ScalarTypeVal(val_1.Integer), r.keep.path)
                },
                'boolean': {
                    val: (r) => addpath(new val_1.ScalarTypeVal(Boolean), r.keep.path)
                },
                'nil': {
                    val: (r) => addpath(new val_1.Nil('literal'), r.keep.path)
                },
                // TODO: FIX: need a TOP instance to hold path
                'top': { val: () => val_1.TOP },
            }
        },
        map: {
            merge: (prev, curr) => {
                let pval = prev;
                let cval = curr;
                return addpath(new val_1.ConjunctVal([pval, cval]), prev.path);
            }
        }
    });
    let opmap = {
        'conjunct-infix': (r, _op, terms) => addpath(new val_1.ConjunctVal(terms), r.keep.path),
        'disjunct-infix': (r, _op, terms) => addpath(new val_1.DisjunctVal(terms), r.keep.path),
        'dot-prefix': (r, _op, terms) => addpath(new val_1.RefVal(terms, true), r.keep.path),
        'dot-infix': (r, _op, terms) => addpath(new val_1.RefVal(terms), r.keep.path),
        'star-prefix': (r, _op, terms) => addpath(new val_1.PrefVal(terms[0]), r.keep.path),
    };
    jsonic
        .use(expr_1.Expr, {
        op: {
            // disjunct > conjunct: c & b|a -> c & (b|a)
            'conjunct': {
                infix: true, src: '&', left: 14000, right: 15000
            },
            'disjunct': {
                // infix: true, src: '|', left: 14000, right: 15000
                infix: true, src: '|', left: 16000, right: 17000
            },
            'dot-infix': {
                src: '.',
                infix: true,
                left: 15000000,
                right: 14000000,
            },
            'dot-prefix': {
                src: '.',
                prefix: true,
                right: 14000000,
            },
            'star': {
                src: '*',
                prefix: true,
                right: 14000000,
            },
        },
        evaluate: (r, op, terms) => {
            // console.log('LANG EVAL', r.keep, op, terms)
            let val = opmap[op.name](r, op, terms);
            // console.dir(val, { depth: null })
            return val;
        }
    });
    let CJ = jsonic.token['#E&'];
    let CL = jsonic.token.CL;
    jsonic.rule('val', (rs) => {
        // TODO: wrap utility needed for jsonic to do this?
        // let orig_bc: any = rs.def.bc
        // rs.def.bc = function(rule: Rule, ctx: Context) {
        //   let out = orig_bc.call(this, rule, ctx)
        rs.bc((r, ctx) => {
            let valnode = r.node;
            let valtype = typeof valnode;
            // console.log('VAL RULE', valtype, r.use, r.node)
            if ('string' === valtype) {
                valnode = addpath(new val_1.StringVal(r.node), r.keep.path);
            }
            else if ('number' === valtype) {
                if (Number.isInteger(r.node)) {
                    valnode = addpath(new val_1.IntegerVal(r.node), r.keep.path);
                }
                else {
                    valnode = addpath(new val_1.NumberVal(r.node), r.keep.path);
                }
            }
            else if ('boolean' === valtype) {
                valnode = addpath(new val_1.BooleanVal(r.node), r.keep.path);
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
        rs.bc((r) => {
            // console.log('MAP RULE', rule.use, rule.node)
            r.node = addpath(new val_1.MapVal(r.node), r.keep.path);
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
            r.node = addpath(new val_1.ListVal(r.node), r.keep.path);
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        rs
            .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.use.spread) {
                rule.node[val_1.MapVal.SPREAD] =
                    (rule.node[val_1.MapVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[val_1.MapVal.SPREAD].v.push(rule.child.node);
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
                rule.node[val_1.ListVal.SPREAD] =
                    (rule.node[val_1.ListVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[val_1.ListVal.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        });
        return rs;
    });
};
const includeFileResolver = (0, file_1.makeFileResolver)((spec) => {
    return 'string' === typeof spec ? spec : spec === null || spec === void 0 ? void 0 : spec.peg;
});
exports.includeFileResolver = includeFileResolver;
class Lang {
    constructor(options) {
        this.options = {
            src: '',
            print: -1,
        };
        this.options = Object.assign({}, this.options, options);
        this.jsonic = jsonic_next_1.Jsonic.make()
            .use(AontuJsonic)
            .use(multisource_1.MultiSource, {
            resolver: (options === null || options === void 0 ? void 0 : options.resolver) || includeFileResolver
        });
    }
    parse(src, opts) {
        // JSONIC-UPDATE - check meta
        let jm = {
            multisource: {
                // NOTE: multisource has property `path` NOT `base`
                path: this.options.base,
                deps: (opts && opts.deps) || undefined
            }
        };
        // Pass through Jsonic debug log value
        if (opts && null != opts.log && Number.isInteger(opts.log)) {
            jm.log = opts.log;
        }
        // jm.log = -1
        let val = this.jsonic(src, jm);
        return val;
    }
}
exports.Lang = Lang;
//# sourceMappingURL=lang.js.map