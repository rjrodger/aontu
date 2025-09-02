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
// const D = (x: any) => console.dir(x, { depth: null })
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
// const V = (x: any) => console.dir(x, { depth: null })
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
        expect(v0.peg.a.peg[1].peg.d.peg.e.peg).toEqual(['.', 'b', 'c']);
        expect(v0.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":..b.c}}}');
        expect(G(s0)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } });
        let s1 = 'a:b:c:1,a:d:e:...a.b.c';
        let v1 = P(s1);
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
                    n: 'a', // NOTE: correct as `a` tree is a normal tree
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
    it('spreadable', () => {
        let g0 = G('a:1 x:{&:{y:$.a}} x:m:q:2 x:n:q:3');
        expect(g0).toEqual({ a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } });
        let g1 = G(`a:x:1 b:&:$.a b:c0:k:0 b:c1:k:1`);
        expect(g1).toEqual({ a: { x: 1 }, b: { c0: { x: 1, k: 0 }, c1: { x: 1, k: 1 } } });
        let g2 = G(`a:x:1 b:&:{y:2}&$.a b:c0:k:0 b:c1:k:1`);
        expect(g2).toEqual({
            a: { x: 1 },
            b: {
                c0: { x: 1, k: 0, y: 2 },
                c1: { x: 1, k: 1, y: 2 }
            }
        });
        let g3 = G(`a:x:1 b:&:{}&$.a b:c0:k:0 b:c1:k:1`);
        expect(g3).toEqual({
            a: { x: 1 },
            b: {
                c0: { x: 1, k: 0 },
                c1: { x: 1, k: 1 }
            }
        });
    });
    it('multi-spreadable', () => {
        expect(P('&:a').canon).toEqual('{&:"a"}');
        expect(P('&:a:1').canon).toEqual('{&:{"a":1}}');
        expect(P('&:a:b:1').canon).toEqual('{&:{"a":{"b":1}}}');
        expect(P('&:a:b:c:1').canon).toEqual('{&:{"a":{"b":{"c":1}}}}');
        expect(P('&:a&:b').canon).toEqual('{&:"a"&"b"}');
        expect(P('&:a:1&:b:2').canon).toEqual('{&:{"a":1}&{"b":2}}');
        expect(P('&:a:b:1&:c:d:2').canon).toEqual('{&:{"a":{"b":1}}&{"c":{"d":2}}}');
        expect(P('&:a:b:c:1&:d:e:f:3').canon)
            .toEqual('{&:{"a":{"b":{"c":1}}}&{"d":{"e":{"f":3}}}}');
        expect(P('&:a&:b&:c').canon).toEqual('{&:"a"&"b"&"c"}');
        expect(P('&:a:1&:b:2&:c:3').canon)
            .toEqual('{&:{"a":1}&{"b":2}&{"c":3}}');
        expect(P('&:a:b:1&:c:d:2&:e:f:3').canon)
            .toEqual('{&:{"a":{"b":1}}&{"c":{"d":2}}&{"e":{"f":3}}}');
        expect(P('&:a:b:c:1&:d:e:f:3&:g:h:i:3').canon)
            .toEqual('{&:{"a":{"b":{"c":1}}}&' +
            '{"d":{"e":{"f":3}}}&{"g":{"h":{"i":3}}}}');
        expect(G('x:&:k:string x:a:k:a x:b:k:b'))
            .toEqual({ x: { a: { k: 'a' }, b: { k: 'b' } } });
        expect(G('x:&:k:1 x:a:k:1 x:b:k:1'))
            .toEqual({ x: { a: { k: 1 }, b: { k: 1 } } });
        expect(G('x:&:k:1 x:&:p:2 x:a:{k:1,p:2} x:b:{k:1,p:2}'))
            .toEqual({ x: { a: { k: 1, p: 2 }, b: { k: 1, p: 2 } } });
        expect(G('&:k:string a:k:a b:k:b'))
            .toEqual({ a: { k: 'a' }, b: { k: 'b' } });
        expect(G('&:k:1 a:k:1 b:k:1'))
            .toEqual({ a: { k: 1 }, b: { k: 1 } });
        expect(G('&:k:1 &:p:2 a:{k:1,p:2} b:{k:1,p:2}'))
            .toEqual({ a: { k: 1, p: 2 }, b: { k: 1, p: 2 } });
    });
    it('multi-spreadable-key', () => {
        expect(G('.$KEY')).toEqual('');
        expect(G('k:.$KEY')).toEqual({ k: '' });
        expect(G('a:k:.$KEY')).toEqual({ a: { k: 'a' } });
        expect(G('a:b:k:.$KEY')).toEqual({ a: { b: { k: 'b' } } });
        expect(G('k:.$KEY k:string')).toEqual({ k: '' });
        expect(G('a:k:.$KEY a:k:a')).toEqual({ a: { k: 'a' } });
        expect(G('a:k:string a:k:.$KEY a:k:a')).toEqual({ a: { k: 'a' } });
        expect(G('&:k:.$KEY')).toEqual({});
        expect(G('&:k:.$KEY a:{}')).toEqual({ a: { k: 'a' } });
        expect(G('&:k:.$KEY a:{} b:{}')).toEqual({ a: { k: 'a' }, b: { k: 'b' } });
        expect(G('&:k:a &:p:2 a:{x:11}')).toEqual({ a: { k: 'a', p: 2, x: 11 } });
        expect(G('&:k:.$KEY &:p:2 a:{x:11}')).toEqual({ a: { k: 'a', p: 2, x: 11 } });
        expect(G('&:k:.$KEY &:p:2 a:{x:11} b:{x:22}'))
            .toEqual({ a: { k: 'a', p: 2, x: 11 }, b: { k: 'b', p: 2, x: 22 } });
        expect(G('a:&:n:.$KEY a:b:{}'))
            .toEqual({ a: { b: { n: 'b' } } });
        expect(G('a:&:b:&:n:.$KEY a:x:b:y:{}'))
            .toEqual({ a: { x: { b: { y: { n: 'y' } } } } });
        expect(G('&:n:.$KEY a:{}'))
            .toEqual({ a: { n: 'a' } });
        expect(G('&:a:&:n:.$KEY x:{a:{y:{}}}'))
            .toEqual({ x: { a: { y: { n: 'y' } } } });
        expect(G('a:&:k:.$KEY a:b:{}')).toEqual({ a: { b: { k: 'b' } } });
        expect(G('a:&:k:.$KEY a:b:{c:1} x:&:k:.$KEY x:y:{d:2}'))
            .toEqual({ a: { b: { k: 'b', c: 1 } }, x: { y: { k: 'y', d: 2 } } });
        expect(G('a:&:k:.$KEY a:b:{c:1} x:$.a x:y:{d:2}')).toEqual({
            a: { b: { c: 1, k: 'b' } },
            x: { b: { c: 1, k: 'b' }, y: { d: 2, k: 'y' } }
        });
        expect(G(`
q: &: { n: .$KEY, m: &: { k: .$KEY } }
a: q: $.q
a: q: v: { m: { w:{}, y:{} } }
`)).toEqual({
            q: {},
            a: {
                q: {
                    v: { m: { w: { k: 'w' }, y: { k: 'y' } }, n: 'v' }
                }
            }
        });
        expect(G(`
a: b: c: d: e: $.a.b.f

a: b: f: &: {
   n: .$KEY
   p: *true | boolean
}

a: b: f: {
  x: {
    k: *K | string
    s: S
  }
}
`)).toEqual({
            a: {
                b: {
                    c: {
                        d: { e: { x: { k: 'K', s: 'S', n: 'x', p: true } } }
                    },
                    f: { x: { k: 'K', s: 'S', n: 'x', p: true } }
                }
            }
        });
    });
});
function makeCtx(r, p) {
    return new unify_1.Context({
        root: r || new MapVal_1.MapVal({ peg: {} }),
        path: p
    });
}
//# sourceMappingURL=val-ref.test.js.map