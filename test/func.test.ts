/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */

import { describe, test } from 'node:test'

import { expect } from '@hapi/code'

import {
  AontuX
} from '..'

import {
  Context,
  Unify,
} from '../dist/unify'


import {
  Lang
} from '../dist/lang'


import { MapVal } from '../dist/val/MapVal'


let lang = new Lang()

const G = (x: string, ctx?: any) => new Unify(x, lang)
  .res.gen(ctx || new Context({ root: new MapVal({ peg: {} }) }))


describe('func', function() {

  test('lower-numbers', () => {
    expect(G('lower(1.1)')).equal(1)
    expect(G('lower(1.9)')).equal(1)
    expect(G('lower(2.0)')).equal(2)
    expect(G('lower(-1.1)')).equal(-2)
    expect(G('lower(-1.9)')).equal(-2)
  })

  test('lower-numbers-expr', () => {
    expect(G('lower(1.1)+2')).equal(3)
    expect(G('2+lower(1.9)')).equal(3)
    expect(G('(lower(1.5))')).equal(1)
    expect(G('lower(2.7)+1')).equal(3)
    expect(G('1+lower(2.7)')).equal(3)
    expect(G('1+lower(2.7)+1')).equal(4)
    expect(G('(lower(2.7)+1)')).equal(3)
    expect(G('(1+lower(2.7))')).equal(3)
    expect(G('(1+lower(2.7)+1)')).equal(4)
    expect(G('lower(1.1)+lower(2.9)')).equal(3)
  })

  test('lower-numbers-deep', () => {
    expect(G('x:lower(1.1)')).equal({ x: 1 })
    expect(G('x:{y:lower(2.9)}')).equal({ x: { y: 2 } })
    expect(G('[lower(1.1)]')).equal([1])
    expect(G('[x,lower(2.9)]')).equal(['x', 2])
    expect(G('x:{y:[lower(3.9)]}')).equal({ x: { y: [3] } })
  })

  test('lower-numbers-path', () => {
    expect(G('x:1.5 y:lower($.x)')).equal({ x: 1.5, y: 1 })
    expect(G('x:3.9 y:{z:lower($.x)}')).equal({ x: 3.9, y: { z: 3 } })
    expect(G('a:2.7 y:lower($.a)')).equal({ a: 2.7, y: 2 })
    expect(G('x:{a:2.7} y:$.x.a')).equal({ x: { a: 2.7 }, y: 2.7 })
    expect(G('x:3 y:($.x)')).equal({ x: 3, y: 3 })
    expect(G('x:{a:5} y:(x.a)')).equal({ x: { a: 5 }, y: 5 })
    expect(G('z:x:{a:6} z:y:(.x.a)')).equal({ z: { x: { a: 6 }, y: 6 } })
    expect(G('z:x:{a:6} z:y:(x.a)')).equal({ z: { x: { a: 6 }, y: 6 } })
    expect(G('x:{a:4} y:(.x.a)')).equal({ x: { a: 4 }, y: 4 })
    expect(G('x:{a:3} y:($.x.a)')).equal({ x: { a: 3 }, y: 3 })
    expect(G('x:{a:2.7} y:lower($.x.a)')).equal({ x: { a: 2.7 }, y: 2 })
    expect(G('x:(1)')).equal({ x: 1 })
    expect(G('x:(+2)')).equal({ x: 2 })
    expect(G('x:(3+4)')).equal({ x: 7 })
    expect(G('x:(+3+4)')).equal({ x: 7 })
    expect(G('x:(5+6+7)')).equal({ x: 18 })
    expect(G('x:(+5+6+7)')).equal({ x: 18 })
  })

  test('lower-numbers-spread', () => {
    expect(G('a:{&:x:lower(1.1)} a:{b:{y:1}}')).equal({ a: { b: { x: 1, y: 1 } } })
    expect(G('a:{&:x:lower(2.9)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 2, y: 1 }, c: { x: 2, y: 2 } } })
    expect(G('a:{&:z:lower(3.5)} a:{b:{y:1}}')).equal({ a: { b: { z: 3, y: 1 } } })
  })

  test('lower-numbers-pref', () => {
    expect(G('x:*lower(1.1)')).equal({ x: 1 })
  })


  test('upper-numbers', () => {
    expect(G('upper(1.1)')).equal(2)
    expect(G('upper(1.9)')).equal(2)
    expect(G('upper(2.0)')).equal(2)
    expect(G('upper(-1.1)')).equal(-1)
    expect(G('upper(-1.9)')).equal(-1)
  })

  test('upper-numbers-expr', () => {
    expect(G('upper(1.1)+2')).equal(4)
    expect(G('2+upper(1.9)')).equal(4)
    expect(G('(upper(1.5))')).equal(2)
    expect(G('(upper(2.1)+1)')).equal(4)
    expect(G('upper(1.1)+upper(2.1)')).equal(5)
  })

  test('upper-numbers-deep', () => {
    expect(G('x:upper(1.1)')).equal({ x: 2 })
    expect(G('x:{y:upper(2.1)}')).equal({ x: { y: 3 } })
    expect(G('[upper(1.1)]')).equal([2])
    expect(G('[x,upper(2.1)]')).equal(['x', 3])
    expect(G('x:{y:[upper(3.1)]}')).equal({ x: { y: [4] } })
  })

  test('upper-numbers-path', () => {
    expect(G('x:1.5 y:upper($.x)')).equal({ x: 1.5, y: 2 })
    expect(G('x:{a:2.3} y:upper($.x.a)')).equal({ x: { a: 2.3 }, y: 3 })
    expect(G('x:3.1 y:{z:upper($.x)}')).equal({ x: 3.1, y: { z: 4 } })
  })

  test('upper-numbers-spread', () => {
    expect(G('a:{&:x:upper(1.1)} a:{b:{y:1}}')).equal({ a: { b: { x: 2, y: 1 } } })
    expect(G('a:{&:x:upper(2.1)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 3, y: 1 }, c: { x: 3, y: 2 } } })
    expect(G('a:{&:z:upper(3.5)} a:{b:{y:1}}')).equal({ a: { b: { z: 4, y: 1 } } })
  })


  test('upper-basic', () => {
    expect(G('upper(a)')).equal('A')
    expect(G('upper(abc)')).equal('ABC')
    expect(G('upper(ABC)')).equal('ABC')
    expect(G('upper(AbC)')).equal('ABC')
  })

  test('upper-expr', () => {
    expect(G('upper(a)+b')).equal('Ab')
    expect(G('c+upper(d)')).equal('cD')
    expect(G('(upper(e))')).equal('E')
    expect(G('(upper(fg)+h)')).equal('FGh')
    expect(G('upper(i)+upper(j)')).equal('IJ')
  })

  test('upper-deep', () => {
    expect(G('x:upper(a)')).equal({ x: 'A' })
    expect(G('x:{y:upper(b)}')).equal({ x: { y: 'B' } })
    expect(G('[upper(c)]')).equal(['C'])
    expect(G('[x,upper(d)]')).equal(['x', 'D'])
    expect(G('x:{y:[upper(e)]}')).equal({ x: { y: ['E'] } })
  })

  test('upper-path', () => {
    expect(G('x:foo y:upper($.x)')).equal({ x: 'foo', y: 'FOO' })
    expect(G('x:{a:bar} y:upper($.x.a)')).equal({ x: { a: 'bar' }, y: 'BAR' })
    expect(G('x:baz y:{z:upper($.x)}')).equal({ x: 'baz', y: { z: 'BAZ' } })
  })

  test('upper-spread', () => {
    expect(G('a:{&:x:upper(foo)} a:{b:{y:1}}')).equal({ a: { b: { x: 'FOO', y: 1 } } })
    expect(G('a:{&:x:upper(bar)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 'BAR', y: 1 }, c: { x: 'BAR', y: 2 } } })
    expect(G('a:{&:z:upper(qux)} a:{b:{y:1}}')).equal({ a: { b: { z: 'QUX', y: 1 } } })
  })

  test('upper-pref', () => {
    expect(G('x:*upper(foo)')).equal({ x: 'FOO' })
  })


  test('lower-basic', () => {
    expect(G('lower(A)')).equal('a')
    expect(G('lower(ABC)')).equal('abc')
    expect(G('lower(abc)')).equal('abc')
    expect(G('lower(AbC)')).equal('abc')
  })

  test('lower-expr', () => {
    expect(G('lower(A)+B')).equal('aB')
    expect(G('C+lower(D)')).equal('Cd')
    expect(G('(lower(E))')).equal('e')
    expect(G('(lower(FG)+H)')).equal('fgH')
    expect(G('lower(I)+lower(J)')).equal('ij')
  })

  test('lower-deep', () => {
    expect(G('x:lower(A)')).equal({ x: 'a' })
    expect(G('x:{y:lower(B)}')).equal({ x: { y: 'b' } })
    expect(G('[lower(C)]')).equal(['c'])
    expect(G('[x,lower(D)]')).equal(['x', 'd'])
    expect(G('x:{y:[lower(E)]}')).equal({ x: { y: ['e'] } })
  })

  test('lower-path', () => {
    expect(G('x:FOO y:lower($.x)')).equal({ x: 'FOO', y: 'foo' })
    expect(G('x:{a:BAR} y:lower($.x.a)')).equal({ x: { a: 'BAR' }, y: 'bar' })
    expect(G('x:BAZ y:{z:lower($.x)}')).equal({ x: 'BAZ', y: { z: 'baz' } })
  })

  test('lower-spread', () => {
    expect(G('a:{&:x:lower(FOO)} a:{b:{y:1}}')).equal({ a: { b: { x: 'foo', y: 1 } } })
    expect(G('a:{&:x:lower(BAR)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 'bar', y: 1 }, c: { x: 'bar', y: 2 } } })
    expect(G('a:{&:z:lower(QUX)} a:{b:{y:1}}')).equal({ a: { b: { z: 'qux', y: 1 } } })
  })

  test('lower-pref', () => {
    expect(G('x:*lower(FOO)')).equal({ x: 'foo' })
  })


  test('copy-basic', () => {
    expect(G('copy(1)')).equal(1)
    expect(G('copy(a)')).equal('a')
    expect(G('copy(true)')).equal(true)
    expect(G('copy({x:1})')).equal({ x: 1 })
    expect(G('copy([1,2])')).equal([1, 2])
  })

  test('copy-expr', () => {
    expect(G('copy(1)+2')).equal(3)
    expect(G('2+copy(3)')).equal(5)
    expect(G('(copy(4))')).equal(4)
    expect(G('(copy(5)+1)')).equal(6)
    expect(G('copy(a)+copy(b)')).equal('ab')
  })

  test('copy-deep', () => {
    expect(G('x:copy(1)')).equal({ x: 1 })
    expect(G('x:{y:copy(2)}')).equal({ x: { y: 2 } })
    expect(G('[copy(3)]')).equal([3])
    expect(G('[x,copy(4)]')).equal(['x', 4])
    expect(G('x:{y:[copy(5)]}')).equal({ x: { y: [5] } })
  })

  test('copy-path', () => {
    expect(G('x:1 y:copy($.x)')).equal({ x: 1, y: 1 })
    expect(G('x:{a:2} y:copy($.x.a)')).equal({ x: { a: 2 }, y: 2 })
    expect(G('x:3 y:{z:copy($.x)}')).equal({ x: 3, y: { z: 3 } })
    expect(G('x:{a:1,b:2} y:copy($.x)')).equal({ x: { a: 1, b: 2 }, y: { a: 1, b: 2 } })
    expect(G('x:[1,2,3] y:copy($.x)')).equal({ x: [1, 2, 3], y: [1, 2, 3] })
  })

  test('copy-spread', () => {
    expect(G('a:{&:x:copy(1)} a:{b:{y:2}}')).equal({ a: { b: { x: 1, y: 2 } } })
    expect(G('a:{&:x:copy(3)} a:{b:{y:1},c:{y:2}}')).equal({ a: { b: { x: 3, y: 1 }, c: { x: 3, y: 2 } } })
    expect(G('a:{&:z:copy(5)} a:{b:{y:1}}')).equal({ a: { b: { z: 5, y: 1 } } })
  })


  test('key-basic', () => {
    expect(G('a:b:c:key()')).equal({ a: { b: { c: 'b' } } })
    expect(G('a:b:key()')).equal({ a: { b: 'a' } })
    expect(G('a:key()')).equal({ a: '' })
    expect(G('key()')).equal('')

    expect(G('key() & string')).equal('')
    expect(G('key() & *a|string')).equal('')
    expect(G('key() & number')).equal(undefined)

    expect(G('a:b:c:key(0)')).equal({ a: { b: { c: 'c' } } })
    expect(G('a:b:c:key(1)')).equal({ a: { b: { c: 'b' } } })
    expect(G('a:b:c:key(2)')).equal({ a: { b: { c: 'a' } } })
    expect(G('a:b:c:key(3)')).equal({ a: { b: { c: '' } } })
    expect(G('a:b:c:key(4)')).equal({ a: { b: { c: '' } } })
    expect(G('a:b:c:key(-1)')).equal({ a: { b: { c: '' } } })
    expect(G('a:b:c:key(-2)')).equal({ a: { b: { c: '' } } })
  })


  test('key-unify', () => {
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    expect(G('key()&""')).equal('')
    expect(G('a:key()&""')).equal({ a: '' })
    expect(() => G('key()&"x"')).throw(/scalar/)
    expect(() => G('a:key()&"x"')).throw(/scalar/)
    expect(G('x:a:key()&"x"')).equal({ x: { a: 'x' } })
    expect(G('x:a:key()&key()')).equal({ x: { a: 'x' } })
    expect(G('x:a:key()|key()')).equal({ x: { a: 'x' } })
  })


  test('key-expr', () => {
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    expect(G('key()+B')).equal('B')
    expect(G('C+key()')).equal('C')
    expect(G('D+key()+E')).equal('DE')
    expect(G('(key())')).equal('')
    expect(G('(J+key())')).equal('J')
    expect(G('(key()+H)')).equal('H')
    expect(G('(J+key()+H)')).equal('JH')

    expect(G('key()')).equal('')
    expect(G('(key())')).equal('')
    expect(G('key()+key()')).equal('')
    expect(G('(key()+key())')).equal('')
    expect(G('key()+key()+key()')).equal('')
    expect(G('(key()+key()+key())')).equal('')

    expect(G('((key()))')).equal('')
    expect(G('(key()+key())')).equal('')
    expect(G('((key()+key()))')).equal('')
    expect(G('(key()+key()+key())')).equal('')
    expect(G('((key()+key()+key()))')).equal('')

    expect(G('AA+(key())')).equal('AA')
    expect(G('(key())+BB')).equal('BB')
    expect(G('AA+(key())+BB')).equal('AABB')

    expect(G('a:key()+B')).equal({ a: 'B' })
    expect(G('a:C+key()')).equal({ a: 'C' })
    expect(G('a:(key())')).equal({ a: '' })
    expect(G('a:(J+key())')).equal({ a: 'J' })
    expect(G('a:(key()+H)')).equal({ a: 'H' })
    expect(G('a:(J+key()+H)')).equal({ a: 'JH' })
    expect(G('a:key()+key()')).equal({ a: '' })
    expect(G('a:(key()+key())')).equal({ a: '' })

    expect(G('a:b:key()')).equal({ a: { b: 'a' } })
    expect(G('a:b:key()+B')).equal({ a: { b: 'aB' } })
    expect(G('a:b:C+key()')).equal({ a: { b: 'Ca' } })
    expect(G('a:b:(key())')).equal({ a: { b: 'a' } })
    expect(G('a:b:(J+key())')).equal({ a: { b: 'Ja' } })
    expect(G('a:b:(key()+H)')).equal({ a: { b: 'aH' } })
    expect(G('a:b:(J+key()+H)')).equal({ a: { b: 'JaH' } })
    expect(G('a:b:key()+key()')).equal({ a: { b: 'aa' } })
    expect(G('a:b:(key()+key())')).equal({ a: { b: 'aa' } })
  })


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


  test('pref-basic', () => {
    expect(G('pref(1)')).equal(1)
    expect(G('pref(abc)')).equal('abc')
    expect(G('pref(true)')).equal(true)
    expect(G('pref({x:1})')).equal({ x: 1 })
    expect(G('pref([1,2])')).equal([1, 2])
  })

  test('pref-canon', () => {
    // Test canonical representation shows preference wrapping
    const N = (x: string, ctx?: any) => new Unify(x, lang)
      .res.canon

    expect(N('pref(1)')).equal('*1')
    expect(N('pref(foo)')).equal('*"foo"')
    expect(N('pref({x:1})')).equal('{"x":*1}')
    expect(N('pref([1,2])')).equal('[*1,*2]')
    expect(N('pref({x:{y:1}})')).equal('{"x":{"y":*1}}')
  })

  test('pref-wrapping', () => {
    // Test that pref() wraps values in PrefVal
    expect(G('pref(1) & number')).equal(1)
    expect(G('pref(foo) & string')).equal('foo')
    expect(G('number & pref(2)')).equal(2)
    expect(G('string & pref(bar)')).equal('bar')
  })

  test('pref-deep-structure', () => {
    expect(G('pref({x:{y:1}})')).equal({ x: { y: 1 } })
    expect(G('pref([{a:1},{b:2}])')).equal([{ a: 1 }, { b: 2 }])
    expect(G('pref({x:[1,{y:2}]})')).equal({ x: [1, { y: 2 }] })
  })

  test('pref-double-wrap', () => {
    const N = (x: string, ctx?: any) => new Unify(x, lang)
      .res.canon

    // Test double-wrapping behavior in canon
    expect(N('pref(pref(1))')).equal('**1')
    expect(N('pref(pref({x:1}))')).equal('{"x":**1}')
    expect(N('pref(pref([1,2]))')).equal('[**1,**2]')

    // Test double-wrapping behavior in generation
    expect(G('pref(pref(1))')).equal(1)
    expect(G('pref(pref({x:1}))')).equal({ x: 1 })
    expect(G('pref(pref([1,2]))')).equal([1, 2])
  })

  test('pref-unification', () => {
    // Test preference behavior in unification
    expect(G('pref(1) & 1')).equal(1)
    expect(G('pref(foo) & foo')).equal('foo')
    expect(G('pref({x:1}) & {x:1}')).equal({ x: 1 })
    expect(G('pref({x:1}) & {x:number}')).equal({ x: 1 })
  })

  test('pref-expr', () => {
    expect(G('pref(1)+2')).equal(3)
    expect(G('2+pref(3)')).equal(5)
    expect(G('(pref(4))')).equal(4)
    expect(G('(pref(5)+1)')).equal(6)
    expect(G('pref(a)+pref(b)')).equal('ab')
  })

  test('pref-path', () => {
    expect(G('x:1 y:pref($.x)')).equal({ x: 1, y: 1 })
    expect(G('x:{a:2} y:pref($.x.a)')).equal({ x: { a: 2 }, y: 2 })
    expect(G('x:3 y:{z:pref($.x)}')).equal({ x: 3, y: { z: 3 } })
    expect(G('x:{a:1,b:2} y:pref($.x)')).equal({ x: { a: 1, b: 2 }, y: { a: 1, b: 2 } })
  })


  test('close-basic', () => {
    expect(G('close({x:1})')).equal({ x: 1 })
    expect(G('close([1,2])')).equal([1, 2])
    expect(G('close(42)')).equal(42)
    expect(G('close(hello)')).equal('hello')
    expect(G('close(true)')).equal(true)
  })

  test('close-functionality', () => {
    // Test that close() prevents additional properties from being unified
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    expect(() => G('close({x:1}) & {y:2}')).throw(/closed/)
    expect(() => G('close([1,2]) & [3,4,5]')).throw(/closed/)
    expect(G('close({x:1}) & {x:1}')).equal({ x: 1 })
    expect(G('close({x:1}) & {x:number}')).equal({ x: 1 })
  })

  /*  
    test('close-expr', () => {
      expect(G('close({x:1}).x')).equal(1)
      expect(G('close([1,2])[0]')).equal(1)
    })
  */

  test('close-path', () => {
    expect(G('x:{a:1} y:close($.x)')).equal({ x: { a: 1 }, y: { a: 1 } })
    expect(G('x:[1,2] y:close($.x)')).equal({ x: [1, 2], y: [1, 2] })
  })


  test('open-basic', () => {
    expect(G('open({x:1})')).equal({ x: 1 })
    expect(G('open([1,2])')).equal([1, 2])
    expect(G('open(42)')).equal(42)
    expect(G('open(hello)')).equal('hello')
    expect(G('open(true)')).equal(true)
  })

  /*
  test('open-functionality', () => {
    // Test that open() allows additional properties to be unified
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    expect(G('open({x:1}) & {y:2}')).equal({ x: 1, y: 2 })
    expect(G('open([1,2]) & [3,4,5]')).equal([3, 4, 5])
    expect(G('open({x:1}) & {x:number}')).equal({ x: 1 })
  })
  */

  test('open-close-interaction', () => {
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    // Test opening a previously closed object
    expect(G('open(close({x:1})) & {y:2}')).equal({ x: 1, y: 2 })
    // expect(G('close(open({x:1})) & {y:2}')).throw(/closed/)
  })

  /*
    test('type-basic', () => {
      expect(G('type(1)')).equal(1)
      expect(G('type(hello)')).equal('hello')
      expect(G('type(true)')).equal(true)
      expect(G('type({x:1})')).equal({ x: 1 })
      expect(G('type([1,2])')).equal([1, 2])
    })
  */

  test('type-functionality', () => {
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    // type() should mark values as type constraints
    expect(G('type(1) & number')).equal(1)
    expect(G('type(hello) & string')).equal('hello')
    expect(G('type(true) & boolean')).equal(true)
    expect(G('number & type(42)')).equal(42)
    expect(G('string & type(world)')).equal('world')
  })

  test('type-canon', () => {
    // Test canonical representation shows type wrapping
    const N = (x: string, ctx?: any) => new Unify(x, lang)
      .res.canon

    expect(N('type(1)')).equal('type(1)')
    expect(N('type(foo)')).equal('type("foo")')
    expect(N('type({x:1})')).equal('type({"x":1})')
    expect(N('type([1,2])')).equal('type([1,2])')
  })

  /*
  test('type-complex', () => {
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    expect(G('type({x:number}) & {x:42}')).equal({ x: 42 })
    expect(G('type([string]) & [hello]')).equal(['hello'])
    expect(G('type({x:{y:number}}) & {x:{y:5}}')).equal({ x: { y: 5 } })
  })
*/

  test('super-basic', () => {
    // super() returns the superior type of the current context
    // These tests may need adjustment based on the actual superior() implementation
    expect(G('super()')).equal(undefined) // TOP has no superior
  })

  test('super-functionality', () => {
    // super() should return the superior type in type hierarchies
    // The exact behavior depends on the superior() implementation in the Val classes
    const a0 = new AontuX()
    const G = a0.generate.bind(a0)

    // These tests may need to be adjusted based on actual behavior
    expect(G('super()')).equal(undefined)
  })

})
