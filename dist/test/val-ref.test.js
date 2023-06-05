"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
const RefVal_1 = require("../lib/val/RefVal");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
const V = (x) => console.dir(x, { depth: null });
describe('val-ref', function () {
    test('construct', () => {
        let r0 = new RefVal_1.RefVal({ peg: [], absolute: true });
        expect(r0.canon).toEqual('$');
        expect(r0).toMatchObject({
            path: [],
            absolute: true,
            peg: []
        });
        let r1 = new RefVal_1.RefVal({ peg: ['a'], absolute: true });
        expect(r1.canon).toEqual('$.a');
        expect(r1).toMatchObject({
            path: [],
            absolute: true,
            peg: ['a']
        });
        let r2 = new RefVal_1.RefVal({ peg: ['a', 'b'], absolute: true });
        expect(r2.canon).toEqual('$.a.b');
        expect(r2).toMatchObject({
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
        let r3 = new RefVal_1.RefVal({ peg: ['a'] });
        // console.log(r0)
        expect(r3.canon).toEqual('.a');
        expect(r3).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a']
        });
        let r4 = new RefVal_1.RefVal({ peg: ['a', 'b'] });
        // console.log(r0)
        expect(r4.canon).toEqual('.a.b');
        expect(r4).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r5 = new RefVal_1.RefVal({ peg: ['a', 'b', 'c'] });
        // console.log(r0)
        expect(r5.canon).toEqual('.a.b.c');
        expect(r5).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b', 'c']
        });
        let r6 = new RefVal_1.RefVal({ peg: ['a', 'b', 'c'], absolute: true });
        // console.log(r0)
        expect(r6.canon).toEqual('$.a.b.c');
        expect(r6).toMatchObject({
            path: [],
            absolute: true,
            peg: ['a', 'b', 'c']
        });
        let r7 = new RefVal_1.RefVal({ peg: [] });
        expect(r7.canon).toEqual('');
        expect(r7).toMatchObject({
            path: [],
            absolute: false,
            peg: []
        });
        let r8 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'] }),
                'b'
            ]
        });
        expect(r8.canon).toEqual('.a.b');
        expect(r8).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r9 = new RefVal_1.RefVal({
            peg: [
                'a',
                new RefVal_1.RefVal({ peg: ['b'] }),
            ]
        });
        expect(r9.canon).toEqual('.a.b');
        expect(r9).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r10 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'] }),
                new RefVal_1.RefVal({ peg: ['b'] }),
            ]
        });
        expect(r10.canon).toEqual('.a.b');
        expect(r10).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r11 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'], absolute: true }),
                'b'
            ]
        });
        expect(r11).toMatchObject({
            canon: '$.a.b',
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
        let r12 = new RefVal_1.RefVal({
            peg: [
                'a',
                new RefVal_1.RefVal({ peg: ['b'], absolute: true }),
            ]
        });
        expect(r12).toMatchObject({
            canon: '$.a.b',
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
        let r13 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'], absolute: true }),
                new RefVal_1.RefVal({ peg: ['b'], absolute: true }),
            ]
        });
        expect(r13).toMatchObject({
            canon: '$.a.b',
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
    });
    test('parse', () => {
        expect(P('.a'))
            .toMatchObject({
            canon: '.a', peg: ['a'],
            prefix: true, absolute: false
        });
        // D(P('..a'))
        expect(P('..a'))
            .toMatchObject({
            canon: '..a', peg: ['.', 'a'],
            prefix: true, absolute: false
        });
        expect(P('...a'))
            .toMatchObject({
            canon: '...a', peg: ['.', '.', 'a'],
            prefix: true, absolute: false
        });
        expect(P('....a'))
            .toMatchObject({
            canon: '....a', peg: ['.', '.', '.', 'a'],
            prefix: true, absolute: false
        });
        // D(P('.a.b'))
        expect(P('.a.b'))
            .toMatchObject({
            canon: '.a.b', peg: ['a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('..a.b'))
            .toMatchObject({
            canon: '..a.b', peg: ['.', 'a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('...a.b'))
            .toMatchObject({
            canon: '...a.b', peg: ['.', '.', 'a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('....a.b'))
            .toMatchObject({
            canon: '....a.b', peg: ['.', '.', '.', 'a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a..b'))
            .toMatchObject({
            canon: '.a..b', peg: ['a', '.', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a...b'))
            .toMatchObject({
            canon: '.a...b', peg: ['a', '.', '.', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a....b'))
            .toMatchObject({
            canon: '.a....b', peg: ['a', '.', '.', '.', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a.b.c'))
            .toMatchObject({
            canon: '.a.b.c', peg: ['a', 'b', 'c'],
            prefix: true, absolute: false
        });
        // D(P('.a.b..c'))
        expect(P('.a.b..c'))
            .toMatchObject({
            canon: '.a.b..c', peg: ['a', 'b', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a..b..c'))
            .toMatchObject({
            canon: '.a..b..c', peg: ['a', '.', 'b', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a..b...c'))
            .toMatchObject({
            canon: '.a..b...c', peg: ['a', '.', 'b', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a...b...c'))
            .toMatchObject({
            canon: '.a...b...c', peg: ['a', '.', '.', 'b', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a...b....c'))
            .toMatchObject({
            canon: '.a...b....c', peg: ['a', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a....b....c'))
            .toMatchObject({
            canon: '.a....b....c', peg: ['a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('..a....b....c'))
            .toMatchObject({
            canon: '..a....b....c',
            peg: ['.', 'a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('...a....b....c'))
            .toMatchObject({
            canon: '...a....b....c',
            peg: ['.', '.', 'a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('....a....b....c'))
            .toMatchObject({
            canon: '....a....b....c',
            peg: ['.', '.', '.', 'a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b..c'))
            .toMatchObject({
            canon: '.a.b..c',
            peg: ['a', 'b', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b...c'))
            .toMatchObject({
            canon: '.a.b...c',
            peg: ['a', 'b', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b....c'))
            .toMatchObject({
            canon: '.a.b....c',
            peg: ['a', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b.c.d'))
            .toMatchObject({
            canon: '.a.b.c.d',
            peg: ['a', 'b', 'c', 'd'],
            prefix: true, absolute: false
        });
        expect(P('.a.b.c..d'))
            .toMatchObject({
            canon: '.a.b.c..d',
            peg: ['a', 'b', 'c', '.', 'd'],
            prefix: true, absolute: false
        });
        expect(P('.a..b.c..d'))
            .toMatchObject({
            canon: '.a..b.c..d',
            peg: ['a', '.', 'b', 'c', '.', 'd'],
            prefix: true, absolute: false
        });
        expect(P('.a..b..c..d'))
            .toMatchObject({
            canon: '.a..b..c..d',
            peg: ['a', '.', 'b', '.', 'c', '.', 'd'],
            prefix: true, absolute: false
        });
    });
    test('clone', () => {
        let c0 = makeCtx(null, ['x']);
        let r0 = new RefVal_1.RefVal({ peg: ['a'], absolute: true }, c0);
        // console.log(r0)
        expect(r0).toMatchObject({
            canon: '$.a',
            path: ['x'],
            absolute: true,
            peg: ['a']
        });
        let r1 = r0.clone();
        expect(r1).toMatchObject({
            canon: '$.a',
            path: ['x'],
            absolute: true,
            peg: ['a']
        });
        let c1 = makeCtx(null, ['y', 'z']);
        let r2 = r0.clone(null, c1);
        expect(r2).toMatchObject({
            canon: '$.a',
            path: ['y', 'z'],
            absolute: true,
            peg: ['a']
        });
        let c2 = makeCtx(null, ['k']);
        let r3 = r2.clone(null, c2);
        expect(r3).toMatchObject({
            canon: '$.a',
            path: ['k', 'z'],
            absolute: true,
            peg: ['a']
        });
    });
    test('absolute', () => {
        // NOTE: built as VarVal[RefVal]
        let s0 = 'a:$.x,x:1';
        let v0 = P(s0);
        expect(v0.peg.a.peg).toEqual(['x']);
        expect(v0.canon).toEqual('{"a":$.x,"x":1}');
        expect(G(s0)).toEqual({ a: 1, x: 1 });
        let s1 = 'a:$.x.y,x:y:1';
        let v1 = P(s1);
        // console.log(v1.peg.a)
        expect(v1.peg.a.peg).toEqual(['x', 'y']);
        expect(v1.canon).toEqual('{"a":$.x.y,"x":{"y":1}}');
        expect(G(s1)).toEqual({ a: 1, x: { y: 1 } });
        let s2 = 'a:$.x.y.z,x:y:z:1';
        let v2 = P(s2);
        // console.log(v0)
        expect(v2.peg.a.peg).toEqual(['x', 'y', 'z']);
        expect(v2.canon).toEqual('{"a":$.x.y.z,"x":{"y":{"z":1}}}');
        expect(G(s2)).toEqual({ a: 1, x: { y: { z: 1 } } });
    });
    test('relative-sibling', () => {
        let s0 = 'a:{b:.c,c:1}';
        let v0 = P(s0);
        // console.log(v0)
        expect(v0.peg.a.peg.b.peg).toEqual(['c']);
        expect(v0.canon).toEqual('{"a":{"b":.c,"c":1}}');
        expect(G(s0)).toEqual({ a: { b: 1, c: 1 } });
        let s1 = 'a:{b:.c.d,c:d:1}';
        let v1 = P(s1);
        // console.log(v0)
        expect(v1.peg.a.peg.b.peg).toEqual(['c', 'd']);
        expect(v1.canon).toEqual('{"a":{"b":.c.d,"c":{"d":1}}}');
        expect(G(s1)).toEqual({ a: { b: 1, c: { d: 1 } } });
    });
    test('relative-parent', () => {
        let s0 = 'a:b:c:1,a:d:e:..b.c';
        let v0 = P(s0);
        // console.dir(v0, { depth: null })
        expect(v0.peg.a.peg[1].peg.d.peg.e.peg).toEqual(['.', 'b', 'c']);
        expect(v0.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":..b.c}}}');
        expect(G(s0)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } });
        let s1 = 'a:b:c:1,a:d:e:...a.b.c';
        let v1 = P(s1);
        // console.dir(v0, { depth: null })
        expect(v1.peg.a.peg[1].peg.d.peg.e.peg).toEqual(['.', '.', 'a', 'b', 'c']);
        expect(v1.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":...a.b.c}}}');
        expect(G(s1)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } });
    });
    test('key', () => {
        // let s0 = 'a:b:1,c:$.a.b$KEY'
        // let v0 = P(s0)
        // console.log('AAA', v0)
        // expect(v0.canon).toEqual('{"a":{"b":1},"c":$.a.b$KEY}')
        // expect(G(s0)).toEqual({ a: { b: 1 }, c: 'a' })
        // let s1 = 'a:.$KEY'
        // expect(G(s1)).toEqual({ a: '' })
        let s2 = 'a:b:.$KEY';
        expect(G(s2)).toEqual({ a: { b: 'a' } });
        let s3 = 'a:b:c:.$KEY';
        expect(G(s3)).toEqual({ a: { b: { c: 'b' } } });
        let s4 = `
a: { n: .$KEY, x:1 }
b: { c: $.a }
`;
        expect(G(s4)).toEqual({
            a: {
                n: 'a',
                x: 1,
            },
            b: {
                c: {
                    n: 'a',
                    x: 1,
                },
            },
        });
        let s5 = `
a: { &: { n: .$KEY } }
`;
        expect(G(s5)).toEqual({ a: {} });
        let s6 = `
a: { &: { n: .$KEY } }
a: { b0: {} }
`;
        expect(G(s6)).toEqual({ a: { b0: { n: 'b0' } } });
        let s10 = `
b: { &: {n:.$KEY} }
b: { c0: { k:0, m:.$KEY }}
b: { c1: { k:1 }}
`;
        // console.dir(G(s3), { depth: null })
        expect(G(s10))
            .toEqual({
            b: {
                c0: { n: 'c0', k: 0, m: 'c0' },
                c1: { n: 'c1', k: 1 }
            }
        });
        // let v1 = P(s1)
        // console.log('AAA', v0)
        // expect(v0.canon).toEqual('{"a":{"b":1},"c":$.a.b$KEY}')
        // expect(G(s1)).toEqual({})
    });
    it('ref', () => {
        let ctx = makeCtx();
        let d0 = new RefVal_1.RefVal({ peg: ['a'] });
        let d1 = new RefVal_1.RefVal({ peg: ['c'], absolute: true });
        let d2 = new RefVal_1.RefVal({ peg: ['a', 'b'] });
        let d3 = new RefVal_1.RefVal({ peg: ['c', 'd', 'e'], absolute: true });
        expect(d0.canon).toEqual('.a');
        expect(d1.canon).toEqual('$.c');
        expect(d2.canon).toEqual('.a.b');
        expect(d3.canon).toEqual('$.c.d.e');
        d0.append('x');
        d1.append('x');
        d2.append('x');
        d3.append('x');
        expect(d0.canon).toEqual('.a.x');
        expect(d1.canon).toEqual('$.c.x');
        expect(d2.canon).toEqual('.a.b.x');
        expect(d3.canon).toEqual('$.c.d.e.x');
        expect(d0.unify(val_1.TOP, ctx).canon).toEqual('.a.x');
        expect(val_1.TOP.unify(d0, ctx).canon).toEqual('.a.x');
        expect(d1.unify(val_1.TOP, ctx).canon).toEqual('$.c.x');
        expect(val_1.TOP.unify(d1, ctx).canon).toEqual('$.c.x');
    });
    it('unify', () => {
        let r1 = new RefVal_1.RefVal({ peg: ['a'] });
        let r2 = new RefVal_1.RefVal({ peg: ['a'] });
        let ctx = makeCtx();
        let u12 = r1.unify(r2, ctx);
        // console.log(u12, r1.id, r2.id)
        expect(r1).toEqual(u12);
        let s0 = `a:$.x,a:$.x,x:1`;
        expect(G(s0)).toEqual({ a: 1, x: 1 });
        let s1 = `x:1,a:$.x,a:$.x`;
        expect(G(s1)).toEqual({ a: 1, x: 1 });
        let s2 = `a:$.x,a:$.x`;
        expect(UC(s2)).toEqual('{"a":$.x}');
    });
    /*
    it('spreadable', () => {
      let g0 = G('a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3')
      // console.log(g0)
      expect(g0).toEqual({ a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } })
  
      let g1 = G('{z:4} & {a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3}')
      // console.log(g1)
      expect(g1).toEqual({ z: 4, a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } })
  
      let g2 = G('{ x:{&:.a} x:{y:{q:2}} x:{m:{q:3}} } & {a:{z:1}}')
      // console.log(g2)
      expect(g2).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 }, m: { z: 1, q: 3 } } })
  
      let g3 = G('{}&{a:{z:1},x:{&:.a}&{y:{q:2}}}')
      // console.log(g3)
      expect(g3).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 } } })
    })
  
    */
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r, p) {
    return new unify_1.Context({
        root: r || new MapVal_1.MapVal({ peg: {} }),
        path: p
    });
}
//# sourceMappingURL=val-ref.test.js.map