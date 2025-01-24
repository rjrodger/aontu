/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */




import {
  Lang
} from '../lib/lang'

import {
  Context,
  Unify,
} from '../lib/unify'

import {
  unite
} from '../lib/op/op'




import { ConjunctVal } from '../lib/val/ConjunctVal'
import { DisjunctVal } from '../lib/val/DisjunctVal'
import { ListVal } from '../lib/val/ListVal'
import { MapVal } from '../lib/val/MapVal'
import { Nil } from '../lib/val/Nil'
import { PrefVal } from '../lib/val/PrefVal'
import { RefVal } from '../lib/val/RefVal'
import { VarVal } from '../lib/val/VarVal'
import { ValBase } from '../lib/val/ValBase'


import {
  Integer,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
  TOP,
} from '../lib/val'


const lang = new Lang()
const PL = lang.parse.bind(lang)
const P = (x: string, ctx?: any) => PL(x, ctx)
const PA = (x: string[], ctx?: any) => x.map(s => PL(s, ctx))
const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r))?.canon
const G = (x: string, ctx?: any) => new Unify(x, undefined, ctx).res.gen()


const makeST_String = () => new ScalarTypeVal({ peg: String })
const makeST_Number = () => new ScalarTypeVal({ peg: Number })
const makeST_Integer = () => new ScalarTypeVal({ peg: Integer })
const makeST_Boolean = () => new ScalarTypeVal({ peg: Boolean })

const makeBooleanVal = (v: boolean) => new BooleanVal({ peg: v })
const makeNumberVal = (v: number, c?: Context) => new NumberVal({ peg: v }, c)
const makeIntegerVal = (v: number, c?: Context) => new IntegerVal({ peg: v }, c)



