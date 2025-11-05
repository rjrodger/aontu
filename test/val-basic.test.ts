/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */


import { describe, it, beforeEach } from 'node:test'

import {
  Aontu
} from '..'

import {
  SPREAD
} from '../dist/type'

import {
  Lang
} from '../dist/lang'

import {
  Unify,
} from '../dist/unify'

import {
  AontuContext,
} from '../dist/ctx'

import { expect } from '@hapi/code'
import {
  unite
} from '../dist/unify'


import { ConjunctVal } from '../dist/val/ConjunctVal'
import { DisjunctVal } from '../dist/val/DisjunctVal'
import { ListVal } from '../dist/val/ListVal'
import { MapVal } from '../dist/val/MapVal'
import { NilVal } from '../dist/val/NilVal'
import { PrefVal } from '../dist/val/PrefVal'
import { RefVal } from '../dist/val/RefVal'
import { VarVal } from '../dist/val/VarVal'

import { NumberVal } from '../dist/val/NumberVal'
import { StringVal } from '../dist/val/StringVal'
import { BooleanVal } from '../dist/val/BooleanVal'
import { IntegerVal } from '../dist/val/IntegerVal'
import { NullVal } from '../dist/val/NullVal'
import { ScalarKindVal, Integer } from '../dist/val/ScalarKindVal'


import {
  top
} from '../dist/val/valutil'

const TOP = top()


const lang = new Lang()
const PL = lang.parse.bind(lang)
const P = (x: string, ctx?: any) => PL(x, ctx)
const PA = (x: string[], ctx?: any) => x.map(s => PL(s, ctx))
// const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r))?.canon
const GC = (x: string, ctx?: any) => new Unify(x, undefined, ctx).res.gen(ctx)


const N = (x: string, ctx?: any) => new Unify(x, lang).res.canon
const A = new Aontu()
const G = (s: string, ctx?: any) => A.generate(s)



const makeSK_String = () => new ScalarKindVal({ peg: String })
const makeSK_Number = () => new ScalarKindVal({ peg: Number })
const makeSK_Integer = () => new ScalarKindVal({ peg: Integer })
const makeSK_Boolean = () => new ScalarKindVal({ peg: Boolean })

const makeBooleanVal = (v: boolean) => new BooleanVal({ peg: v })
const makeNumberVal = (v: number, c?: AontuContext) => new NumberVal({ peg: v }, c)
const makeIntegerVal = (v: number, c?: AontuContext) => new IntegerVal({ peg: v }, c)



