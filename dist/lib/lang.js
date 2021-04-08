"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AontuLang = void 0;
const jsonic_1 = require("jsonic");
const val_1 = require("./val");
let AontuJsonic = function aontu(jsonic) {
    jsonic.options({
        value: {
            src: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                'string': () => new val_1.ScalarTypeVal(String),
                'number': () => new val_1.ScalarTypeVal(Number),
                'integer': () => new val_1.ScalarTypeVal(val_1.Integer),
                'boolean': () => new val_1.ScalarTypeVal(Boolean),
                'nil': () => new val_1.Nil(),
                'top': () => val_1.TOP,
            }
        },
        token: {
            '#A&': { c: '&' },
            '#A|': { c: '|' },
        }
    });
    let NR = jsonic.token.NR;
    let TX = jsonic.token.TX;
    let ST = jsonic.token.ST;
    let VL = jsonic.token.VL;
    let OB = jsonic.token.OB;
    let OS = jsonic.token.OS;
    let CB = jsonic.token.CB;
    let CS = jsonic.token.CS;
    let CJ = jsonic.token['#A&'];
    let DJ = jsonic.token['#A|'];
    jsonic.rule('expr', () => {
        return new jsonic_1.RuleSpec({
            open: [
                { s: [[CJ, DJ]], p: 'disjunct', b: 1, n: { expr: 1 } },
            ],
            close: [
                { s: [] }
            ],
            // NOTE: expr node are meta structures, not Vals
            // t=most recent term on the left, o=Val
            bo: (r) => r.node = { t: r.node },
            ac: (r) => {
                // replace first val with expr val
                r.node = r.child.node.o;
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
                    s: [DJ], r: 'disjunct', b: 1,
                    a: (r) => {
                        var _a;
                        // higher precedence term (e.g &) was on the left
                        let cn = ((_a = r.child.node) === null || _a === void 0 ? void 0 : _a.o) || r.child.node;
                        r.node.t = cn;
                    }
                },
                {
                    s: [CJ], r: 'disjunct', b: 1,
                    a: (r) => {
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
                        r.node.o.val.push(cn);
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
                    s: [CJ, [NR, TX, ST, VL, OB, OS]], b: 1,
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
                    s: [CJ], r: 'conjunct', b: 1,
                    a: (r) => {
                        //r.node =
                        //  r.node instanceof ConjunctVal ? r.node : new ConjunctVal([])
                    }
                },
                /*
                {
                  s: [DJ], r: 'disjunct', b: 1, a: (r: Rule) => {
                    let cn = r.child.node?.o || r.child.node
                    r.node.t = cn
                    r.child.node = null
                  }
                },
                */
                {}
            ],
            ac: (r) => {
                var _a;
                let cn = ((_a = r.child.node) === null || _a === void 0 ? void 0 : _a.o) || r.child.node;
                if (cn) {
                    if (r.node.o instanceof val_1.ConjunctVal) {
                        r.node.o.val.push(cn);
                    }
                    else {
                        r.node.o = cn;
                    }
                }
            }
        });
    });
    jsonic.rule('val', (rs) => {
        rs.def.close.unshift({
            s: [[CJ, DJ]], p: 'expr', b: 1,
            c: (r) => {
                return null == r.n.expr || 0 === r.n.expr;
            }
        });
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
function AontuLang(src, opts) {
    let jsonic = jsonic_1.Jsonic.make().use(AontuJsonic);
    let jm = {};
    if (opts && null != opts.log && Number.isInteger(opts.log)) {
        jm.log = opts.log;
    }
    if (Array.isArray(src)) {
        return src.map(s => jsonic(s, jm));
    }
    else {
        return jsonic(src, jm);
    }
}
exports.AontuLang = AontuLang;
//# sourceMappingURL=lang.js.map