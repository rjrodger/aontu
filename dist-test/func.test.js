"use strict";
/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const __1 = require("..");
const unify_1 = require("../dist/unify");
const lang_1 = require("../dist/lang");
const MapVal_1 = require("../dist/val/MapVal");
let lang = new lang_1.Lang();
const G = (x, ctx) => new unify_1.Unify(x, lang)
    .res.gen(ctx || new unify_1.Context({ root: new MapVal_1.MapVal({ peg: {} }) }));
(0, node_test_1.describe)('func', function () {
    (0, node_test_1.test)('lower-numbers', () => {
        (0, code_1.expect)(G('lower(1.1)')).equal(1);
        (0, code_1.expect)(G('lower(1.9)')).equal(1);
        (0, code_1.expect)(G('lower(2.0)')).equal(2);
        (0, code_1.expect)(G('lower(-1.1)')).equal(-2);
        (0, code_1.expect)(G('lower(-1.9)')).equal(-2);
    });
    (0, node_test_1.test)('lower-numbers-expr', () => {
        (0, code_1.expect)(G('lower(1.1)+2')).equal(3);
        (0, code_1.expect)(G('2+lower(1.9)')).equal(3);
        (0, code_1.expect)(G('(lower(1.5))')).equal(1);
        (0, code_1.expect)(G('lower(2.7)+1')).equal(3);
        (0, code_1.expect)(G('1+lower(2.7)')).equal(3);
        (0, code_1.expect)(G('1+lower(2.7)+1')).equal(4);
        (0, code_1.expect)(G('(lower(2.7)+1)')).equal(3);
        (0, code_1.expect)(G('(1+lower(2.7))')).equal(3);
        (0, code_1.expect)(G('(1+lower(2.7)+1)')).equal(4);
        (0, code_1.expect)(G('lower(1.1)+lower(2.9)')).equal(3);
    });
    (0, node_test_1.test)('lower-numbers-deep', () => {
        (0, code_1.expect)(G('x:lower(1.1)')).equal({ x: 1 });
        (0, code_1.expect)(G('x:{y:lower(2.9)}')).equal({ x: { y: 2 } });
        (0, code_1.expect)(G('[lower(1.1)]')).equal([1]);
        (0, code_1.expect)(G('[x,lower(2.9)]')).equal(['x', 2]);
        (0, code_1.expect)(G('x:{y:[lower(3.9)]}')).equal({ x: { y: [3] } });
    });
    (0, node_test_1.test)('lower-numbers-path', () => {
        (0, code_1.expect)(G('x:1.5 y:lower($.x)')).equal({ x: 1.5, y: 1 });
        (0, code_1.expect)(G('x:3.9 y:{z:lower($.x)}')).equal({ x: 3.9, y: { z: 3 } });
        (0, code_1.expect)(G('a:2.7 y:lower($.a)')).equal({ a: 2.7, y: 2 });
        (0, code_1.expect)(G('x:{a:2.7} y:$.x.a')).equal({ x: { a: 2.7 }, y: 2.7 });
        (0, code_1.expect)(G('x:3 y:($.x)')).equal({ x: 3, y: 3 });
        (0, code_1.expect)(G('x:{a:5} y:(x.a)')).equal({ x: { a: 5 }, y: 5 });
        (0, code_1.expect)(G('z:x:{a:6} z:y:(.x.a)')).equal({ z: { x: { a: 6 }, y: 6 } });
        (0, code_1.expect)(G('z:x:{a:6} z:y:(x.a)')).equal({ z: { x: { a: 6 }, y: 6 } });
        (0, code_1.expect)(G('x:{a:4} y:(.x.a)')).equal({ x: { a: 4 }, y: 4 });
        (0, code_1.expect)(G('x:{a:3} y:($.x.a)')).equal({ x: { a: 3 }, y: 3 });
        (0, code_1.expect)(G('x:{a:2.7} y:lower($.x.a)')).equal({ x: { a: 2.7 }, y: 2 });
        (0, code_1.expect)(G('x:(1)')).equal({ x: 1 });
        (0, code_1.expect)(G('x:(+2)')).equal({ x: 2 });
        (0, code_1.expect)(G('x:(3+4)')).equal({ x: 7 });
        (0, code_1.expect)(G('x:(+3+4)')).equal({ x: 7 });
        (0, code_1.expect)(G('x:(5+6+7)')).equal({ x: 18 });
        (0, code_1.expect)(G('x:(+5+6+7)')).equal({ x: 18 });
    });
    (0, node_test_1.test)('lower-numbers-spread', () => {
        (0, code_1.expect)(G('a:{&:x:lower(1.1)} a:{b:{y:1}}')).equal({ a: { b: { x: 1, y: 1 } } });
        (0, code_1.expect)(G('a:{&:x:lower(2.9)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 2, y: 1 }, c: { x: 2, y: 2 } } });
        (0, code_1.expect)(G('a:{&:z:lower(3.5)} a:{b:{y:1}}')).equal({ a: { b: { z: 3, y: 1 } } });
    });
    (0, node_test_1.test)('lower-numbers-pref', () => {
        (0, code_1.expect)(G('x:*lower(1.1)')).equal({ x: 1 });
    });
    (0, node_test_1.test)('upper-numbers', () => {
        (0, code_1.expect)(G('upper(1.1)')).equal(2);
        (0, code_1.expect)(G('upper(1.9)')).equal(2);
        (0, code_1.expect)(G('upper(2.0)')).equal(2);
        (0, code_1.expect)(G('upper(-1.1)')).equal(-1);
        (0, code_1.expect)(G('upper(-1.9)')).equal(-1);
    });
    (0, node_test_1.test)('upper-numbers-expr', () => {
        (0, code_1.expect)(G('upper(1.1)+2')).equal(4);
        (0, code_1.expect)(G('2+upper(1.9)')).equal(4);
        (0, code_1.expect)(G('(upper(1.5))')).equal(2);
        (0, code_1.expect)(G('(upper(2.1)+1)')).equal(4);
        (0, code_1.expect)(G('upper(1.1)+upper(2.1)')).equal(5);
    });
    (0, node_test_1.test)('upper-numbers-deep', () => {
        (0, code_1.expect)(G('x:upper(1.1)')).equal({ x: 2 });
        (0, code_1.expect)(G('x:{y:upper(2.1)}')).equal({ x: { y: 3 } });
        (0, code_1.expect)(G('[upper(1.1)]')).equal([2]);
        (0, code_1.expect)(G('[x,upper(2.1)]')).equal(['x', 3]);
        (0, code_1.expect)(G('x:{y:[upper(3.1)]}')).equal({ x: { y: [4] } });
    });
    (0, node_test_1.test)('upper-numbers-path', () => {
        (0, code_1.expect)(G('x:1.5 y:upper($.x)')).equal({ x: 1.5, y: 2 });
        (0, code_1.expect)(G('x:{a:2.3} y:upper($.x.a)')).equal({ x: { a: 2.3 }, y: 3 });
        (0, code_1.expect)(G('x:3.1 y:{z:upper($.x)}')).equal({ x: 3.1, y: { z: 4 } });
    });
    (0, node_test_1.test)('upper-numbers-spread', () => {
        (0, code_1.expect)(G('a:{&:x:upper(1.1)} a:{b:{y:1}}')).equal({ a: { b: { x: 2, y: 1 } } });
        (0, code_1.expect)(G('a:{&:x:upper(2.1)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 3, y: 1 }, c: { x: 3, y: 2 } } });
        (0, code_1.expect)(G('a:{&:z:upper(3.5)} a:{b:{y:1}}')).equal({ a: { b: { z: 4, y: 1 } } });
    });
    (0, node_test_1.test)('upper-basic', () => {
        (0, code_1.expect)(G('upper(a)')).equal('A');
        (0, code_1.expect)(G('upper(abc)')).equal('ABC');
        (0, code_1.expect)(G('upper(ABC)')).equal('ABC');
        (0, code_1.expect)(G('upper(AbC)')).equal('ABC');
    });
    (0, node_test_1.test)('upper-expr', () => {
        (0, code_1.expect)(G('upper(a)+b')).equal('Ab');
        (0, code_1.expect)(G('c+upper(d)')).equal('cD');
        (0, code_1.expect)(G('(upper(e))')).equal('E');
        (0, code_1.expect)(G('(upper(fg)+h)')).equal('FGh');
        (0, code_1.expect)(G('upper(i)+upper(j)')).equal('IJ');
    });
    (0, node_test_1.test)('upper-deep', () => {
        (0, code_1.expect)(G('x:upper(a)')).equal({ x: 'A' });
        (0, code_1.expect)(G('x:{y:upper(b)}')).equal({ x: { y: 'B' } });
        (0, code_1.expect)(G('[upper(c)]')).equal(['C']);
        (0, code_1.expect)(G('[x,upper(d)]')).equal(['x', 'D']);
        (0, code_1.expect)(G('x:{y:[upper(e)]}')).equal({ x: { y: ['E'] } });
    });
    (0, node_test_1.test)('upper-path', () => {
        (0, code_1.expect)(G('x:foo y:upper($.x)')).equal({ x: 'foo', y: 'FOO' });
        (0, code_1.expect)(G('x:{a:bar} y:upper($.x.a)')).equal({ x: { a: 'bar' }, y: 'BAR' });
        (0, code_1.expect)(G('x:baz y:{z:upper($.x)}')).equal({ x: 'baz', y: { z: 'BAZ' } });
    });
    (0, node_test_1.test)('upper-spread', () => {
        (0, code_1.expect)(G('a:{&:x:upper(foo)} a:{b:{y:1}}')).equal({ a: { b: { x: 'FOO', y: 1 } } });
        (0, code_1.expect)(G('a:{&:x:upper(bar)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 'BAR', y: 1 }, c: { x: 'BAR', y: 2 } } });
        (0, code_1.expect)(G('a:{&:z:upper(qux)} a:{b:{y:1}}')).equal({ a: { b: { z: 'QUX', y: 1 } } });
    });
    (0, node_test_1.test)('upper-pref', () => {
        (0, code_1.expect)(G('x:*upper(foo)')).equal({ x: 'FOO' });
    });
    (0, node_test_1.test)('lower-basic', () => {
        (0, code_1.expect)(G('lower(A)')).equal('a');
        (0, code_1.expect)(G('lower(ABC)')).equal('abc');
        (0, code_1.expect)(G('lower(abc)')).equal('abc');
        (0, code_1.expect)(G('lower(AbC)')).equal('abc');
    });
    (0, node_test_1.test)('lower-expr', () => {
        (0, code_1.expect)(G('lower(A)+B')).equal('aB');
        (0, code_1.expect)(G('C+lower(D)')).equal('Cd');
        (0, code_1.expect)(G('(lower(E))')).equal('e');
        (0, code_1.expect)(G('(lower(FG)+H)')).equal('fgH');
        (0, code_1.expect)(G('lower(I)+lower(J)')).equal('ij');
    });
    (0, node_test_1.test)('lower-deep', () => {
        (0, code_1.expect)(G('x:lower(A)')).equal({ x: 'a' });
        (0, code_1.expect)(G('x:{y:lower(B)}')).equal({ x: { y: 'b' } });
        (0, code_1.expect)(G('[lower(C)]')).equal(['c']);
        (0, code_1.expect)(G('[x,lower(D)]')).equal(['x', 'd']);
        (0, code_1.expect)(G('x:{y:[lower(E)]}')).equal({ x: { y: ['e'] } });
    });
    (0, node_test_1.test)('lower-path', () => {
        (0, code_1.expect)(G('x:FOO y:lower($.x)')).equal({ x: 'FOO', y: 'foo' });
        (0, code_1.expect)(G('x:{a:BAR} y:lower($.x.a)')).equal({ x: { a: 'BAR' }, y: 'bar' });
        (0, code_1.expect)(G('x:BAZ y:{z:lower($.x)}')).equal({ x: 'BAZ', y: { z: 'baz' } });
    });
    (0, node_test_1.test)('lower-spread', () => {
        (0, code_1.expect)(G('a:{&:x:lower(FOO)} a:{b:{y:1}}')).equal({ a: { b: { x: 'foo', y: 1 } } });
        (0, code_1.expect)(G('a:{&:x:lower(BAR)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 'bar', y: 1 }, c: { x: 'bar', y: 2 } } });
        (0, code_1.expect)(G('a:{&:z:lower(QUX)} a:{b:{y:1}}')).equal({ a: { b: { z: 'qux', y: 1 } } });
    });
    (0, node_test_1.test)('lower-pref', () => {
        (0, code_1.expect)(G('x:*lower(FOO)')).equal({ x: 'foo' });
    });
    (0, node_test_1.test)('copy-basic', () => {
        (0, code_1.expect)(G('copy(1)')).equal(1);
        (0, code_1.expect)(G('copy(a)')).equal('a');
        (0, code_1.expect)(G('copy(true)')).equal(true);
        (0, code_1.expect)(G('copy({x:1})')).equal({ x: 1 });
        (0, code_1.expect)(G('copy([1,2])')).equal([1, 2]);
    });
    (0, node_test_1.test)('copy-expr', () => {
        (0, code_1.expect)(G('copy(1)+2')).equal(3);
        (0, code_1.expect)(G('2+copy(3)')).equal(5);
        (0, code_1.expect)(G('(copy(4))')).equal(4);
        (0, code_1.expect)(G('(copy(5)+1)')).equal(6);
        (0, code_1.expect)(G('copy(a)+copy(b)')).equal('ab');
    });
    (0, node_test_1.test)('copy-deep', () => {
        (0, code_1.expect)(G('x:copy(1)')).equal({ x: 1 });
        (0, code_1.expect)(G('x:{y:copy(2)}')).equal({ x: { y: 2 } });
        (0, code_1.expect)(G('[copy(3)]')).equal([3]);
        (0, code_1.expect)(G('[x,copy(4)]')).equal(['x', 4]);
        (0, code_1.expect)(G('x:{y:[copy(5)]}')).equal({ x: { y: [5] } });
    });
    (0, node_test_1.test)('copy-path', () => {
        (0, code_1.expect)(G('x:1 y:copy($.x)')).equal({ x: 1, y: 1 });
        (0, code_1.expect)(G('x:{a:2} y:copy($.x.a)')).equal({ x: { a: 2 }, y: 2 });
        (0, code_1.expect)(G('x:3 y:{z:copy($.x)}')).equal({ x: 3, y: { z: 3 } });
        (0, code_1.expect)(G('x:{a:1,b:2} y:copy($.x)')).equal({ x: { a: 1, b: 2 }, y: { a: 1, b: 2 } });
        (0, code_1.expect)(G('x:[1,2,3] y:copy($.x)')).equal({ x: [1, 2, 3], y: [1, 2, 3] });
    });
    (0, node_test_1.test)('copy-spread', () => {
        (0, code_1.expect)(G('a:{&:x:copy(1)} a:{b:{y:2}}')).equal({ a: { b: { x: 1, y: 2 } } });
        (0, code_1.expect)(G('a:{&:x:copy(3)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 3, y: 1 }, c: { x: 3, y: 2 } } });
        (0, code_1.expect)(G('a:{&:z:copy(5)} a:{b:{y:1}}')).equal({ a: { b: { z: 5, y: 1 } } });
    });
    (0, node_test_1.test)('key-basic', () => {
        (0, code_1.expect)(G('a:b:c:key()')).equal({ a: { b: { c: 'b' } } });
        (0, code_1.expect)(G('a:b:key()')).equal({ a: { b: 'a' } });
        (0, code_1.expect)(G('a:key()')).equal({ a: '' });
        (0, code_1.expect)(G('key()')).equal('');
        (0, code_1.expect)(G('key() & string')).equal('');
        (0, code_1.expect)(G('key() & *a|string')).equal('');
        (0, code_1.expect)(G('key() & number')).equal(undefined);
        (0, code_1.expect)(G('a:b:c:key(0)')).equal({ a: { b: { c: 'c' } } });
        (0, code_1.expect)(G('a:b:c:key(1)')).equal({ a: { b: { c: 'b' } } });
        (0, code_1.expect)(G('a:b:c:key(2)')).equal({ a: { b: { c: 'a' } } });
        (0, code_1.expect)(G('a:b:c:key(3)')).equal({ a: { b: { c: '' } } });
        (0, code_1.expect)(G('a:b:c:key(4)')).equal({ a: { b: { c: '' } } });
        (0, code_1.expect)(G('a:b:c:key(-1)')).equal({ a: { b: { c: '' } } });
        (0, code_1.expect)(G('a:b:c:key(-2)')).equal({ a: { b: { c: '' } } });
    });
    (0, node_test_1.test)('key-unify', () => {
        const a0 = new __1.AontuX();
        const G = a0.generate.bind(a0);
        (0, code_1.expect)(G('key()&""')).equal('');
        (0, code_1.expect)(G('a:key()&""')).equal({ a: '' });
        (0, code_1.expect)(() => G('key()&"x"')).throw(/scalar/);
        (0, code_1.expect)(() => G('a:key()&"x"')).throw(/scalar/);
        (0, code_1.expect)(G('x:a:key()&"x"')).equal({ x: { a: 'x' } });
        (0, code_1.expect)(G('x:a:key()&key()')).equal({ x: { a: 'x' } });
        (0, code_1.expect)(G('x:a:key()|key()')).equal({ x: { a: 'x' } });
    });
    (0, node_test_1.test)('key-expr', () => {
        const a0 = new __1.AontuX();
        const G = a0.generate.bind(a0);
        (0, code_1.expect)(G('key()+B')).equal('B');
        (0, code_1.expect)(G('C+key()')).equal('C');
        (0, code_1.expect)(G('D+key()+E')).equal('DE');
        (0, code_1.expect)(G('(key())')).equal('');
        (0, code_1.expect)(G('(J+key())')).equal('J');
        (0, code_1.expect)(G('(key()+H)')).equal('H');
        (0, code_1.expect)(G('(J+key()+H)')).equal('JH');
        (0, code_1.expect)(G('key()')).equal('');
        (0, code_1.expect)(G('(key())')).equal('');
        (0, code_1.expect)(G('key()+key()')).equal('');
        (0, code_1.expect)(G('(key()+key())')).equal('');
        (0, code_1.expect)(G('key()+key()+key()')).equal('');
        (0, code_1.expect)(G('(key()+key()+key())')).equal('');
        (0, code_1.expect)(G('((key()))')).equal('');
        (0, code_1.expect)(G('(key()+key())')).equal('');
        (0, code_1.expect)(G('((key()+key()))')).equal('');
        (0, code_1.expect)(G('(key()+key()+key())')).equal('');
        (0, code_1.expect)(G('((key()+key()+key()))')).equal('');
        (0, code_1.expect)(G('AA+(key())')).equal('AA');
        (0, code_1.expect)(G('(key())+BB')).equal('BB');
        (0, code_1.expect)(G('AA+(key())+BB')).equal('AABB');
        (0, code_1.expect)(G('a:key()+B')).equal({ a: 'B' });
        (0, code_1.expect)(G('a:C+key()')).equal({ a: 'C' });
        (0, code_1.expect)(G('a:(key())')).equal({ a: '' });
        (0, code_1.expect)(G('a:(J+key())')).equal({ a: 'J' });
        (0, code_1.expect)(G('a:(key()+H)')).equal({ a: 'H' });
        (0, code_1.expect)(G('a:(J+key()+H)')).equal({ a: 'JH' });
        (0, code_1.expect)(G('a:key()+key()')).equal({ a: '' });
        (0, code_1.expect)(G('a:(key()+key())')).equal({ a: '' });
        (0, code_1.expect)(G('a:b:key()')).equal({ a: { b: 'a' } });
        (0, code_1.expect)(G('a:b:key()+B')).equal({ a: { b: 'aB' } });
        (0, code_1.expect)(G('a:b:C+key()')).equal({ a: { b: 'Ca' } });
        (0, code_1.expect)(G('a:b:(key())')).equal({ a: { b: 'a' } });
        (0, code_1.expect)(G('a:b:(J+key())')).equal({ a: { b: 'Ja' } });
        (0, code_1.expect)(G('a:b:(key()+H)')).equal({ a: { b: 'aH' } });
        (0, code_1.expect)(G('a:b:(J+key()+H)')).equal({ a: { b: 'JaH' } });
        (0, code_1.expect)(G('a:b:key()+key()')).equal({ a: { b: 'aa' } });
        (0, code_1.expect)(G('a:b:(key()+key())')).equal({ a: { b: 'aa' } });
    });
    /*
    test('key-deep', () => {
      expect(G('x:key(A)')).equal({ x: 'a' })
      expect(G('x:{y:key(B)}')).equal({ x: { y: 'b' } })
      expect(G('[key(C)]')).equal(['c'])
      expect(G('[x,key(D)]')).equal(['x', 'd'])
      expect(G('x:{y:[key(E)]}')).equal({ x: { y: ['e'] } })
    })
  
    test('key-path', () => {
      expect(G('x:FOO y:key($.x)')).equal({ x: 'FOO', y: 'foo' })
      expect(G('x:{a:BAR} y:key($.x.a)')).equal({ x: { a: 'BAR' }, y: 'bar' })
      expect(G('x:BAZ y:{z:key($.x)}')).equal({ x: 'BAZ', y: { z: 'baz' } })
    })
  
    test('key-pref', () => {
      expect(G('x:FOO y:key($.x)')).equal({ x: 'FOO', y: 'foo' })
      expect(G('x:{a:BAR} y:key($.x.a)')).equal({ x: { a: 'BAR' }, y: 'bar' })
      expect(G('x:BAZ y:{z:key($.x)}')).equal({ x: 'BAZ', y: { z: 'baz' } })
    })
    
    test('key-spread', () => {
      expect(G('a:{&:x:key(FOO)} a:{b:{y:1}}')).equal({ a: { b: { x: 'foo', y: 1 } } })
      expect(G('a:{&:x:key(BAR)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 'bar', y: 1 }, c: { x: 'bar', y: 2 } } })
      expect(G('a:{&:z:key(QUX)} a:{b:{y:1}}')).equal({ a: { b: { z: 'qux', y: 1 } } })
    })
    */
});
//# sourceMappingURL=func.test.js.map