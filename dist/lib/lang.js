"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.includeFileResolver = exports.Site = exports.Lang = void 0;
const jsonic_next_1 = require("@jsonic/jsonic-next");
const multisource_1 = require("@jsonic/multisource");
const file_1 = require("@jsonic/multisource/dist/resolver/file");
const expr_1 = require("@jsonic/expr");
const val_1 = require("./val");
class Site {
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
Site.NONE = new Site(val_1.TOP);
let AontuJsonic = function aontu(jsonic) {
    jsonic.options({
        value: {
            map: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                // TODO: jsonic should be able to pass context into these
                'string': { val: () => new val_1.ScalarTypeVal(String) },
                'number': { val: () => new val_1.ScalarTypeVal(Number) },
                'integer': { val: () => new val_1.ScalarTypeVal(val_1.Integer) },
                'boolean': { val: () => new val_1.ScalarTypeVal(Boolean) },
                'nil': { val: () => new val_1.Nil('literal') },
                'top': { val: () => val_1.TOP },
            }
        },
        map: {
            merge: (prev, curr) => {
                let pval = prev;
                let cval = curr;
                return new val_1.ConjunctVal([pval, cval]);
            }
        }
    });
    let opmap = {
        'conjunct-infix': (_op, terms) => new val_1.ConjunctVal(terms),
        'disjunct-infix': (_op, terms) => new val_1.DisjunctVal(terms),
        'dot-prefix': (_op, terms) => new val_1.RefVal(terms, true),
        'dot-infix': (_op, terms) => new val_1.RefVal(terms),
        'star-prefix': (_op, terms) => new val_1.PrefVal(terms[0]),
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
        evaluate: (op, terms) => {
            // console.log('LANG EVAL', op, terms)
            return opmap[op.name](op, terms);
        }
    });
    let CJ = jsonic.token['#E&'];
    let CL = jsonic.token.CL;
    jsonic.rule('val', (rs) => {
        // TODO: wrap utility needed for jsonic to do this?
        // let orig_bc: any = rs.def.bc
        // rs.def.bc = function(rule: Rule, ctx: Context) {
        //   let out = orig_bc.call(this, rule, ctx)
        rs.bc(false, (rule, ctx) => {
            let valnode = rule.node;
            let valtype = typeof valnode;
            // console.log('VAL RULE', rule.use, rule.node)
            if ('string' === valtype) {
                valnode = new val_1.StringVal(rule.node);
            }
            else if ('number' === valtype) {
                if (Number.isInteger(rule.node)) {
                    valnode = new val_1.IntegerVal(rule.node);
                }
                else {
                    valnode = new val_1.NumberVal(rule.node);
                }
            }
            else if ('boolean' === valtype) {
                valnode = new val_1.BooleanVal(rule.node);
            }
            let st = rule.o0;
            valnode.row = st.rI;
            valnode.col = st.cI;
            // JSONIC-UPDATE: still valid? check multisource
            valnode.url = ctx.meta.multisource && ctx.meta.multisource.path;
            rule.node = valnode;
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('map', (rs) => {
        // let orig_bc = rs.def.bc
        // rs.def.bc = function(rule: Rule, ctx: Context) {
        //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined
        rs.bc(false, (rule) => {
            // console.log('MAP RULE', rule.use, rule.node)
            rule.node = new val_1.MapVal(rule.node);
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('list', (rs) => {
        // let orig_bc = rs.def.bc
        // rs.def.bc = function(rule: Rule, ctx: Context) {
        //   let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined
        rs.bc(false, (rule) => {
            rule.node = new val_1.ListVal(rule.node);
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        // let orig_bc: any = rs.def.bc
        rs
            .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, g: 'spread' }])
            // .bc((...rest: any) => {
            //   orig_bc(...rest)
            .bc(false, (rule) => {
            // let rule = rest[0]
            // console.log('PAIR RULE', rule.use, rule.node,
            //  rule.parent.name, rule.parent.use)
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