"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lang = void 0;
const jsonic_1 = require("jsonic");
const multisource_1 = require("@jsonic/multisource");
const val_1 = require("./val");
let AontuJsonic = function aontu(jsonic) {
    jsonic.options({
        value: {
            src: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                // TODO: jsonic should be able to pass context into these
                'string': () => new val_1.ScalarTypeVal(String),
                'number': () => new val_1.ScalarTypeVal(Number),
                'integer': () => new val_1.ScalarTypeVal(val_1.Integer),
                'boolean': () => new val_1.ScalarTypeVal(Boolean),
                'nil': () => new val_1.Nil([], 'literal'),
                'top': () => val_1.TOP,
            }
        },
        token: {
            '#A&': { c: '&' },
            '#A|': { c: '|' },
            '#A/': { c: '/' },
            '#A*': { c: '*' },
            '#A=': { c: '=' },
        },
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
    jsonic.rule('expr', () => {
        return new jsonic_1.RuleSpec({
            open: [
                { s: [[CJ, DJ, AK]], p: 'disjunct', b: 1, n: { expr: 1 } },
            ],
            close: [
                { s: [] }
            ],
            // NOTE: expr node are meta structures, not Vals
            // t=most recent term on the left, o=Val
            bo: (r) => r.node = { t: r.node },
            ac: (r) => {
                let cn = r.child.node.o;
                if (cn instanceof val_1.PrefVal) {
                    return { err: 'single-pref' };
                }
                // replace first val with expr val
                r.node = cn;
            },
        });
    });
    jsonic.rule('disjunct', () => {
        return new jsonic_1.RuleSpec({
            open: [
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
            ],
            close: [
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
            ],
            ac: (r) => {
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
            }
        });
    });
    jsonic.rule('conjunct', () => {
        return new jsonic_1.RuleSpec({
            open: [
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
            ],
            close: [
                {
                    s: [CJ], r: 'conjunct', b: 1
                },
                {}
            ],
            ac: (r) => {
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
            }
        });
    });
    jsonic.rule('path', () => {
        return new jsonic_1.RuleSpec({
            open: [
                { s: [FS, [TX, ST, NR, VL]], p: 'part', b: 2 }
            ],
            bo: (r) => r.node = new val_1.RefVal('/')
        });
    });
    jsonic.rule('part', () => {
        return new jsonic_1.RuleSpec({
            open: [
                {
                    s: [FS, [TX, ST, NR, VL]], r: 'part', a: (r) => {
                        r.node.append(r.open[1].src);
                    }
                },
                {}, // no more parts
            ],
        });
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
                rule.node[val_1.MapVal.SPREAD] = { o: rule.open[0].src, v: rule.child.node };
            }
            return out;
        };
        return rs;
    });
    jsonic.rule('pref', () => {
        return new jsonic_1.RuleSpec({
            open: [
                {
                    s: [AK, [NR, TX, ST, VL, OB, OS, FS]], b: 1,
                    p: 'val',
                },
            ],
            close: [
                // Can't be in a conjunct
                { s: [CJ], e: (r) => r.open[1] },
                {}
            ],
            ac: (r) => {
                r.node = new val_1.PrefVal(r.child.node);
            }
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
            let st = rule.open[0];
            valnode.row = st.row;
            valnode.col = st.col;
            valnode.url = ctx.meta.multisource && ctx.meta.multisource.path;
            // console.log('VAL META', valnode.canon, valnode.url)
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
            resolver: options ? options.resolver : undefined
        });
        // console.log('AL options', this.options)
    }
    parse(src, opts) {
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
        // console.log('ALp jm', jm)
        let val = this.jsonic(src, jm);
        return val;
    }
}
exports.Lang = Lang;
//# sourceMappingURL=lang.js.map