describe('val', function() {
  it('canon', () => {
    expect(P('1').canon).toEqual('1')
    expect(P('"a"').canon).toEqual('"a"')
    expect(P('b').canon).toEqual('"b"')
    expect(P('true').canon).toEqual('true')
    expect(P('top').canon).toEqual('top')
    expect(P('nil').canon).toMatch(/^nil/)
    expect(P('a:1').canon).toEqual('{"a":1}')
    expect(P('a:1,b:nil').canon).toMatch(/^\{"a":1,"b":nil/)
    expect(P('a:1,b:c:2').canon).toEqual('{"a":1,"b":{"c":2}}')
  })


  it('gen', () => {
    expect(P('1').gen()).toEqual(1)
    expect(P('"a"').gen()).toEqual('a')
    expect(P('b').gen()).toEqual('b')
    expect(P('true').gen()).toEqual(true)
    expect(P('top').gen()).toEqual(undefined)
    expect(P('a:1').gen()).toEqual({ a: 1 })
    expect(P('a:1,b:c:2').gen()).toEqual({ a: 1, b: { c: 2 } })

    expect(() => P('nil').gen()).toThrow()
    expect(() => P('a:1,b:nil').gen()).toThrow()
  })


  it('scalartype', () => {
    expect(makeST_String().same(makeST_String())).toBeTruthy()

    expect(makeST_Number().same(makeST_Number())).toBeTruthy()
    expect(makeST_Boolean().same(makeST_Boolean())).toBeTruthy()
    expect(makeST_Integer().same(makeST_Integer())).toBeTruthy()

    expect(makeST_String().same(makeST_Number())).toBeFalsy()
    expect(makeST_String().same(makeST_Boolean())).toBeFalsy()
    expect(makeST_String().same(makeST_Integer())).toBeFalsy()

    expect(makeST_Number().same(makeST_Boolean())).toBeFalsy()
    expect(makeST_Number().same(makeST_Integer())).toBeFalsy()

    expect(makeST_Integer().same(makeST_Boolean())).toBeFalsy()
  })


  it('boolean', () => {
    let ctx = makeCtx()

    let bt = BooleanVal.TRUE
    let bf = BooleanVal.FALSE

    expect(unite(ctx, bt, bt)).toEqual(bt)
    expect(unite(ctx, bf, bf)).toEqual(bf)

    expect(unite(ctx, bt, bf) instanceof Nil).toBeTruthy()
    expect(unite(ctx, bf, bt) instanceof Nil).toBeTruthy()

    expect(unite(ctx, bt, TOP)).toEqual(bt)
    expect(unite(ctx, bf, TOP)).toEqual(bf)
    expect(unite(ctx, TOP, bt)).toEqual(bt)
    expect(unite(ctx, TOP, bf)).toEqual(bf)

    let b0 = new Nil('test')
    expect(unite(ctx, bt, b0)).toEqual(b0)
    expect(unite(ctx, bf, b0)).toEqual(b0)
    expect(unite(ctx, b0, bt)).toEqual(b0)
    expect(unite(ctx, b0, bf)).toEqual(b0)

    let bs = makeST_Boolean()
    expect(unite(ctx, bt, bs)).toEqual(bt)
    expect(unite(ctx, bs, bt)).toEqual(bt)

    let n0 = makeNumberVal(1)
    expect(unite(ctx, bt, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, bf, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, bt) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, bf) instanceof Nil).toBeTruthy()

    expect(bt.same(bt)).toBeTruthy()
    expect(bf.same(bf)).toBeTruthy()
    expect(bt.same(bf)).toBeFalsy()

    expect(makeBooleanVal(true).same(makeBooleanVal(true))).toBeTruthy()
    expect(makeBooleanVal(false).same(makeBooleanVal(false))).toBeTruthy()
    expect(makeBooleanVal(true).same(makeBooleanVal(false))).toBeFalsy()
  })


  it('string', () => {
    let ctx = makeCtx()

    let s0 = new StringVal({ peg: 's0' })
    let s1 = new StringVal({ peg: 's1' })

    expect(unite(ctx, s0, s0)).toEqual(s0)
    expect(unite(ctx, s1, s1)).toEqual(s1)

    expect(unite(ctx, s0, s1) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s1, s0) instanceof Nil).toBeTruthy()

    expect(unite(ctx, s0, TOP)).toEqual(s0)
    expect(unite(ctx, s1, TOP)).toEqual(s1)
    expect(unite(ctx, TOP, s0)).toEqual(s0)
    expect(unite(ctx, TOP, s1)).toEqual(s1)

    let b0 = new Nil('test')
    expect(unite(ctx, s0, b0)).toEqual(b0)
    expect(unite(ctx, s1, b0)).toEqual(b0)
    expect(unite(ctx, b0, s0)).toEqual(b0)
    expect(unite(ctx, b0, s1)).toEqual(b0)

    let t0 = makeST_String()
    expect(unite(ctx, s0, t0)).toEqual(s0)
    expect(unite(ctx, t0, s0)).toEqual(s0)

    let n0 = makeNumberVal(1)
    expect(unite(ctx, s0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s1, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, s1) instanceof Nil).toBeTruthy()

    expect(s0.same(s0)).toBeTruthy()
    expect(new StringVal({ peg: 'a' }).same(new StringVal({ peg: 'a' }))).toBeTruthy()
    expect(new StringVal({ peg: 'a' }).same(new StringVal({ peg: 'b' }))).toBeFalsy()
  })


  it('number', () => {
    let ctx = makeCtx()

    let n0 = makeNumberVal(0, ctx)
    let n1 = makeNumberVal(1.1, ctx)

    expect(unite(ctx, n0, n0)).toEqual(n0)

    expect(unite(ctx, n0, n0)).toEqual(n0)
    expect(unite(ctx, n1, n1)).toEqual(n1)

    expect(unite(ctx, n0, n1) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n1, n0) instanceof Nil).toBeTruthy()

    expect(unite(ctx, n0, TOP)).toEqual(n0)
    expect(unite(ctx, n1, TOP)).toEqual(n1)
    expect(unite(ctx, TOP, n0)).toEqual(n0)
    expect(unite(ctx, TOP, n1)).toEqual(n1)

    let b0 = new Nil('test')
    expect(unite(ctx, n0, b0)).toEqual(b0)
    expect(unite(ctx, n1, b0)).toEqual(b0)
    expect(unite(ctx, b0, n0)).toEqual(b0)
    expect(unite(ctx, b0, n1)).toEqual(b0)

    let t0 = makeST_Number()
    expect(unite(ctx, n0, t0)).toEqual(n0)
    expect(unite(ctx, t0, n0)).toEqual(n0)

    let s0 = new StringVal({ peg: 's0' })
    expect(unite(ctx, n0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n1, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n1) instanceof Nil).toBeTruthy()

    expect(n0.same(n0)).toBeTruthy()
    expect(makeNumberVal(11).same(makeNumberVal(11))).toBeTruthy()
    expect(makeNumberVal(11).same(makeNumberVal(22))).toBeFalsy()

  })


  it('number-unify', () => {
    let n0: any = makeIntegerVal(11)
    n0.mark$ = 'n0'

    let n1: any = makeIntegerVal(11)
    n1.mark$ = 'n1'

    expect(n0.unify(n1).mark$).toEqual('n0')
    expect(n1.unify(n0).mark$).toEqual('n1')

    let tn0 = makeST_Number()
    let ti0 = makeST_Integer()

    expect(n0.unify(tn0).mark$).toEqual('n0')
    expect((tn0.unify(n0) as any).mark$).toEqual('n0')

    expect(n0.unify(ti0).mark$).toEqual('n0')
    expect((ti0.unify(n0) as any).mark$).toEqual('n0')


    let x0: any = makeNumberVal(11)
    x0.mark$ = 'x0'

    let x1: any = makeNumberVal(11)
    x1.mark$ = 'x1'

    expect(x0.unify(x1).mark$).toEqual('x0')
    expect(x1.unify(x0).mark$).toEqual('x1')

    expect(x0.unify(tn0).mark$).toEqual('x0')
    expect((tn0.unify(x0) as any).mark$).toEqual('x0')

    expect(x0.unify(ti0).isNil).toEqual(true)
    expect((ti0.unify(x0) as any).isNil).toEqual(true)


    expect(x0.unify(n0).mark$).toEqual('n0')
    expect(n0.unify(x0).mark$).toEqual('n0')


    let x2: any = makeNumberVal(2.2)
    x2.mark$ = 'x2'

    expect(x2.unify(tn0).mark$).toEqual('x2')
    expect((tn0.unify(x2) as any).mark$).toEqual('x2')

    expect(x2.unify(ti0).isNil).toEqual(true)
    expect((ti0.unify(x2) as any).isNil).toEqual(true)

    expect(x2.unify(n0).isNil).toEqual(true)
    expect((n0.unify(x2) as any).isNil).toEqual(true)

  })


  it('integer', () => {
    let ctx = makeCtx()

    let n0 = makeIntegerVal(0)
    let n1 = makeIntegerVal(1)

    expect(unite(ctx, n0, n0)).toEqual(n0)
    expect(unite(ctx, n1, n1)).toEqual(n1)

    expect(unite(ctx, n0, n1) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n1, n0) instanceof Nil).toBeTruthy()

    expect(unite(ctx, n0, TOP)).toEqual(n0)
    expect(unite(ctx, n1, TOP)).toEqual(n1)
    expect(unite(ctx, TOP, n0)).toEqual(n0)
    expect(unite(ctx, TOP, n1)).toEqual(n1)

    let b0 = new Nil('test')
    expect(unite(ctx, n0, b0)).toEqual(b0)
    expect(unite(ctx, n1, b0)).toEqual(b0)
    expect(unite(ctx, b0, n0)).toEqual(b0)
    expect(unite(ctx, b0, n1)).toEqual(b0)

    let s0 = new StringVal({ peg: 's0' })
    expect(unite(ctx, n0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n1, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n1) instanceof Nil).toBeTruthy()

    let t0 = makeST_Integer()
    expect(unite(ctx, n0, t0)).toEqual(n0)
    expect(unite(ctx, t0, n0)).toEqual(n0)

    let t1 = makeST_Number()
    expect(unite(ctx, n0, t1)).toEqual(n0)
    expect(unite(ctx, t1, n0)).toEqual(n0)

    expect(unite(ctx, t0, t1)).toEqual(t0)
    expect(unite(ctx, t1, t0)).toEqual(t0)

    let x0 = makeNumberVal(0)
    expect(unite(ctx, n0, x0)).toEqual(n0)
    expect(unite(ctx, x0, n0)).toEqual(n0)

    expect(n0.same(n0)).toBeTruthy()
    expect(makeIntegerVal(11).same(makeIntegerVal(11))).toBeTruthy()
    expect(makeIntegerVal(11).same(makeIntegerVal(22))).toBeFalsy()
  })


  it('map', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({ peg: {} })
    expect(m0.canon).toEqual('{}')

    // TODO: update
    expect(unite(ctx, m0, m0).canon).toEqual('{}')

    expect(unite(ctx, m0, TOP).canon).toEqual('{}')
    expect(unite(ctx, TOP, m0).canon).toEqual('{}')

    let b0 = new Nil('test')
    expect(unite(ctx, m0, b0)).toEqual(b0)
    expect(unite(ctx, b0, m0)).toEqual(b0)

    let s0 = new StringVal({ peg: 's0' })
    expect(unite(ctx, m0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, m0) instanceof Nil).toBeTruthy()

    let n0 = makeNumberVal(0)
    expect(unite(ctx, m0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, m0) instanceof Nil).toBeTruthy()

    let t0 = makeST_String()
    expect(unite(ctx, m0, t0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, t0, m0) instanceof Nil).toBeTruthy()


    let m1 = new MapVal({ peg: { a: makeNumberVal(1) } })
    // print(m1, 'm1')
    expect(m1.canon).toEqual('{"a":1}')

    let m1u = m1.unify(TOP, ctx)
    // print(m1u, 'm1u')
    expect(m1u.canon).toEqual('{"a":1}')


    let u01 = m0.unify(m1, ctx)
    // print(u01, 'u01')
    expect(u01.canon).toEqual('{"a":1}')
    expect(m1u.canon).toEqual('{"a":1}')
    expect(m0.canon).toEqual('{}')
    expect(m1.canon).toEqual('{"a":1}')

    let u02 = m1.unify(m0, ctx)
    // print(u02, 'u02')
    expect(u02.canon).toEqual('{"a":1}')
    expect(m0.canon).toEqual('{}')
    expect(m1.canon).toEqual('{"a":1}')

  })


  it('map', () => {
    let ctx = makeCtx()

    let l0 = new ListVal({ peg: [] })
    expect(l0.canon).toEqual('[]')

    expect(unite(ctx, l0, l0).canon).toEqual('[]')
  })


  it('map-spread', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({
      peg: {
        [MapVal.SPREAD]: { o: '&', v: P('{x:1}') },
        a: P('{ y: 1 }'),
        b: P('{ y: 2 }'),
      }
    })

    expect(m0.canon).toEqual('{&:{"x":1},"a":{"y":1},"b":{"y":2}}')

    let u0 = m0.unify(TOP, ctx)
    expect(u0.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}')

  })


  it('list-spread', () => {
    let ctx = makeCtx()

    let vals: any = [
      P('{ y: 1 }'),
      P('{ y: 2 }'),
    ]
    vals[ListVal.SPREAD] = { o: '&', v: P('{x:1}') }


    let l0 = new ListVal({ peg: vals })

    expect(l0.canon).toEqual('[&:{"x":1},{"y":1},{"y":2}]')

    let u0 = l0.unify(TOP, ctx)
    expect(u0.canon).toEqual('[&:{"x":1},{"y":1,"x":1},{"y":2,"x":1}]')

  })


  it('var', () => {
    let q0 = new VarVal({ peg: 'a' })
    expect(q0.canon).toEqual('$a')


    let ctx = makeCtx()
    ctx.var.foo = makeNumberVal(11)

    let s = 'a:$foo'
    let v0 = P(s, ctx)
    expect(v0.canon).toEqual('{"a":$"foo"}')

    let g0 = G(s, ctx)
    expect(g0).toEqual({ a: 11 })
  })


  it('conjunct', () => {
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

    expect(d0.canon).toEqual('1')
    expect(d1.canon).toEqual('1&1')
    expect(d2.canon).toEqual('1&2')
    expect(d3.canon).toEqual('1&number')
    expect(d4.canon).toEqual('1&number&integer')
    expect(d5.canon).toEqual('{"a":1}')
    expect(d6.canon).toEqual('{"a":1}&{"b":2}')


    expect(unite(ctx, d0, P('1')).canon).toEqual('1')
    expect(unite(ctx, P('1', d0)).canon).toEqual('1')
    expect(unite(ctx, d0, P('2')).canon)
      .toEqual('nil')
    expect(unite(ctx, P('2'), d0).canon)
      .toEqual('nil')


    expect(unite(ctx, d0, TOP).canon).toEqual('1')
    expect(unite(ctx, TOP, d0).canon).toEqual('1')

    expect(unite(ctx, d1, TOP).canon).toEqual('1')
    expect(unite(ctx, TOP, d1).canon).toEqual('1')

    expect(unite(ctx, d2, TOP).canon)
      .toEqual('nil')
    expect(unite(ctx, TOP, d2).canon)
      .toEqual('nil')

    expect(unite(ctx, d3, TOP).canon).toEqual('1')
    expect(unite(ctx, TOP, d3).canon).toEqual('1')


    // TODO: term order is swapped by ConjunctVal impl - should be preserved
    expect(unite(ctx, d100, TOP).canon).toEqual('1')
    expect(unite(ctx, TOP, d100).canon).toEqual('1')

    // TODO: same for DisjunctVal
    expect(unite(ctx, new ConjunctVal({ peg: [] }), TOP).canon).toEqual('top')

    expect(unite(ctx, P('1 & .a')).canon).toEqual('1&.a')
    expect(unite(ctx, P('.a & 1')).canon).toEqual('1&.a')

    expect(unite(ctx, P('1 & 1 & .a')).canon).toEqual('1&.a')

    expect(unite(ctx, P('1 & 2')).canon).toEqual('nil')
    expect(unite(ctx, P('1 & 1 & 2')).canon).toEqual('nil')
    expect(unite(ctx, P('1 & 1 & .a & 2')).canon).toEqual('nil')

    expect(unite(ctx, P('1 & 1 & .a & .b')).canon).toEqual('1&.a&.b')

    expect(unite(ctx, P('1 & 1 & .a & 1 & .b & 1')).canon).toEqual('1&.a&.b')
  })


  it('disjunct', () => {
    let ctx = makeCtx()

    let d1 = new DisjunctVal({ peg: [P('1'), P('2')] })

    expect(unite(ctx, d1, P('2')).canon).toEqual('2')

    expect(unite(ctx, P('1|number')).canon).toEqual('1|number')
    expect(unite(ctx, P('1|top')).canon).toEqual('1|top')
    expect(unite(ctx, P('1|number|top')).canon).toEqual('1|number|top')

    expect(unite(ctx, P('1|number')).gen()).toEqual(1)
    // expect(unite(ctx, P('1|number|top')).gen()).toEqual(undefined)
    expect(unite(ctx, P('1|number|top')).gen()).toEqual(1)

    expect(unite(ctx, P('number|1').unify(P('top'))).canon).toEqual('number|1')

    expect(unite(ctx, P('1|number|1').unify(P('top'))).canon).toEqual('1|number')

    expect(unite(ctx, P('number|string').unify(P('top'))).canon)
      .toEqual('number|string')

    expect(unite(ctx, P('number|string').unify(P('1'))).canon).toEqual('1')
    expect(unite(ctx, P('number|1').unify(P('1'))).canon).toEqual('1')


    expect(unite(ctx, P('number|1').unify(P('number|1'))).canon).toEqual('number|1')
    expect(unite(ctx, P('1|number').unify(P('1|number'))).canon).toEqual('1|number')
    expect(unite(ctx, P('number|1').unify(P('1|number'))).canon).toEqual('1|number')

    expect(unite(ctx, P('number|1').unify(P('number|string'))).canon)
      .toEqual('number|1')
    expect(unite(ctx, P('number|string').unify(P('boolean|number'))).canon)
      .toEqual('number')

    expect(unite(ctx, P('number|*1').unify(P('number|*1'))).canon)
      .toEqual('number|*1')


    let u0 = unite(ctx, P('number|*1'), P('number'))
    expect(u0.canon).toEqual('number|*1')
    expect(u0.gen()).toEqual(1)

    let u1 = unite(ctx, P('number|*1'), P('number|string'))
    expect(u1.canon).toEqual('number|*1')
    expect(u1.gen()).toEqual(1)

    let u2 = unite(ctx, P('number|*1'), P('2'))
    expect(u2.canon).toEqual('2')
    expect(u2.gen()).toEqual(2)
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
        g = []; console.log(m0.gen())
  
        let c0 = new Context({ root: m0 })
        let u0 = m0.unify(TOP, c0)
  
        g = []; console.log(u0.gen())
  
        let c0a = new Context({ root: u0 })
        let u0a = u0.unify(TOP, c0a)
  
        g = []; console.log(u0a.gen())
    */

    let m1 = P(`
  u: { x: 1, y: number}
  q: a: .u
  w: b: .q.a & {y:2, z: 3}
  `)

    let u1a = m1.unify(TOP, new Context({ root: m1 }))
    let u1b = u1a.unify(TOP, new Context({ root: u1a }))
  })


  it('unify', () => {
    let m0 = (P(`
  a: 1
  b: .a
  c: .x
  `, { xlog: -1 }) as MapVal)

    expect(m0.canon).toEqual('{"a":1,"b":.a,"c":.x}')

    let c0 = new Context({
      root: m0
    })

    let m0u = m0.unify(TOP, c0)
    expect(m0u.canon).toEqual('{"a":1,"b":1,"c":.x}')


    let m1 = (P(`
  a: .b.c
  b: c: 1
  `, { xlog: -1 }) as MapVal)

    let c1 = new Context({
      root: m1
    })

    let m1u = m1.unify(TOP, c1)
    expect(m1u.canon).toEqual('{"a":1,"b":{"c":1}}')


    let m2 = (P(`
a: {x:1}
b: { &: $.a }
b: c0: {n:0}
b: c1: {n:1}
b: c2: {n:2}
`
      ,) as MapVal)

    expect(m2.canon)
      .toEqual('{"a":{"x":1},"b":{&:$.a}&{"c0":{"n":0}}&{"c1":{"n":1}}&{"c2":{"n":2}}}')

    expect(m2.peg.b.constructor.name).toEqual('ConjunctVal')
    expect(m2.peg.b.peg.length).toEqual(4)

    let c2 = new Context({
      root: m2
    })

    let m2u = m2.unify(TOP, c2)
    expect(m2u.canon)
      // .toEqual('{"a":{"x":1},"b":{&:{"x":1},"c0":{"n":0,"x":1},"c1":{"n":1,"x":1},"c2":{"n":2,"x":1}}}')
      .toEqual('{"a":{"x":1},"b":{&:$.a,"c0":{"x":1,"n":0},"c1":{"x":1,"n":1},"c2":{"x":1,"n":2}}}')

  })




  it('repeat-spread', () => {
    let ctx = makeCtx()

    expect(G('p:a:b:&:n:1 p:a:b:c:{}', ctx)).toEqual({
      p: { a: { b: { c: { n: 1 } } } }
    })

    expect(G('p:a:&:&:n:1 p:a:b:c:{}', ctx)).toEqual({
      p: { a: { b: { c: { n: 1 } } } }
    })

    expect(G('p:a:b:&:n:.$KEY p:a:b:c:{}', ctx)).toEqual({
      p: { a: { b: { c: { n: 'c' } } } }
    })

    expect(G('p:a:&:&:n:.$KEY p:a:b:c:{}', ctx)).toEqual({
      p: { a: { b: { c: { n: 'c' } } } }
    })
  })


  it('operator-plus', () => {
    let ctx = makeCtx()

    expect(G('a:1+2', ctx)).toEqual({ a: 3 })
    expect(G('a:"b"+"c"', ctx)).toEqual({ a: 'bc' })
    expect(G('a:"1"+2', ctx)).toEqual({ a: '12' })
    expect(G('a:1,b:$.a+3', ctx)).toEqual({ a: 1, b: 4 })
    expect(G('a:"A",b:B+$.a', ctx)).toEqual({ a: 'A', b: 'BA' })

    expect(P('a:1+2', ctx).canon).toEqual('{"a":1+2}')
    expect(P('a:"b"+"c"', ctx).canon).toEqual('{"a":"b"+"c"}')
  })


  it('null-val', () => {
    let ctx = makeCtx()

    expect(G('a:null', ctx)).toEqual({ a: null })
    expect(G('[null]', ctx)).toEqual([null])
    expect(G('null', ctx)).toEqual(null)

    expect(P('a:null', ctx).canon).toEqual('{"a":null}')
    expect(P('[null]', ctx).canon).toEqual('[null]')
    expect(P('null', ctx).canon).toEqual('null')
  })



  it('pref', () => {
    let ctx = makeCtx()

    let p0 = new PrefVal({ peg: new StringVal({ peg: 'p0' }) })
    expect(p0.canon).toEqual('*"p0"')
    expect(p0.gen()).toEqual('p0')

    let pu0 = p0.unify(TOP, ctx)
    expect(pu0).toMatchObject({
      done: -1,
      row: -1,
      col: -1,
      url: '',

      // FIX: use jest toMatchObject
      // peg: {
      //   done: -1,
      //   row: -1,
      //   col: -1,
      //   url: '',
      //   peg: 'p0',
      //   path: [],
      //   type: String,
      // },
      // path: [],
      // pref: {
      //   done: -1,
      //   row: -1,
      //   col: -1,
      //   url: '',
      //   peg: 'p0',
      //   path: [],
      //   type: String,
      // }
    })




    p0.peg = makeST_String()
    expect(p0.canon).toEqual('*"p0"')
    expect(p0.gen()).toEqual('p0')

    // p0.pref = new Nil([], 'test:pref')
    // expect(p0.canon).toEqual('string')
    // expect(p0.gen([])).toEqual(undefined)

    // p0.peg = new Nil([], 'test:val')
    // expect(p0.canon).toEqual('nil')
    // expect(p0.gen([])).toEqual(undefined)



    let p1 = new PrefVal({ peg: new StringVal({ peg: 'p1' }) })
    let p2 = new PrefVal({ peg: makeST_String() })

    let up12 = p1.unify(p2, ctx)
    expect(up12.canon).toEqual('*"p1"')

    let up21 = p2.unify(p1, ctx)
    expect(up21.canon).toEqual('*"p1"')

    let up2s0 = p2.unify(new StringVal({ peg: 's0' }), ctx)
    expect(up2s0.canon).toEqual('*"s0"')

    // NOTE: once made concrete a prefval is fixed
    expect(up2s0.unify(new StringVal({ peg: 's1' }), ctx).canon)
      .toEqual('nil')




    // let u0 = P('1|number').unify(TOP, ctx)

    // let u1 = P('*1|number').unify(TOP, ctx)


    expect(UC('a:1')).toEqual('{"a":1}')
    expect(UC('a:1,b:.a')).toEqual('{"a":1,"b":1}')
    expect(UC('a:*1|number,b:2,c:.a&.b')).toEqual('{"a":*1|number,"b":2,"c":2}')
    expect(UC('a:*1|number,b:top,c:.a&.b'))
      .toEqual('{"a":*1|number,"b":top,"c":*1|number}')

    expect(UC('a:*1|number,a:*2|number'))
      .toEqual('{"a":*2|*1|number}')

    expect(UC('a:*1|number,b:*2|number,c:.a&.b'))
      .toEqual('{"a":*1|number,"b":*2|number,"c":*2|*1|number}')


    let d0 = P('1|number').unify(TOP, ctx)
    expect(d0.canon).toEqual('1|number')
    expect(d0.gen()).toEqual(1)


    expect(G('number|*1')).toEqual(1)
    expect(G('string|*1')).toEqual(1)

    // expect(G('a:*1,a:2')).toEqual({ a: undefined })
    expect(() => G('a:*1,a:2')).toThrow()
    // expect(G('*1 & 2')).toEqual(undefined)
    expect(() => G('*1 & 2')).toThrow()

    expect(G('true|*true')).toEqual(true)
    expect(G('*true|true')).toEqual(true)
    expect(G('*true|*true')).toEqual(true)
    expect(G('*true|*true|*true')).toEqual(true)

    expect(G('true&*true')).toEqual(true)
    expect(G('*true&true')).toEqual(true)
    expect(G('*true&*true')).toEqual(true)


    expect(G('{a:2}&{a:number|*1}')).toEqual({ a: 2 })
    expect(G('{&:number}&{a:2}&{a:number|*1}')).toEqual({ a: 2 })
    expect(G('{a:{&:{c:number|*1}}} & {a:{b:{c:2}}}')).toEqual({ a: { b: { c: 2 } } })
    expect(G('{a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .toEqual({ a: { b: { c: 2, d: true } } })
    expect(G('x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .toEqual({ x: { a: { b: { c: 2, d: true } } } })
    expect(G('x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .toEqual({ x: { a: { b: { c: 2, d: true } } } })

    expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true } } } })
    expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } })

    expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true } } } })
    expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } })
    expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
      ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
      .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } })


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
  `)).toEqual({
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
  `)).toEqual({
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


function print(o: any, t?: string) {
  if (null != t) {
    console.log(t)
  }
  console.dir(o, { depth: null })
}


function makeCtx(r?: any) {
  return new Context({ root: r || new MapVal({ peg: {} }) })
}