describe('val-basic', function() {

  beforeEach(() => {
    global.console = require('console')
  })

  it('canon', () => {
    expect(P('1').canon).equal('1')
    expect(P('"a"').canon).equal('"a"')
    expect(P('b').canon).equal('"b"')
    expect(P('true').canon).equal('true')
    expect(P('top').canon).equal('top')
    expect(P('nil').canon).match(/^nil/)
    expect(P('a:1').canon).equal('{"a":1}')
    expect(P('a:1,b:nil').canon).match(/^\{"a":1,"b":nil/)
    expect(P('a:1,b:c:2').canon).equal('{"a":1,"b":{"c":2}}')
  })


  it('gen', () => {
    let ctx = makeCtx()

    expect(P('1').gen(ctx)).equal(1)
    expect(P('"a"').gen(ctx)).equal('a')
    expect(P('b').gen(ctx)).equal('b')
    expect(P('true').gen(ctx)).equal(true)
    expect(P('top').gen(ctx)).equal(undefined)
    expect(P('a:1').gen(ctx)).equal({ a: 1 })
    expect(P('a:1,b:c:2').gen(ctx)).equal({ a: 1, b: { c: 2 } })

    expect(P('nil').gen(ctx)).equal(undefined)

    expect(P('a:1,b:nil').gen(ctx)).includes({
      isNil: true
    })
  })


  it('scalar-kind', () => {
    expect(makeSK_String().same(makeSK_String())).equal(true)

    expect(makeSK_Number().same(makeSK_Number())).equal(true)
    expect(makeSK_Boolean().same(makeSK_Boolean())).equal(true)
    expect(makeSK_Integer().same(makeSK_Integer())).equal(true)

    expect(makeSK_String().same(makeSK_Number())).equal(false)
    expect(makeSK_String().same(makeSK_Boolean())).equal(false)
    expect(makeSK_String().same(makeSK_Integer())).equal(false)

    expect(makeSK_Number().same(makeSK_Boolean())).equal(false)
    expect(makeSK_Number().same(makeSK_Integer())).equal(false)

    expect(makeSK_Integer().same(makeSK_Boolean())).equal(false)
  })


  it('boolean', () => {
    let tu = (ctx: any, a: any, b: any) => unite(ctx, a, b, 'boolean-test')
    let ctx = makeCtx()

    let bt = new BooleanVal({ peg: true }, ctx)
    let bf = new BooleanVal({ peg: false }, ctx)

    expect(tu(ctx, bt, bt)).equal(bt)
    expect(tu(ctx, bf, bf)).equal(bf)

    expect(tu(ctx, bt, bf).isNil).exist()
    expect(tu(ctx, bf, bt).isNil).exist()

    expect(tu(ctx, bt, TOP)).equal(bt)
    expect(tu(ctx, bf, TOP)).equal(bf)
    expect(tu(ctx, TOP, bt)).equal(bt)
    expect(tu(ctx, TOP, bf)).equal(bf)

    let b0 = new NilVal('test')
    expect(tu(ctx, bt, b0)).equal(b0)
    expect(tu(ctx, bf, b0)).equal(b0)
    expect(tu(ctx, b0, bt)).equal(b0)
    expect(tu(ctx, b0, bf)).equal(b0)

    let bs = makeSK_Boolean()
    expect(tu(ctx, bt, bs)).equal(bt)
    expect(tu(ctx, bs, bt)).equal(bt)

    let n0 = makeNumberVal(1)
    expect(tu(ctx, bt, n0).isNil).exist()
    expect(tu(ctx, bf, n0).isNil).exist()
    expect(tu(ctx, n0, bt).isNil).exist()
    expect(tu(ctx, n0, bf).isNil).exist()

    expect(bt.same(bt)).equal(true)
    expect(bf.same(bf)).equal(true)
    expect(bt.same(bf)).equal(false)

    expect(makeBooleanVal(true).same(makeBooleanVal(true))).equal(true)
    expect(makeBooleanVal(false).same(makeBooleanVal(false))).equal(true)
    expect(makeBooleanVal(true).same(makeBooleanVal(false))).equal(false)
  })


  it('string', () => {
    let ou = unite
    let tu = (ctx: any, a: any, b: any) => ou(ctx, a, b, 'string-test')
    let ctx = makeCtx()

    let s0 = new StringVal({ peg: 's0' })
    let s1 = new StringVal({ peg: 's1' })

    expect(tu(ctx, s0, s0)).equal(s0)
    expect(tu(ctx, s1, s1)).equal(s1)

    expect(tu(ctx, s0, s1).isNil).exist()
    expect(tu(ctx, s1, s0).isNil).exist()

    expect(tu(ctx, s0, TOP)).equal(s0)
    expect(tu(ctx, s1, TOP)).equal(s1)
    expect(tu(ctx, TOP, s0)).equal(s0)
    expect(tu(ctx, TOP, s1)).equal(s1)

    let b0 = new NilVal('test')
    expect(tu(ctx, s0, b0)).equal(b0)
    expect(tu(ctx, s1, b0)).equal(b0)
    expect(tu(ctx, b0, s0)).equal(b0)
    expect(tu(ctx, b0, s1)).equal(b0)

    let t0 = makeSK_String()
    expect(tu(ctx, s0, t0)).equal(s0)
    expect(tu(ctx, t0, s0)).equal(s0)

    let n0 = makeNumberVal(1)
    expect(tu(ctx, s0, n0).isNil).exist()
    expect(tu(ctx, s1, n0).isNil).exist()
    expect(tu(ctx, n0, s0).isNil).exist()
    expect(tu(ctx, n0, s1).isNil).exist()

    expect(s0.same(s0)).equal(true)
    expect(new StringVal({ peg: 'a' }).same(new StringVal({ peg: 'a' }))).equal(true)
    expect(new StringVal({ peg: 'a' }).same(new StringVal({ peg: 'b' }))).equal(false)
  })


  it('number', () => {
    let tu = (ctx: any, a: any, b: any) => unite(ctx, a, b, 'number-test')
    let ctx = makeCtx()

    let n0 = makeNumberVal(0, ctx)
    let n1 = makeNumberVal(1.1, ctx)
    let n2 = makeNumberVal(-2, ctx)

    expect(tu(ctx, n0, n0)).equal(n0)

    expect(tu(ctx, n0, n0)).equal(n0)
    expect(tu(ctx, n1, n1)).equal(n1)
    expect(tu(ctx, n2, n2)).equal(n2)

    expect(tu(ctx, n0, n1).isNil).exist()
    expect(tu(ctx, n1, n0).isNil).exist()
    expect(tu(ctx, n0, n2).isNil).exist()
    expect(tu(ctx, n2, n0).isNil).exist()
    expect(tu(ctx, n1, n2).isNil).exist()
    expect(tu(ctx, n2, n1).isNil).exist()

    expect(tu(ctx, n0, TOP)).equal(n0)
    expect(tu(ctx, n1, TOP)).equal(n1)
    expect(tu(ctx, n2, TOP)).equal(n2)
    expect(tu(ctx, TOP, n0)).equal(n0)
    expect(tu(ctx, TOP, n1)).equal(n1)
    expect(tu(ctx, TOP, n2)).equal(n2)

    let b0 = new NilVal('test')
    expect(tu(ctx, n0, b0)).equal(b0)
    expect(tu(ctx, n1, b0)).equal(b0)
    expect(tu(ctx, n2, b0)).equal(b0)
    expect(tu(ctx, b0, n0)).equal(b0)
    expect(tu(ctx, b0, n1)).equal(b0)
    expect(tu(ctx, b0, n2)).equal(b0)

    let t0 = makeSK_Number()
    expect(tu(ctx, n0, t0)).equal(n0)
    expect(tu(ctx, t0, n0)).equal(n0)

    let s0 = new StringVal({ peg: 's0' })
    expect(tu(ctx, n0, s0).isNil).exist()
    expect(tu(ctx, n1, s0).isNil).exist()
    expect(tu(ctx, n2, s0).isNil).exist()
    expect(tu(ctx, s0, n0).isNil).exist()
    expect(tu(ctx, s0, n1).isNil).exist()
    expect(tu(ctx, s0, n2).isNil).exist()

    expect(n0.same(n0)).equal(true)
    expect(n1.same(n1)).equal(true)
    expect(n2.same(n2)).equal(true)

    expect(makeNumberVal(11).same(makeNumberVal(11))).equal(true)
    expect(makeNumberVal(11).same(makeNumberVal(22))).equal(false)

  })


  it('number-unify', () => {
    let ctx = makeCtx()

    let n0: any = makeIntegerVal(11)
    n0.mark$ = 'n0'

    let n1: any = makeIntegerVal(11)
    n1.mark$ = 'n1'

    expect(n0.unify(n1, ctx).mark$).equal('n0')
    expect(n1.unify(n0, ctx).mark$).equal('n1')

    let tn0 = makeSK_Number()
    let ti0 = makeSK_Integer()

    expect(n0.unify(tn0, ctx).mark$).equal('n0')
    expect((tn0.unify(n0, ctx) as any).mark$).equal('n0')

    expect(n0.unify(ti0, ctx).mark$).equal('n0')
    expect((ti0.unify(n0, ctx) as any).mark$).equal('n0')


    let x0: any = makeNumberVal(11)
    x0.mark$ = 'x0'

    let x1: any = makeNumberVal(11)
    x1.mark$ = 'x1'

    expect(x0.unify(x1, ctx).mark$).equal('x0')
    expect(x1.unify(x0, ctx).mark$).equal('x1')

    expect(x0.unify(tn0, ctx).mark$).equal('x0')
    expect((tn0.unify(x0, ctx) as any).mark$).equal('x0')

    // Integer Kind can't unify with Number Scalar
    expect(x0.unify(ti0, ctx).isNil).equal(true)
    expect(ti0.unify(x0, ctx).isNil).equal(true)


    expect(x0.unify(n0, ctx).mark$).equal('n0')
    expect(n0.unify(x0, ctx).mark$).equal('n0')


    let x2: any = makeNumberVal(2.2)
    x2.mark$ = 'x2'

    expect(x2.unify(tn0, ctx).mark$).equal('x2')
    expect((tn0.unify(x2, ctx) as any).mark$).equal('x2')

    expect(x2.unify(ti0, ctx).isNil).equal(true)
    expect((ti0.unify(x2, ctx) as any).isNil).equal(true)

    expect(x2.unify(n0, ctx).isNil).equal(true)
    expect((n0.unify(x2, ctx) as any).isNil).equal(true)
  })


  it('number-parse', () => {
    // expect(P('0').canon).equal('0')
    // expect(P('1').canon).equal('1')
    // expect(P('2.2').canon).equal('2.2')
    // expect(P('-3').canon).equal('-3')
    // expect(P('+4').canon).equal('4')

    // const ctx = makeCtx()
    // expect(G('0', ctx)).equal(0)
    // expect(G('1', ctx)).equal(1)
    // expect(G('2.2', ctx)).equal(2.2)
    // expect(G('-3', ctx)).equal(-3)
    // expect(G('+4', ctx)).equal(4)

    const lang = new Lang({
      // debug: true,
      // trace: true,

      // TODO: make this work
      idcount: 0
    })
    const i11 = lang.parse('(11)')
    expect(i11 as any).include({
      col: 1,
      dc: -1,
      err: [],
      isInteger: true,
      isScalar: true,
      isVal: true,
      isTop: false,
      path: [],
      peg: 11,
      row: 1,
      kind: Integer,
      uh: [],
      url: undefined,
    })
  })


  it('integer', () => {
    let ou = unite
    let tu = (ctx: any, a: any, b: any) => ou(ctx, a, b, 'integer-test')
    let ctx = makeCtx()

    let n0 = makeIntegerVal(0)
    let n1 = makeIntegerVal(1)

    expect(tu(ctx, n0, n0)).equal(n0)
    expect(tu(ctx, n1, n1)).equal(n1)

    expect(tu(ctx, n0, n1).isNil).exist()
    expect(tu(ctx, n1, n0).isNil).exist()

    expect(tu(ctx, n0, TOP)).equal(n0)
    expect(tu(ctx, n1, TOP)).equal(n1)
    expect(tu(ctx, TOP, n0)).equal(n0)
    expect(tu(ctx, TOP, n1)).equal(n1)

    let b0 = new NilVal('test')
    expect(tu(ctx, n0, b0)).equal(b0)
    expect(tu(ctx, n1, b0)).equal(b0)
    expect(tu(ctx, b0, n0)).equal(b0)
    expect(tu(ctx, b0, n1)).equal(b0)

    let s0 = new StringVal({ peg: 's0' })
    expect(tu(ctx, n0, s0).isNil).exist()
    expect(tu(ctx, n1, s0).isNil).exist()
    expect(tu(ctx, s0, n0).isNil).exist()
    expect(tu(ctx, s0, n1).isNil).exist()

    let t0 = makeSK_Integer()
    expect(tu(ctx, n0, t0)).equal(n0)
    expect(tu(ctx, t0, n0)).equal(n0)

    let t1 = makeSK_Number()
    expect(tu(ctx, n0, t1)).equal(n0)
    expect(tu(ctx, t1, n0)).equal(n0)

    expect(tu(ctx, t0, t1)).equal(t0)
    expect(tu(ctx, t1, t0)).equal(t0)

    let x0 = makeNumberVal(0)
    expect(tu(ctx, n0, x0)).equal(n0)
    expect(tu(ctx, x0, n0)).equal(n0)

    expect(n0.same(n0)).equal(true)
    expect(makeIntegerVal(11).same(makeIntegerVal(11))).equal(true)
    expect(makeIntegerVal(11).same(makeIntegerVal(22))).equal(false)
  })



  it('null', () => {
    let tu = (ctx: any, a: any, b: any) => unite(ctx, a, b, 'null-test')
    let ctx = makeCtx()

    let nv = new NullVal({}, ctx)
    let bv = new BooleanVal({ peg: true }, ctx)
    let mv = new NumberVal({ peg: 2.2 }, ctx)
    let iv = new IntegerVal({ peg: 2 }, ctx)
    let sv = new StringVal({ peg: 'a' }, ctx)

    expect(tu(ctx, nv, nv)).equal(nv)

    expect(tu(ctx, nv, bv).isNil).exist()
    expect(tu(ctx, nv, mv).isNil).exist()
    expect(tu(ctx, nv, iv).isNil).exist()
    expect(tu(ctx, nv, sv).isNil).exist()
  })


  it('map', () => {
    let ou = unite
    let tu = (ctx: any, a: any, b: any) => ou(ctx, a, b, 'integer-test')
    let ctx = makeCtx()

    let m0 = new MapVal({ peg: {} })
    expect(m0.canon).equal('{}')

    // TODO: update
    expect(tu(ctx, m0, m0).canon).equal('{}')

    expect(tu(ctx, m0, TOP).canon).equal('{}')
    expect(tu(ctx, TOP, m0).canon).equal('{}')

    let b0 = new NilVal('test')
    expect(tu(ctx, m0, b0)).equal(b0)
    expect(tu(ctx, b0, m0)).equal(b0)

    let s0 = new StringVal({ peg: 's0' })
    expect(tu(ctx, m0, s0).isNil).exist()
    expect(tu(ctx, s0, m0).isNil).exist()

    let n0 = makeNumberVal(0)
    expect(tu(ctx, m0, n0).isNil).exist()
    expect(tu(ctx, n0, m0).isNil).exist()

    let t0 = makeSK_String()
    expect(tu(ctx, m0, t0).isNil).exist()
    expect(tu(ctx, t0, m0).isNil).exist()


    let m1 = new MapVal({ peg: { a: makeNumberVal(1) } })
    // print(m1, 'm1')
    expect(m1.canon).equal('{"a":1}')

    let m1u = m1.unify(TOP, ctx)
    // print(m1u, 'm1u')
    expect(m1u.canon).equal('{"a":1}')


    let u01 = m0.unify(m1, ctx)
    // print(u01, 'u01')
    expect(u01.canon).equal('{"a":1}')
    expect(m1u.canon).equal('{"a":1}')
    expect(m0.canon).equal('{}')
    expect(m1.canon).equal('{"a":1}')

    let u02 = m1.unify(m0, ctx)
    // print(u02, 'u02')
    expect(u02.canon).equal('{"a":1}')
    expect(m0.canon).equal('{}')
    expect(m1.canon).equal('{"a":1}')

  })


  it('map', () => {
    let ou = unite
    let tu = (ctx: any, a: any, b: any) => ou(ctx, a, b, 'integer-test')
    let ctx = makeCtx()

    let l0 = new ListVal({ peg: [] })
    expect(l0.canon).equal('[]')

    expect(tu(ctx, l0, l0).canon).equal('[]')
  })


  it('map-spread', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({
      peg: {
        [SPREAD]: { o: '&', v: P('{x:1}') },
        a: P('{ y: 1 }'),
        b: P('{ y: 2 }'),
      }
    })

    expect(m0.canon).equal('{&:{"x":1},"a":{"y":1},"b":{"y":2}}')

    let u0 = m0.unify(TOP, ctx)
    expect(u0.canon).equal('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}')

  })


  it('list-spread', () => {
    let ctx = makeCtx()

    let vals: any = [
      P('{ y: 1 }'),
      P('{ y: 2 }'),
    ]
    vals[SPREAD] = { o: '&', v: P('{x:1}') }


    let l0 = new ListVal({ peg: vals })
    // console.log(l0)

    expect(l0.canon).equal('[&:{"x":1},{"y":1},{"y":2}]')

    let u0 = l0.unify(TOP, ctx)
    expect(u0.canon).equal('[&:{"x":1},{"y":1,"x":1},{"y":2,"x":1}]')

  })


  it('var', () => {
    // TODO: make Aontu.generate support this

    let q0 = new VarVal({ peg: 'a' })
    expect(q0.canon).equal('$a')

    let ctx = makeCtx()
    ctx.vars.foo = makeNumberVal(11)

    let s = 'a:$foo'
    let v0 = P(s, ctx)
    expect(v0.canon).equal('{"a":$"foo"}')

    let g0 = GC(s, ctx)
    expect(g0).equal({ a: 11 })
  })


  it('conjunct', () => {
    let ou = unite
    let tu = (ctx: any, a: any, b: any) => ou(ctx, a, b, 'integer-test')
    let ctx = makeCtx(new MapVal({ peg: { x: makeIntegerVal(1) } }))

    let d0 = new ConjunctVal({ peg: PA(['1']) })
    let d1 = new ConjunctVal({ peg: PA(['1', '1']) })
    let d2 = new ConjunctVal({ peg: PA(['1', '2']) })
    let d3 = new ConjunctVal({ peg: PA(['1', 'number']) })
    let d4 = new ConjunctVal({ peg: PA(['1', 'number', 'integer']) })
    let d5 = new ConjunctVal({ peg: PA(['{a:1}']) })
    let d6 = new ConjunctVal({ peg: PA(['{a:1}', '{b:2}']) })

    // let d100 = new ConjunctVal([makeIntegerVal(1), new RefVal({peg:'/x')])
    let d100 =
      new ConjunctVal({
        peg: [
          makeIntegerVal(1),
          new RefVal({ peg: ['x'], absolute: true })
        ]
      })

    expect(d0.canon).equal('1')
    expect(d1.canon).equal('1&1')
    expect(d2.canon).equal('1&2')
    expect(d3.canon).equal('1&number')
    expect(d4.canon).equal('1&number&integer')
    expect(d5.canon).equal('{"a":1}')
    expect(d6.canon).equal('{"a":1}&{"b":2}')


    expect(tu(ctx, d0, P('1')).canon).equal('1')
    expect(tu(ctx, P('1', d0), TOP).canon).equal('1')
    expect(tu(ctx, d0, P('2')).canon)
      .equal('nil')
    expect(tu(ctx, P('2'), d0).canon)
      .equal('nil')


    expect(tu(ctx, d0, TOP).canon).equal('1')
    expect(tu(ctx, TOP, d0).canon).equal('1')

    expect(tu(ctx, d1, TOP).canon).equal('1')
    expect(tu(ctx, TOP, d1).canon).equal('1')

    expect(tu(ctx, d2, TOP).canon)
      .equal('nil')
    expect(tu(ctx, TOP, d2).canon)
      .equal('nil')

    expect(tu(ctx, d3, TOP).canon).equal('1')
    expect(tu(ctx, TOP, d3).canon).equal('1')


    // TODO: term order is swapped by ConjunctVal impl - should be preserved
    expect(tu(ctx, d100, TOP).canon).equal('1')
    expect(tu(ctx, TOP, d100).canon).equal('1')

    // TODO: same for DisjunctVal
    expect(tu(ctx, new ConjunctVal({ peg: [] }), TOP).canon).equal('top')

    expect(tu(ctx, P('1 & .a'), TOP).canon).equal('.a&1')
    expect(tu(ctx, P('.a & 1'), TOP).canon).equal('.a&1')

    expect(tu(ctx, P('1 & 1 & .a'), TOP).canon).equal('.a&1')

    expect(tu(ctx, P('1 & 2'), TOP).canon).equal('nil')
    expect(tu(ctx, P('1 & 1 & 2'), TOP).canon).equal('nil')
    expect(tu(ctx, P('1 & 1 & .a & 2'), TOP).canon).equal('nil')

    expect(tu(ctx, P('1 & 1 & .a & .b'), TOP).canon).equal('.a&.b&1')

    expect(tu(ctx, P('1 & 1 & .a & 1 & .b & 1'), TOP).canon).equal('.b&.a&1')
  })


  it('disjunct', () => {
    let ou = unite
    let tu = (ctx: any, a: any, b: any) => ou(ctx, a, b, 'integer-test')
    let ctx = makeCtx()

    let d1 = new DisjunctVal({ peg: [P('1'), P('2')] })

    expect(tu(ctx, d1, P('2')).canon).equal('2')

    expect(tu(ctx, P('1|number'), TOP).canon).equal('1|number')
    expect(tu(ctx, P('1|top'), TOP).canon).equal('1|top')
    expect(tu(ctx, P('1|number|top'), TOP).canon).equal('1|number|top')

    expect(tu(ctx, P('1|number'), TOP).gen(ctx)).equal(1)
    expect(tu(ctx, P('1|number|top'), TOP).gen(ctx)).equal(1)

    expect(tu(ctx, P('number|1').unify(P('top'), ctx), TOP).canon).equal('number|1')

    expect(tu(ctx, P('1|number|1').unify(P('top'), ctx), TOP).canon).equal('1|number')

    expect(tu(ctx, P('number|string').unify(P('top'), ctx), TOP).canon)
      .equal('number|string')

    expect(tu(ctx, P('number|string').unify(P('1'), ctx), TOP).canon).equal('1')
    expect(tu(ctx, P('number|1').unify(P('1'), ctx), TOP).canon).equal('1')


    expect(tu(ctx, P('number|1').unify(P('number|1'), ctx), TOP).canon).equal('number|1')
    expect(tu(ctx, P('1|number').unify(P('1|number'), ctx), TOP).canon).equal('1|number')
    expect(tu(ctx, P('number|1').unify(P('1|number'), ctx), TOP).canon).equal('1|number')

    expect(tu(ctx, P('number|1').unify(P('number|string'), ctx), TOP).canon)
      .equal('number|1')
    expect(tu(ctx, P('number|string').unify(P('boolean|number'), ctx), TOP).canon)
      .equal('number')

    expect(tu(ctx, P('number|*1').unify(P('number|*1'), ctx), TOP).canon)
      .equal('number|1|*1')


    let u0 = tu(ctx, P('number|*1'), P('number'))
    expect(u0.canon).equal('number|1')
    expect(u0.gen(ctx)).equal(1)

    let u1 = tu(ctx, P('number|*1'), P('number|string'))
    expect(u1.canon).equal('number|1')
    expect(u1.gen(ctx)).equal(1)

    let u2 = tu(ctx, P('number|*1'), P('2'))
    expect(u2.canon).equal('2')
    expect(u2.gen(ctx)).equal(2)
  })



  it('ref-conjunct', () => {
    return;

    /*
        let m0 = P(`
    a: 1
    b: /a
    c: 1 & /a
    d: 1
    e: /d & /a
    f: /b
    `, { xlog: -1 })
  
        let g = []
        g = []; console.log(m0.gen(ctx))
  
        let c0 = new AontuContext({ root: m0 })
        let u0 = m0.unify(TOP, c0)
  
        g = []; console.log(u0.gen(ctx))
  
        let c0a = new AontuContext({ root: u0 })
        let u0a = u0.unify(TOP, c0a)
  
        g = []; console.log(u0a.gen(ctx))
    */

    let m1 = P(`
  u: { x: 1, y: number}
  q: a: .u
  w: b: .q.a & {y:2, z: 3}
  `)

    let u1a = m1.unify(TOP, new AontuContext({ root: m1 }))
    let u1b = u1a.unify(TOP, new AontuContext({ root: u1a }))
  })


  it('unify', () => {
    let m0 = (P(`
  a: 1
  b: .a
  c: .x
  `, { xlog: -1 }) as MapVal)

    expect(m0.canon).equal('{"a":1,"b":.a,"c":.x}')

    let c0 = new AontuContext({
      root: m0
    })

    let m0u = m0.unify(TOP, c0)
    expect(m0u.canon).equal('{"a":1,"b":1,"c":.x}')


    let m1 = (P(`
  a: .b.c
  b: c: 1
  `, { xlog: -1 }) as MapVal)

    let c1 = new AontuContext({
      root: m1
    })

    let m1u = m1.unify(TOP, c1)
    expect(m1u.canon).equal('{"a":1,"b":{"c":1}}')


    let m2 = (P(`
a: {x:1}
b: { &: $.a }
b: c0: {n:0}
b: c1: {n:1}
b: c2: {n:2}
`
      ,) as MapVal)

    expect(m2.canon)
      .equal('{"a":{"x":1},"b":{&:$.a}&{"c0":{"n":0}}&{"c1":{"n":1}}&{"c2":{"n":2}}}')

    expect(m2.peg.b.constructor.name).equal('ConjunctVal')
    expect(m2.peg.b.peg.length).equal(4)

    let c2 = new AontuContext({
      root: m2
    })

    let m2u = m2.unify(TOP, c2)
    expect(m2u.canon)
      // .equal('{"a":{"x":1},"b":{&:{"x":1},"c0":{"n":0,"x":1},"c1":{"n":1,"x":1},"c2":{"n":2,"x":1}}}')
      .equal('{"a":{"x":1},"b":{&:$.a,"c0":{"x":1,"n":0},"c1":{"x":1,"n":1},"c2":{"x":1,"n":2}}}')

  })




  it('repeat-spread', () => {
    let ctx = makeCtx()

    expect(G('p:a:b:&:n:1 p:a:b:c:{}', ctx)).equal({
      p: { a: { b: { c: { n: 1 } } } }
    })

    expect(G('p:a:&:&:n:1 p:a:b:c:{}', ctx)).equal({
      p: { a: { b: { c: { n: 1 } } } }
    })

    expect(G('p:a:b:&:n:.$KEY p:a:b:c:{}', ctx)).equal({
      p: { a: { b: { c: { n: 'c' } } } }
    })

    expect(G('p:a:&:&:n:.$KEY p:a:b:c:{}', ctx)).equal({
      p: { a: { b: { c: { n: 'c' } } } }
    })
  })


  it('operator-plus', () => {
    let ctx = makeCtx()

    expect(G('a:1+2', ctx)).equal({ a: 3 })
    expect(G('a:"b"+"c"', ctx)).equal({ a: 'bc' })
    expect(G('a:"1"+2', ctx)).equal({ a: '12' })
    expect(G('a:1,b:$.a+3', ctx)).equal({ a: 1, b: 4 })
    expect(G('a:"A",b:B+$.a', ctx)).equal({ a: 'A', b: 'BA' })

    expect(P('a:1+2', ctx).canon).equal('{"a":1+2}')
    expect(P('a:"b"+"c"', ctx).canon).equal('{"a":"b"+"c"}')
  })


  it('null-val', () => {
    let ctx = makeCtx()

    expect(G('a:null', ctx)).equal({ a: null })
    expect(G('[null]', ctx)).equal([null])
    expect(G('null', ctx)).equal(null)

    expect(P('a:null', ctx).canon).equal('{"a":null}')
    expect(P('[null]', ctx).canon).equal('[null]')
    expect(P('null', ctx).canon).equal('null')
  })



  it('pref', () => {
    let ctx = makeCtx()

    let s0 = new StringVal({ peg: 'p0' })
    expect(s0.canon).equal('"p0"')

    let p0 = new PrefVal({ peg: s0 })
    expect(p0.canon).equal('*"p0"')
    expect(p0.gen(ctx)).equal('p0')

    let pu0 = p0.unify(TOP, ctx)
    expect(pu0).include({
      dc: -1,
      row: -1,
      col: -1,
      url: '',

      // FIX: use jest toMatchObject
      // peg: {
      //   dc: -1,
      //   row: -1,
      //   col: -1,
      //   url: '',
      //   peg: 'p0',
      //   path: [],
      //   kind: String,
      // },
      // path: [],
      // pref: {
      //   dc: -1,
      //   row: -1,
      //   col: -1,
      //   url: '',
      //   peg: 'p0',
      //   path: [],
      //   kind: String,
      // }
    })




    p0.peg = makeSK_String()
    expect(p0.canon).equal('*string')
    expect(p0.gen(ctx)).equal(undefined)

    // p0.pref = new Nil([], 'test:pref')
    // expect(p0.canon).equal('string')
    // expect(p0.gen([])).equal(undefined)

    // p0.peg = new Nil([], 'test:val')
    // expect(p0.canon).equal('nil')
    // expect(p0.gen([])).equal(undefined)



    let p1 = new PrefVal({ peg: new StringVal({ peg: 'p1' }) })
    let p2 = new PrefVal({ peg: makeSK_String() })

    let up12 = p1.unify(p2, ctx)
    expect(up12.canon).equal('*"p1"')

    let up21 = p2.unify(p1, ctx)
    expect(up21.canon).equal('*"p1"')

    let up2s0 = p2.unify(new StringVal({ peg: 's0' }), ctx)
    expect(up2s0.canon).equal('"s0"')

    // NOTE: once made concrete a prefval is fixed
    expect(up2s0.unify(new StringVal({ peg: 's1' }), ctx).canon)
      .equal('nil')




    // let u0 = P('1|number').unify(TOP, ctx)

    // let u1 = P('*1|number').unify(TOP, ctx)


    expect(UC('a:1')).equal('{"a":1}')
    expect(UC('a:1,b:.a')).equal('{"a":1,"b":1}')
    expect(UC('a:*1|number,b:2,c:.a&.b')).equal('{"a":*1|number,"b":2,"c":2}')
    expect(UC('a:*1|number,b:top,c:.a&.b'))
      .equal('{"a":*1|number,"b":top,"c":*1|number}')

    expect(UC('a:*1|number,a:*2|number'))
      // .equal('{"a":*2|*1|number}')
      .equal('{"a":2|1|number}')

    expect(UC('a:*1|number,b:*2|number,c:.a&.b'))
      .equal('{"a":*1|number,"b":*2|number,"c":2|1|number}')


    let d0 = P('1|number').unify(TOP, ctx)
    expect(d0.canon).equal('1|number')
    expect(d0.gen(ctx)).equal(1)
    // expect(d0.gen(ctx)).equal(undefined)


    expect(G('number|*1')).equal(1)
    expect(G('string|*1')).equal(1)

    expect(N('*1 & x', ctx)).equal('nil')
    expect(() => G('*1 & x', ctx)).throws(/aontu/)
    expect(G('a:*1,a:2')).equal({ a: 2 })
    expect(N('a:*1,a:x', ctx)).equal('{"a":nil}')
    expect(() => G('a:*1,a:x', ctx)).throws(/aontu/)
    expect(G('a: *1 & 2')).equal({ a: 2 })


    expect(G('true|*true')).equal(true)
    expect(G('*true|true')).equal(true)
    expect(G('*true|*true')).equal(true)
    expect(G('*true|*true|*true')).equal(true)

    expect(G('true&*true')).equal(true)
    expect(G('*true&true')).equal(true)
    expect(G('*true&*true')).equal(true)


    expect(G('{a:2}&{a:number|*1}')).equal({ a: 2 })
    expect(G('{&:number}&{a:2}&{a:number|*1}')).equal({ a: 2 })
    expect(G('{a:{&:{c:number|*1}}} & {a:{b:{c:2}}}')).equal({ a: { b: { c: 2 } } })
    expect(G('{a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .equal({ a: { b: { c: 2, d: true } } })
    expect(G('x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .equal({ x: { a: { b: { c: 2, d: true } } } })
    expect(G('x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .equal({ x: { a: { b: { c: 2, d: true } } } })

    expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true } } } })
    expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } })

    expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true } } } })
    expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
      .equal({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } })


    expect(G(`
  a: *true | boolean
  b: $.a
  c: $.a & false
  d: { x: $.a }
  d: { x: false }
  e: { x: $.a }
  f: { &: *true | boolean }
  f: { y: false }
  g: .f
  h: { &: $.a }
  h: { z: false }
  `)).equal({
      a: true,
      b: true,
      c: false,
      d: { x: false },
      e: { x: true },
      f: { y: false },
      g: { y: false },
      h: { z: false }
    })

    expect(G(`
  x: y: { m: n: *false | boolean }
  a: b: { &: $.x.y }
  a: b: { c: {} }
  a: b: d: {}
  a: b: e: m: n: true
  `)).equal({
      x: { y: { m: { n: false } } },
      a: {
        b: {
          c: { m: { n: false } },
          d: { m: { n: false } },
          e: { m: { n: true } }
        }
      },
    })
  })

})


function makeCtx(r?: any) {
  return new AontuContext({ root: r || new MapVal({ peg: {} }) })
}
