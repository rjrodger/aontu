


import type {
  Val
} from '../lib/type'

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
import { MapVal } from '../lib/val/MapVal'
import { ListVal } from '../lib/val/ListVal'
import { PrefVal } from '../lib/val/PrefVal'
import { RefVal } from '../lib/val/RefVal'
import { Nil } from '../lib/val/Nil'


import {
  Integer,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
} from '../lib/val'


import {
  TOP
} from '../lib/type'


const lang = new Lang()
const PL = lang.parse.bind(lang)
const P = (x: string, ctx?: any) => PL(x, ctx)
const PA = (x: string[], ctx?: any) => x.map(s => PL(s, ctx))
const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r))?.canon
const G = (x: string, ctx?: any) => new Unify(x, lang).res.gen()



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
    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(String))).toBeTruthy()
    expect(new ScalarTypeVal(Number).same(new ScalarTypeVal(Number))).toBeTruthy()
    expect(new ScalarTypeVal(Boolean).same(new ScalarTypeVal(Boolean))).toBeTruthy()
    expect(new ScalarTypeVal(Integer).same(new ScalarTypeVal(Integer))).toBeTruthy()

    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(Number))).toBeFalsy()
    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(Boolean))).toBeFalsy()
    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(Integer))).toBeFalsy()

    expect(new ScalarTypeVal(Number).same(new ScalarTypeVal(Boolean))).toBeFalsy()
    expect(new ScalarTypeVal(Number).same(new ScalarTypeVal(Integer))).toBeFalsy()

    expect(new ScalarTypeVal(Integer).same(new ScalarTypeVal(Boolean))).toBeFalsy()
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

    let bs = new ScalarTypeVal(Boolean)
    expect(unite(ctx, bt, bs)).toEqual(bt)
    expect(unite(ctx, bs, bt)).toEqual(bt)

    let n0 = new NumberVal(1)
    expect(unite(ctx, bt, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, bf, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, bt) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, bf) instanceof Nil).toBeTruthy()

    expect(bt.same(bt)).toBeTruthy()
    expect(bf.same(bf)).toBeTruthy()
    expect(bt.same(bf)).toBeFalsy()

    expect(new BooleanVal(true).same(new BooleanVal(true))).toBeTruthy()
    expect(new BooleanVal(false).same(new BooleanVal(false))).toBeTruthy()
    expect(new BooleanVal(true).same(new BooleanVal(false))).toBeFalsy()
  })


  it('string', () => {
    let ctx = makeCtx()

    let s0 = new StringVal('s0')
    let s1 = new StringVal('s1')

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

    let t0 = new ScalarTypeVal(String)
    expect(unite(ctx, s0, t0)).toEqual(s0)
    expect(unite(ctx, t0, s0)).toEqual(s0)

    let n0 = new NumberVal(1)
    expect(unite(ctx, s0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s1, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, s1) instanceof Nil).toBeTruthy()

    expect(s0.same(s0)).toBeTruthy()
    expect(new StringVal('a').same(new StringVal('a'))).toBeTruthy()
    expect(new StringVal('a').same(new StringVal('b'))).toBeFalsy()
  })


  it('number', () => {
    let ctx = makeCtx()

    let n0 = new NumberVal(0, ctx)
    let n1 = new NumberVal(1.1, ctx)

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

    let t0 = new ScalarTypeVal(Number)
    expect(unite(ctx, n0, t0)).toEqual(n0)
    expect(unite(ctx, t0, n0)).toEqual(n0)

    let s0 = new StringVal('s0')
    expect(unite(ctx, n0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n1, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n1) instanceof Nil).toBeTruthy()

    expect(n0.same(n0)).toBeTruthy()
    expect(new NumberVal(11).same(new NumberVal(11))).toBeTruthy()
    expect(new NumberVal(11).same(new NumberVal(22))).toBeFalsy()

  })



  it('integer', () => {
    let ctx = makeCtx()

    let n0 = new IntegerVal(0)
    let n1 = new IntegerVal(1)

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

    let s0 = new StringVal('s0')
    expect(unite(ctx, n0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n1, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, n1) instanceof Nil).toBeTruthy()

    let t0 = new ScalarTypeVal(Integer)
    expect(unite(ctx, n0, t0)).toEqual(n0)
    expect(unite(ctx, t0, n0)).toEqual(n0)

    let t1 = new ScalarTypeVal(Number)
    expect(unite(ctx, n0, t1)).toEqual(n0)
    expect(unite(ctx, t1, n0)).toEqual(n0)

    expect(unite(ctx, t0, t1)).toEqual(t0)
    expect(unite(ctx, t1, t0)).toEqual(t0)

    let x0 = new NumberVal(0)
    expect(unite(ctx, n0, x0)).toEqual(n0)
    expect(unite(ctx, x0, n0)).toEqual(n0)

    expect(n0.same(n0)).toBeTruthy()
    expect(new IntegerVal(11).same(new IntegerVal(11))).toBeTruthy()
    expect(new IntegerVal(11).same(new IntegerVal(22))).toBeFalsy()
  })


  it('map', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({})
    expect(m0.canon).toEqual('{}')

    // TODO: update
    expect(unite(ctx, m0, m0).canon).toEqual('{}')

    expect(unite(ctx, m0, TOP).canon).toEqual('{}')
    expect(unite(ctx, TOP, m0).canon).toEqual('{}')

    let b0 = new Nil('test')
    expect(unite(ctx, m0, b0)).toEqual(b0)
    expect(unite(ctx, b0, m0)).toEqual(b0)

    let s0 = new StringVal('s0')
    expect(unite(ctx, m0, s0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, s0, m0) instanceof Nil).toBeTruthy()

    let n0 = new NumberVal(0)
    expect(unite(ctx, m0, n0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, n0, m0) instanceof Nil).toBeTruthy()

    let t0 = new ScalarTypeVal(String)
    expect(unite(ctx, m0, t0) instanceof Nil).toBeTruthy()
    expect(unite(ctx, t0, m0) instanceof Nil).toBeTruthy()


    let m1 = new MapVal({ a: new NumberVal(1) })
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

    let l0 = new ListVal([])
    expect(l0.canon).toEqual('[]')

    expect(unite(ctx, l0, l0).canon).toEqual('[]')
  })


  it('map-spread', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({
      [MapVal.SPREAD]: { o: '&', v: P('{x:1}') },
      a: P('{ y: 1 }'),
      b: P('{ y: 2 }'),
    })

    // console.dir(m0, { depth: null })

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


    let l0 = new ListVal(vals)

    // console.dir(l0, { depth: null })

    expect(l0.canon).toEqual('[&:{"x":1},{"y":1},{"y":2}]')

    let u0 = l0.unify(TOP, ctx)
    expect(u0.canon).toEqual('[&:{"x":1},{"y":1,"x":1},{"y":2,"x":1}]')

  })



  /*
  it('map-merge', () => {
    let ctx = makeCtx()

    let m0 = P('a:{x:1},a:{y:2}')

    console.dir(m0, { depth: null })

    //expect(m0.canon).toEqual('{&:{"x":1},"a":{"y":1},"b":{"y":2}}')

    //let u0 = m0.unify(TOP, ctx)
    //expect(u0.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}')
  })
  */



  it('conjunct', () => {
    let ctx = makeCtx(new MapVal({ x: new IntegerVal(1) }))

    let d0 = new ConjunctVal(PA(['1']))
    let d1 = new ConjunctVal(PA(['1', '1']))
    let d2 = new ConjunctVal(PA(['1', '2']))
    let d3 = new ConjunctVal(PA(['1', 'number']))
    let d4 = new ConjunctVal(PA(['1', 'number', 'integer']))
    let d5 = new ConjunctVal(PA(['{a:1}']))
    let d6 = new ConjunctVal(PA(['{a:1}', '{b:2}']))

    // let d100 = new ConjunctVal([new IntegerVal(1), new RefVal('/x')])
    let d100 = new ConjunctVal([new IntegerVal(1), new RefVal(['$', 'x'])])

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
    expect(unite(ctx, new ConjunctVal([]), TOP).canon).toEqual('top')

    expect(unite(ctx, P('1 & .a')).canon).toEqual('1&.a')
    expect(unite(ctx, P('1 & 1 & .a')).canon).toEqual('1&.a')
    expect(unite(ctx, P('1 & 1 & .a & 2')).canon).toEqual('1&.a&2')
    expect(unite(ctx, P('1 & 1 & .a & 2 & .b')).canon).toEqual('1&.a&2&.b')
    expect(unite(ctx, P('1 & 1 & .a & 2 & .b & 3')).canon).toEqual('1&.a&2&.b&3')
  })


  it('disjunct', () => {
    let ctx = makeCtx()

    let d1 = new DisjunctVal([P('1'), P('2')])

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

    expect(unite(ctx, P('number|*1').unify(P('number|*1'))).canon).toEqual('number|*1')


    let u0 = unite(ctx, P('number|*1'), P('number'))
    //console.dir(u0, { depth: null })
    //console.log(u0.canon)
    //console.log(u0.gen())
    expect(u0.canon).toEqual('number|*1')
    expect(u0.gen()).toEqual(1)


    let u1 = unite(ctx, P('number|*1'), P('number|string'))
    //console.dir(u1, { depth: null })
    //console.log(u1.canon)
    //console.log(u1.gen())
    expect(u1.canon).toEqual('number|*1')
    expect(u1.gen()).toEqual(1)



    let u2 = unite(ctx, P('number|*1'), P('2'))
    //console.dir(u2, { depth: null })
    //console.log(u2.canon)
    //console.log(u2.gen())
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
        console.log('m0===', m0.done, m0.canon)
        g = []; console.log(m0.gen())

        let c0 = new Context({ root: m0 })
        let u0 = m0.unify(TOP, c0)

        console.log('u0===', u0.done, u0.canon)
        g = []; console.log(u0.gen())

        let c0a = new Context({ root: u0 })
        let u0a = u0.unify(TOP, c0a)

        console.log('u0a===', u0a.done, u0a.canon)
        g = []; console.log(u0a.gen())
    */

    let m1 = P(`
  u: { x: 1, y: number}
  q: a: .u
  w: b: .q.a & {y:2, z: 3}
  `)

    let u1a = m1.unify(TOP, new Context({ root: m1 }))
    // console.log('u1a', u1a.done, u1a.canon)
    //console.dir(u1a, { depth: null })
    let u1b = u1a.unify(TOP, new Context({ root: u1a }))
    // console.log('u1b', u1b.done, u1b.canon)
    //console.dir(u1b, { depth: null })
  })


  it('unify', () => {
    let m0 = (P(`
  a: 1
  b: .a
  c: .x
  `, { xlog: -1 }) as MapVal)

    //console.dir(m0, { depth: null })
    expect(m0.canon).toEqual('{"a":1,"b":.a,"c":.x}')

    let c0 = new Context({
      root: m0
    })

    let m0u = m0.unify(TOP, c0)
    // console.dir(m0u, { depth: null })
    expect(m0u.canon).toEqual('{"a":1,"b":1,"c":.x}')


    let m1 = (P(`
  a: .b.c
  b: c: 1
  `, { xlog: -1 }) as MapVal)

    let c1 = new Context({
      root: m1
    })

    let m1u = m1.unify(TOP, c1)
    // console.dir(m1u, { depth: null })
    expect(m1u.canon).toEqual('{"a":1,"b":{"c":1}}')


    let m2 = (P(`
a: {x:1}
b: { &: .a }
b: c0: {n:0}
b: c1: {n:1}
b: c2: {n:2}
`
      ,) as MapVal)

    expect(m2.canon)
      .toEqual('{"a":{"x":1},"b":{&:.a}&{"c0":{"n":0}}&{"c1":{"n":1}}&{"c2":{"n":2}}}')

    expect(m2.peg.b.constructor.name).toEqual('ConjunctVal')
    expect(m2.peg.b.peg.length).toEqual(4)

    let c2 = new Context({
      root: m2
    })

    let m2u = m2.unify(TOP, c2)
    // console.dir(m1u, { depth: null })
    expect(m2u.canon)
      .toEqual('{"a":{"x":1},"b":{&:{"x":1},"c0":{"n":0,"x":1},"c1":{"n":1,"x":1},"c2":{"n":2,"x":1}}}')

  })


  it('pref', () => {
    let ctx = makeCtx()


    let p0 = new PrefVal(new StringVal('p0'))
    expect(p0.canon).toEqual('*"p0"')
    expect(p0.gen()).toEqual('p0')

    let pu0 = p0.unify(TOP, ctx)
    // console.log(pu0)
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




    p0.peg = new ScalarTypeVal(String)
    expect(p0.canon).toEqual('*"p0"')
    expect(p0.gen()).toEqual('p0')

    // p0.pref = new Nil([], 'test:pref')
    // expect(p0.canon).toEqual('string')
    // expect(p0.gen([])).toEqual(undefined)

    // p0.peg = new Nil([], 'test:val')
    // expect(p0.canon).toEqual('nil')
    // expect(p0.gen([])).toEqual(undefined)



    let p1 = new PrefVal(new StringVal('p1'))
    let p2 = new PrefVal(new ScalarTypeVal(String))

    let up12 = p1.unify(p2, ctx)
    expect(up12.canon).toEqual('*"p1"')

    let up21 = p2.unify(p1, ctx)
    expect(up21.canon).toEqual('*"p1"')

    let up2s0 = p2.unify(new StringVal('s0'), ctx)
    expect(up2s0.canon).toEqual('*"s0"')

    // NOTE: once made concrete a prefval is fixed
    expect(up2s0.unify(new StringVal('s1'), ctx).canon)
      .toEqual('nil')




    // let u0 = P('1|number').unify(TOP, ctx)
    // // console.log(u0)

    // let u1 = P('*1|number').unify(TOP, ctx)
    // // console.log(u1)


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
    // console.log(d0.canon)
    // console.log(d0.gen())
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
  return new Context({ root: r || new MapVal({}) })
}
