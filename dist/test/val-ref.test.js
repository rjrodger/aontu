"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const RefVal_1 = require("../lib/val/RefVal");
const MapVal_1 = require("../lib/val/MapVal");
const type_1 = require("../lib/type");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(type_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
const V = (x) => console.dir(x, { depth: null });
describe('val-ref', function () {
    it('unify', () => {
        let r1 = new RefVal_1.RefVal('a');
        let r2 = new RefVal_1.RefVal('a');
        let ctx = makeCtx();
        let u12 = r1.unify(r2, ctx);
        // console.log(u12, r1.id, r2.id)
        expect(r1).toEqual(u12);
    });
    it('spreadable', () => {
        let g0 = G('a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3');
        // console.log(g0)
        expect(g0).toEqual({ a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } });
        let g1 = G('{z:4} & {a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3}');
        // console.log(g1)
        expect(g1).toEqual({ z: 4, a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } });
        let g2 = G('{ x:{&:.a} x:{y:{q:2}} x:{m:{q:3}} } & {a:{z:1}}');
        // console.log(g2)
        expect(g2).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 }, m: { z: 1, q: 3 } } });
        let g3 = G('{}&{a:{z:1},x:{&:.a}&{y:{q:2}}}');
        // console.log(g3)
        expect(g3).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 } } });
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
//# sourceMappingURL=val-ref.test.js.map