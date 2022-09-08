"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const MapVal_1 = require("../lib/val/MapVal");
const type_1 = require("../lib/type");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(type_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen();
const V = (x) => console.dir(x, { depth: null });
describe('val-conjunct', function () {
    it('norm', () => {
        // let c0 = P('1&2&3')
        // let nc0 = norm(c0.peg)
        // expect(nc0.map(e => e.peg)).equal([1, 2, 3])
        // // Only norm to one level!
        // let c1 = P('1&2&3&4')
        // let nc1 = norm(c1.peg)
        // expect(nc1.map(e => e.peg)).equal([nc1[0].peg, 3, 4])
    });
    it('basic', () => {
        let g0 = G('1&number');
        // console.log(g0)
        expect(g0).toEqual(1);
        let g1 = G('{a:1}&{b:2}&{c:3}');
        // console.log(g0)
        expect(g1).toEqual({ a: 1, b: 2, c: 3 });
    });
    it('ref', () => {
        let g0 = G('a:1,b:number&.a');
        expect(g0).toEqual({ a: 1, b: 1 });
        let g1 = G('x:a:1,x:b:.x.a');
        expect(g1).toEqual({ x: { a: 1, b: 1 } });
        // let g2 = G('x:a:1,x:b:number&.x.a')
        // expect(g2).toEqual({ x: { a: 1, b: 1 } })
    });
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({}) });
}
//# sourceMappingURL=val-conjunct.test.js.map