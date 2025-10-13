"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const lang_1 = require("../dist/lang");
const unify_1 = require("../dist/unify");
const MapVal_1 = require("../dist/val/MapVal");
const code_1 = require("@hapi/code");
const unify_2 = require("../dist/unify");
let lang = new lang_1.Lang();
let PL = lang.parse.bind(lang);
let P = (x, ctx) => PL(x, ctx);
let PA = (x, ctx) => x.map(s => PL(s, ctx));
(0, node_test_1.describe)('op', () => {
    (0, node_test_1.it)('happy', () => {
        (0, code_1.expect)(unify_2.unite.name).equal('unite');
        // expect(disjunct.name).equal('disjunct')
    });
    (0, node_test_1.it)('unite-conjunct', () => {
        let U = makeUnite();
        //expect(U('1&1')).equal('1')
        (0, code_1.expect)(U('1&number')).equal('1');
    });
});
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}
function makeUnite(r) {
    let ctx = makeCtx(r);
    return (s) => {
        let terms = s.trim().split(/\s+/).map(x => 'undef' === x ? undefined : x);
        let pterms = PA(terms);
        // console.log(pterms)
        let u = (0, unify_2.unite)(ctx, pterms[0], pterms[1], 'op-test');
        // console.log(u)
        return u.canon;
    };
}
//# sourceMappingURL=op.test.js.map