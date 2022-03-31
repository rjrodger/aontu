"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.includeFileResolver = exports.Site = exports.Lang = void 0;
const jsonic_1 = require("jsonic");
const multisource_1 = require("@jsonic/multisource");
const file_1 = require("@jsonic/multisource/dist/resolver/file");
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
            // JSONIC-UPDATE: map: { val: ... }
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
        // JSONIC-UPDATE: fixed: { token }
        fixed: {
            token: {
                '#A&': '&',
                '#A|': '|',
                '#A/': '/',
                '#A*': '*',
                '#A=': '=',
            }
        },
        // JSONIC-UPDATE: check impl
        map: {
            merge: (prev, curr) => {
                let pval = prev;
                let cval = curr;
                return new val_1.ConjunctVal([pval, cval]);
            }
        }
    });
    let NR = jsonic.token.NR;
    let TX = jsonic.token.TX;
    let ST = jsonic.token.ST;
    let VL = jsonic.token.VL;
    let OB = jsonic.token.OB;
    let OS = jsonic.token.OS;
    let CJ = jsonic.token['#A&'];
    let DJ = jsonic.token['#A|'];
    let FS = jsonic.token['#A/'];
    let AK = jsonic.token['#A*'];
    let EQ = jsonic.token['#A='];
    // JSONIC-UPDATE: rule.open[], rule.close[] - replace with rule.oN|cN
    jsonic.rule('expr', (rs) => {
        rs
            .open([
            { s: [[CJ, DJ, AK]], p: 'disjunct', b: 1, n: { expr: 1 } },
        ])
            .close([
            { s: [] }
        ])
            // NOTE: expr node are meta structures, not Vals
            // t=most recent term on the left, o=Val
            .bo((r) => r.node = { t: r.node })
            .ac((r) => {
            var _a;
            let cn = r.child.node.o;
            if (cn instanceof val_1.PrefVal) {
                return { err: 'single-pref' };
            }
            // replace first val with expr val
            r.node = cn;
            if ('val' === ((_a = r.parent) === null || _a === void 0 ? void 0 : _a.name)) {
                r.parent.node = r.node;
            }
        });
    });
    jsonic.rule('disjunct', (rs) => {
        rs
            .open([
            {
                s: [CJ], p: 'conjunct', b: 1
            },
            {
                s: [AK], p: 'pref', b: 1
            },
            {
                s: [DJ, AK], p: 'pref', b: 1,
                a: (r) => {
                    // Append to existing or start new
                    r.node.o = r.node.o instanceof val_1.DisjunctVal ?
                        r.node.o : new val_1.DisjunctVal([r.node.t]);
                }
            },
            {
                s: [DJ, [NR, TX, ST, VL, OB, OS]], b: 1,
                p: 'val',
                a: (r) => {
                    // Append to existing or start new
                    r.node.o = r.node.o instanceof val_1.DisjunctVal ?
                        r.node.o : new val_1.DisjunctVal([r.node.t]);
                }
            },
        ])
            .close([
            {
                s: [DJ], r: 'disjunct', b: 1, a: (r) => {
                    var _a;
                    // higher precedence term (e.g &) was on the left
                    let cn = ((_a = r.child.node) === null || _a === void 0 ? void 0 : _a.o) || r.child.node;
                    r.node.t = cn;
                }
            },
            {
                s: [CJ], r: 'disjunct', b: 1, a: (r) => {
                    var _a;
                    // & with higher precedence to the right
                    let cn = ((_a = r.child.node) === null || _a === void 0 ? void 0 : _a.o) || r.child.node;
                    r.node.t = cn;
                    r.child.node = null;
                }
            },
            {}
        ])
            .ac((r) => {
            var _a;
            // child values may be normal or expr metas
            let cn = ((_a = r.child.node) === null || _a === void 0 ? void 0 : _a.o) || r.child.node;
            if (cn) {
                if (r.node.o instanceof val_1.DisjunctVal) {
                    r.node.o.append(cn);
                }
                else {
                    // this rule was just a pass-through
                    r.node.o = cn;
                }
            }
        });
    });
    jsonic.rule('conjunct', (rs) => {
        rs
            .open([
            {
                s: [CJ, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
                p: 'val',
                a: (r) => {
                    r.node = {
                        o: r.node.o instanceof val_1.ConjunctVal ?
                            r.node.o : new val_1.ConjunctVal([r.node.t])
                    };
                }
            },
        ])
            .close([
            {
                s: [CJ], r: 'conjunct', b: 1
            },
            {}
        ])
            .ac((r) => {
            var _a;
            let cn = ((_a = r.child.node) === null || _a === void 0 ? void 0 : _a.o) || r.child.node;
            if (cn) {
                if (r.node.o instanceof val_1.ConjunctVal) {
                    r.node.o.append(cn);
                }
                else {
                    r.node.o = cn;
                }
            }
        });
    });
    jsonic.rule('path', (rs) => {
        rs
            .open([
            { s: [FS, [TX, ST, NR, VL]], p: 'part', b: 2 }
        ])
            .bo((r) => r.node = new val_1.RefVal('/'));
    });
    jsonic.rule('part', (rs) => {
        rs.
            open([
            {
                s: [FS, [TX, ST, NR, VL]], r: 'part', a: (r) => {
                    r.node.append(r.o1.src);
                }
            },
            {}, // no more parts
        ]);
    });
    jsonic.rule('pair', (rs) => {
        rs.def.open.unshift({
            s: [[CJ, DJ], EQ], p: 'val', u: { spread: true }
        });
        // TODO: make before/after function[]
        let orig_bc = rs.def.bc;
        rs.def.bc = function (rule, ctx) {
            let out = orig_bc.call(this, rule, ctx);
            if (rule.use.spread) {
                rule.node[val_1.MapVal.SPREAD] =
                    (rule.node[val_1.MapVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[val_1.MapVal.SPREAD].v.push(rule.child.node);
            }
            return out;
        };
        return rs;
    });
    jsonic.rule('pref', (rs) => {
        rs
            .open([
            {
                s: [AK, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
                p: 'val',
            },
        ])
            .close([
            // Can't be in a conjunct
            { s: [CJ], e: (r) => r.o1 },
            {}
        ])
            .ac((r) => {
            r.node = new val_1.PrefVal(r.child.node);
        });
    });
    jsonic.rule('val', (rs) => {
        rs.def.open.unshift(
        // Prefs are always within an expression
        { s: [AK, [NR, TX, ST, VL, OB, OS, FS]], p: 'expr', b: 2 }, { s: [FS, [TX, ST, NR, VL]], p: 'path', b: 2 });
        rs.def.close.unshift({
            s: [[CJ, DJ]], p: 'expr', b: 1, c: (r) => {
                return null == r.n.expr || 0 === r.n.expr;
            }
        });
        // TODO: wrap utility needed for jsonic to do this?
        let orig_bc = rs.def.bc;
        rs.def.bc = function (rule, ctx) {
            let out = orig_bc.call(this, rule, ctx);
            let valnode = rule.node;
            let valtype = typeof valnode;
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
            return out;
        };
        return rs;
    });
    jsonic.rule('map', (rs) => {
        let orig_bc = rs.def.bc;
        rs.def.bc = function (rule, ctx) {
            let out = orig_bc ? orig_bc.call(this, rule, ctx) : undefined;
            rule.node = new val_1.MapVal(rule.node);
            return out;
        };
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
        this.jsonic = jsonic_1.Jsonic.make()
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
        let val = this.jsonic(src, jm);
        return val;
    }
}
exports.Lang = Lang;
//# sourceMappingURL=lang.js.map