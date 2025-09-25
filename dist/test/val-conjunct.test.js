"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const code_1 = require("@hapi/code");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
// const D = (x: any) => console.dir(x, { depth: null })
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
// const V = (x: any) => console.dir(x, { depth: null })
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
        (0, code_1.expect)(g0).equal(1);
        let g1 = G('{a:1}&{b:2}&{c:3}');
        // console.log(g0)
        (0, code_1.expect)(g1).equal({ a: 1, b: 2, c: 3 });
    });
    it('ref', () => {
        let g0 = G('a:1,b:number&$.a');
        (0, code_1.expect)(g0).equal({ a: 1, b: 1 });
        let g1 = G('x:a:1,x:b:$.x.a');
        (0, code_1.expect)(g1).equal({ x: { a: 1, b: 1 } });
        let g2 = G('x:a:1,x:b:number&$.x.a');
        (0, code_1.expect)(g2).equal({ x: { a: 1, b: 1 } });
        (0, code_1.expect)(UC('a:*1|number,b:*2|number,c:$.a&$.b'))
            .equal('{"a":*1|number,"b":*2|number,"c":*2|*1|number}');
        let g3 = G('{b:$.a&$.a}&{a:1}');
        (0, code_1.expect)(g3).equal({ a: 1, b: 1 });
    });
    it('disjunct', () => {
        let u0 = UC('a:{x:1}|{y:2},a:{z:3}');
        (0, code_1.expect)(u0).equal('{"a":{"x":1,"z":3}|{"y":2,"z":3}}');
        let u1 = UC('a:{x:1}|{y:2},a:{z:3}|{q:4}');
        (0, code_1.expect)(u1)
            .equal('{"a":{"x":1,"z":3}|{"y":2,"z":3}|{"x":1,"q":4}|{"y":2,"q":4}}');
        let u2 = UC('a:*1|number,a:*2|number');
        (0, code_1.expect)(u2).equal('{"a":*2|*1|number}');
        let u3 = UC('*1|number & *2|number');
        (0, code_1.expect)(u3).equal('*2|*1|number');
    });
    it('map', () => {
        let m0 = UC('{a:1}&{b:2}');
        (0, code_1.expect)(m0).equal('{"a":1,"b":2}');
        let m1 = UC('x:{a:$.y}&{b:2},y:1');
        (0, code_1.expect)(m1).equal('{"x":{"a":1,"b":2},"y":1}');
        let s2 = 'x:{a:$.x.b}&{b:2}';
        (0, code_1.expect)(UC(s2)).equal('{"x":{"a":$.x.b,"b":2}}');
        (0, code_1.expect)(G(s2)).equal({ "x": { "a": 2, "b": 2 } });
        let s3 = 'y:x:{a:$.y.x.b}&{b:2}';
        (0, code_1.expect)(UC(s3)).equal('{"y":{"x":{"a":$.y.x.b,"b":2}}}');
        (0, code_1.expect)(G(s3)).equal({ y: { x: { a: 2, b: 2 } } });
    });
    it('conjunct-spread', () => {
        let g0 = G('{&:{x:*1|number},a:{},b:{x:2}}');
        (0, code_1.expect)(g0).equal({ a: { x: 1 }, b: { x: 2 } });
        let g1 = G('&:{x:*1|number},a:{},b:{x:2}');
        (0, code_1.expect)(g1).equal({ a: { x: 1 }, b: { x: 2 } });
        let g2 = G('a1: &: { x1: 11 } b2: { y2: 22 }');
        (0, code_1.expect)(g2).equal({ a1: {}, b2: { y2: 22 } });
        let g3 = G('a1: &: { c1: { x1: 11 } } b2: { y2: 22 }');
        (0, code_1.expect)(g3).equal({ a1: {}, b2: { y2: 22 } });
        let g4 = G('a1: &: { c1: &: { x1: 11 } } b2: { y2: 22 }');
        (0, code_1.expect)(g4).equal({ a1: {}, b2: { y2: 22 } });
        let g5 = G('a1: &: { c1: &: { d1: &: { x1: 11 } } } b2: { y2: 22 }');
        (0, code_1.expect)(g5).equal({ a1: {}, b2: { y2: 22 } });
    });
    it('clone', () => {
        let v0 = P('{x:1}&{y:2}&{z:3}');
        // console.log(v0.canon)
        (0, code_1.expect)(v0.canon).equal('({"x":1}&{"y":2})&{"z":3}');
        let v0c = v0.clone();
        (0, code_1.expect)(v0c.canon).equal('({"x":1}&{"y":2})&{"z":3}');
    });
});
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}
//# sourceMappingURL=val-conjunct.test.js.map