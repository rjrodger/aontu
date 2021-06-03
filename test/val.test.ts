import Lab from '@hapi/lab'
import Code from '@hapi/code'



var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect



import {
  Lang
} from '../lib/lang'

import {
  Context
} from '../lib/unify'

import {
  unite
} from '../lib/op/op'




import {
  Integer,
  TOP,
  Nil,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
  MapVal,
  DisjunctVal,
  ConjunctVal,
  RefVal,
  PrefVal,
} from '../lib/val'


let lang = new Lang()
let PL = lang.parse.bind(lang)
let P = (x: string | string[], ctx?: any) =>
  'string' === typeof (x) ? PL(x, ctx) : x.map(s => PL(s, ctx))
//let D = (x: any) => console.dir(x, { depth: null })
let UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r)).canon

describe('val', function() {
  it('canon', () => {
    expect(P('1').canon).equals('1')
    expect(P('"a"').canon).equals('"a"')
    expect(P('b').canon).equals('"b"')
    expect(P('true').canon).equals('true')
    expect(P('top').canon).equals('top')
    expect(P('nil').canon).startsWith('nil')
    expect(P('a:1').canon).equals('{"a":1}')
    expect(P('a:1,b:nil').canon).startsWith('{"a":1,"b":nil')
    expect(P('a:1,b:c:2').canon).equals('{"a":1,"b":{"c":2}}')


  })


  it('gen', () => {
    expect(P('1').gen()).equals(1)
    expect(P('"a"').gen()).equals('a')
    expect(P('b').gen()).equals('b')
    expect(P('true').gen()).equals(true)
    expect(P('top').gen()).equals(undefined)

    expect(P('nil').gen()).equals(undefined)
    expect(P('a:1').gen()).equals({ a: 1 })

    expect(P('a:1,b:nil').gen()).equals({ a: 1, b: undefined })

    expect(P('a:1,b:c:2').gen()).equals({ a: 1, b: { c: 2 } })


  })


  it('scalartype', () => {
    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(String))).true()
    expect(new ScalarTypeVal(Number).same(new ScalarTypeVal(Number))).true()
    expect(new ScalarTypeVal(Boolean).same(new ScalarTypeVal(Boolean))).true()
    expect(new ScalarTypeVal(Integer).same(new ScalarTypeVal(Integer))).true()

    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(Number))).false()
    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(Boolean))).false()
    expect(new ScalarTypeVal(String).same(new ScalarTypeVal(Integer))).false()

    expect(new ScalarTypeVal(Number).same(new ScalarTypeVal(Boolean))).false()
    expect(new ScalarTypeVal(Number).same(new ScalarTypeVal(Integer))).false()

    expect(new ScalarTypeVal(Integer).same(new ScalarTypeVal(Boolean))).false()
  })


  it('boolean', () => {
    let ctx = makeCtx()

    let bt = BooleanVal.TRUE
    let bf = BooleanVal.FALSE

    expect(unite(ctx, bt, bt)).equal(bt)
    expect(unite(ctx, bf, bf)).equal(bf)

    expect(unite(ctx, bt, bf)).instanceof(Nil)
    expect(unite(ctx, bf, bt)).instanceof(Nil)

    expect(unite(ctx, bt, TOP)).equal(bt)
    expect(unite(ctx, bf, TOP)).equal(bf)
    expect(unite(ctx, TOP, bt)).equal(bt)
    expect(unite(ctx, TOP, bf)).equal(bf)

    let b0 = new Nil('test')
    expect(unite(ctx, bt, b0)).equal(b0)
    expect(unite(ctx, bf, b0)).equal(b0)
    expect(unite(ctx, b0, bt)).equal(b0)
    expect(unite(ctx, b0, bf)).equal(b0)

    let bs = new ScalarTypeVal(Boolean)
    expect(unite(ctx, bt, bs)).equal(bt)
    expect(unite(ctx, bs, bt)).equal(bt)

    let n0 = new NumberVal(1)
    expect(unite(ctx, bt, n0)).instanceof(Nil)
    expect(unite(ctx, bf, n0)).instanceof(Nil)
    expect(unite(ctx, n0, bt)).instanceof(Nil)
    expect(unite(ctx, n0, bf)).instanceof(Nil)

    expect(bt.same(bt)).true()
    expect(bf.same(bf)).true()
    expect(bt.same(bf)).false()

    expect(new BooleanVal(true).same(new BooleanVal(true))).true()
    expect(new BooleanVal(false).same(new BooleanVal(false))).true()
    expect(new BooleanVal(true).same(new BooleanVal(false))).false()
  })


  it('string', () => {
    let ctx = makeCtx()

    let s0 = new StringVal('s0')
    let s1 = new StringVal('s1')

    expect(unite(ctx, s0, s0)).equal(s0)
    expect(unite(ctx, s1, s1)).equal(s1)

    expect(unite(ctx, s0, s1)).instanceof(Nil)
    expect(unite(ctx, s1, s0)).instanceof(Nil)

    expect(unite(ctx, s0, TOP)).equal(s0)
    expect(unite(ctx, s1, TOP)).equal(s1)
    expect(unite(ctx, TOP, s0)).equal(s0)
    expect(unite(ctx, TOP, s1)).equal(s1)

    let b0 = new Nil('test')
    expect(unite(ctx, s0, b0)).equal(b0)
    expect(unite(ctx, s1, b0)).equal(b0)
    expect(unite(ctx, b0, s0)).equal(b0)
    expect(unite(ctx, b0, s1)).equal(b0)

    let t0 = new ScalarTypeVal(String)
    expect(unite(ctx, s0, t0)).equal(s0)
    expect(unite(ctx, t0, s0)).equal(s0)

    let n0 = new NumberVal(1)
    expect(unite(ctx, s0, n0)).instanceof(Nil)
    expect(unite(ctx, s1, n0)).instanceof(Nil)
    expect(unite(ctx, n0, s0)).instanceof(Nil)
    expect(unite(ctx, n0, s1)).instanceof(Nil)

    expect(s0.same(s0)).true()
    expect(new StringVal('a').same(new StringVal('a'))).true()
    expect(new StringVal('a').same(new StringVal('b'))).false()
  })


  it('number', () => {
    let ctx = makeCtx()

    let n0 = new NumberVal(0, ctx)
    let n1 = new NumberVal(1.1, ctx)

    expect(unite(ctx, n0, n0)).equal(n0)

    expect(unite(ctx, n0, n0)).equal(n0)
    expect(unite(ctx, n1, n1)).equal(n1)

    expect(unite(ctx, n0, n1)).instanceof(Nil)
    expect(unite(ctx, n1, n0)).instanceof(Nil)

    expect(unite(ctx, n0, TOP)).equal(n0)
    expect(unite(ctx, n1, TOP)).equal(n1)
    expect(unite(ctx, TOP, n0)).equal(n0)
    expect(unite(ctx, TOP, n1)).equal(n1)

    let b0 = new Nil('test')
    expect(unite(ctx, n0, b0)).equal(b0)
    expect(unite(ctx, n1, b0)).equal(b0)
    expect(unite(ctx, b0, n0)).equal(b0)
    expect(unite(ctx, b0, n1)).equal(b0)

    let t0 = new ScalarTypeVal(Number)
    expect(unite(ctx, n0, t0)).equal(n0)
    expect(unite(ctx, t0, n0)).equal(n0)

    let s0 = new StringVal('s0')
    expect(unite(ctx, n0, s0)).instanceof(Nil)
    expect(unite(ctx, n1, s0)).instanceof(Nil)
    expect(unite(ctx, s0, n0)).instanceof(Nil)
    expect(unite(ctx, s0, n1)).instanceof(Nil)

    expect(n0.same(n0)).true()
    expect(new NumberVal(11).same(new NumberVal(11))).true()
    expect(new NumberVal(11).same(new NumberVal(22))).false()

  })



  it('integer', () => {
    let ctx = makeCtx()

    let n0 = new IntegerVal(0)
    let n1 = new IntegerVal(1)

    expect(unite(ctx, n0, n0)).equal(n0)
    expect(unite(ctx, n1, n1)).equal(n1)

    expect(unite(ctx, n0, n1)).instanceof(Nil)
    expect(unite(ctx, n1, n0)).instanceof(Nil)

    expect(unite(ctx, n0, TOP)).equal(n0)
    expect(unite(ctx, n1, TOP)).equal(n1)
    expect(unite(ctx, TOP, n0)).equal(n0)
    expect(unite(ctx, TOP, n1)).equal(n1)

    let b0 = new Nil('test')
    expect(unite(ctx, n0, b0)).equal(b0)
    expect(unite(ctx, n1, b0)).equal(b0)
    expect(unite(ctx, b0, n0)).equal(b0)
    expect(unite(ctx, b0, n1)).equal(b0)

    let s0 = new StringVal('s0')
    expect(unite(ctx, n0, s0)).instanceof(Nil)
    expect(unite(ctx, n1, s0)).instanceof(Nil)
    expect(unite(ctx, s0, n0)).instanceof(Nil)
    expect(unite(ctx, s0, n1)).instanceof(Nil)

    let t0 = new ScalarTypeVal(Integer)
    expect(unite(ctx, n0, t0)).equal(n0)
    expect(unite(ctx, t0, n0)).equal(n0)

    let t1 = new ScalarTypeVal(Number)
    expect(unite(ctx, n0, t1)).equal(n0)
    expect(unite(ctx, t1, n0)).equal(n0)

    expect(unite(ctx, t0, t1)).equal(t0)
    expect(unite(ctx, t1, t0)).equal(t0)

    let x0 = new NumberVal(0)
    expect(unite(ctx, n0, x0)).equal(n0)
    expect(unite(ctx, x0, n0)).equal(n0)

    expect(n0.same(n0)).true()
    expect(new IntegerVal(11).same(new IntegerVal(11))).true()
    expect(new IntegerVal(11).same(new IntegerVal(22))).false()
  })


  it('map', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({})
    expect(m0.canon).equals('{}')

    // TODO: update
    expect(unite(ctx, m0, m0).canon).equal('{}')

    expect(unite(ctx, m0, TOP).canon).equal('{}')
    expect(unite(ctx, TOP, m0).canon).equal('{}')

    let b0 = new Nil('test')
    expect(unite(ctx, m0, b0)).equal(b0)
    expect(unite(ctx, b0, m0)).equal(b0)

    let s0 = new StringVal('s0')
    expect(unite(ctx, m0, s0)).instanceof(Nil)
    expect(unite(ctx, s0, m0)).instanceof(Nil)

    let n0 = new NumberVal(0)
    expect(unite(ctx, m0, n0)).instanceof(Nil)
    expect(unite(ctx, n0, m0)).instanceof(Nil)

    let t0 = new ScalarTypeVal(String)
    expect(unite(ctx, m0, t0)).instanceof(Nil)
    expect(unite(ctx, t0, m0)).instanceof(Nil)


    let m1 = new MapVal({ a: new NumberVal(1) })
    print(m1, 'm1')
    expect(m1.canon).equals('{"a":1}')

    let m1u = m1.unify(TOP, ctx)
    print(m1u, 'm1u')
    expect(m1u.canon).equals('{"a":1}')


    let u01 = m0.unify(m1, ctx)
    print(u01, 'u01')
    expect(m1u.canon).equals('{"a":1}')
    expect(m0.canon).equals('{}')
    expect(m1.canon).equals('{"a":1}')

    let u02 = m1.unify(m0, ctx)
    print(u02, 'u02')
    expect(u02.canon).equals('{"a":1}')
    expect(m0.canon).equals('{}')
    expect(m1.canon).equals('{"a":1}')

  })



  it('map-spread', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({
      [MapVal.SPREAD]: { o: '&', v: P('{x:1}') },
      a: P('{ y: 1 }'),
      b: P('{ y: 2 }'),
    })

    //console.dir(m0, { depth: null })

    expect(m0.canon).equals('{&={"x":1},"a":{"y":1},"b":{"y":2}}')

    let u0 = m0.unify(TOP, ctx)
    expect(u0.canon).equals('{&={"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}')
  })



  /*
  it('map-merge', () => {
    let ctx = makeCtx()

    let m0 = P('a:{x:1},a:{y:2}')

    console.dir(m0, { depth: null })

    //expect(m0.canon).equals('{&={"x":1},"a":{"y":1},"b":{"y":2}}')

    //let u0 = m0.unify(TOP, ctx)
    //expect(u0.canon).equals('{&={"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}')
  })
  */



  it('conjunct', () => {
    let ctx = makeCtx(new MapVal({ x: new IntegerVal(1) }))

    let d0 = new ConjunctVal(P(['1']))
    let d1 = new ConjunctVal(P(['1', '1']))
    let d2 = new ConjunctVal(P(['1', '2']))
    let d3 = new ConjunctVal(P(['1', 'number']))
    let d4 = new ConjunctVal(P(['1', 'number', 'integer']))
    let d5 = new ConjunctVal(P(['{a:1}']))
    let d6 = new ConjunctVal(P(['{a:1}', '{b:2}']))

    let d100 = new ConjunctVal([new IntegerVal(1), new RefVal('/x')])

    expect(d0.canon).equals('1')
    expect(d1.canon).equals('1&1')
    expect(d2.canon).equals('1&2')
    expect(d3.canon).equals('1&number')
    expect(d4.canon).equals('1&number&integer')
    expect(d5.canon).equals('{"a":1}')
    expect(d6.canon).equals('{"a":1}&{"b":2}')


    expect(unite(ctx, d0, P('1')).canon).equal('1')
    expect(unite(ctx, P('1', d0)).canon).equal('1')
    expect(unite(ctx, d0, P('2')).canon)
      .equal('nil')
    expect(unite(ctx, P('2'), d0).canon)
      .equal('nil')


    expect(unite(ctx, d0, TOP).canon).equal('1')
    expect(unite(ctx, TOP, d0).canon).equal('1')

    expect(unite(ctx, d1, TOP).canon).equal('1')
    expect(unite(ctx, TOP, d1).canon).equal('1')

    expect(unite(ctx, d2, TOP).canon)
      .equal('nil')
    expect(unite(ctx, TOP, d2).canon)
      .equal('nil')

    expect(unite(ctx, d3, TOP).canon).equal('1')
    expect(unite(ctx, TOP, d3).canon).equal('1')


    // TODO: term order is swapped by ConjunctVal impl - should be preserved
    expect(unite(ctx, d100, TOP).canon).equal('1')
    expect(unite(ctx, TOP, d100).canon).equal('1')

    // TODO: same for DisjunctVal
    expect(unite(ctx, new ConjunctVal([]), TOP).canon).equal('top')
  })


  it('disjunct', () => {
    let ctx = makeCtx()

    let d1 = new DisjunctVal([P('1'), P('2')])

    expect(unite(ctx, d1, P('2')).canon).equal('2')

    expect(unite(ctx, P('1|number')).canon).equals('1|number')
    expect(unite(ctx, P('1|top')).canon).equals('1|top')
    expect(unite(ctx, P('1|number|top')).canon).equals('1|number|top')

    expect(unite(ctx, P('1|number')).gen()).equals(1)
    expect(unite(ctx, P('1|number|top')).gen()).equals(undefined)

    expect(unite(ctx, P('number|1').unify(P('top'))).canon).equals('number|1')

    expect(unite(ctx, P('1|number|1').unify(P('top'))).canon).equals('1|number')

    expect(unite(ctx, P('number|string').unify(P('top'))).canon)
      .equals('number|string')

    expect(unite(ctx, P('number|string').unify(P('1'))).canon).equals('1')
    expect(unite(ctx, P('number|1').unify(P('1'))).canon).equals('1')


    expect(unite(ctx, P('number|1').unify(P('number|1'))).canon).equal('number|1')
    expect(unite(ctx, P('1|number').unify(P('1|number'))).canon).equals('1|number')
    expect(unite(ctx, P('number|1').unify(P('1|number'))).canon).equals('1|number')

    expect(unite(ctx, P('number|1').unify(P('number|string'))).canon)
      .equals('number|1')
    expect(unite(ctx, P('number|string').unify(P('boolean|number'))).canon)
      .equals('number')



    let u0 = unite(ctx, P('number|*1'), P('number'))
    //console.dir(u0, { depth: null })
    //console.log(u0.canon)
    //console.log(u0.gen())
    expect(u0.canon).equals('number|*1')
    expect(u0.gen()).equals(1)


    let u1 = unite(ctx, P('number|*1'), P('number|string'))
    //console.dir(u1, { depth: null })
    //console.log(u1.canon)
    //console.log(u1.gen())
    expect(u1.canon).equals('number|*1')
    expect(u1.gen()).equals(1)



    let u2 = unite(ctx, P('number|*1'), P('2'))
    //console.dir(u2, { depth: null })
    //console.log(u2.canon)
    //console.log(u2.gen())
    expect(u2.canon).equals('2')
    expect(u2.gen()).equals(2)

  })



  it('ref', () => {
    let ctx = makeCtx()

    let d0 = new RefVal('a')
    let d1 = new RefVal('/c')
    let d2 = new RefVal('a/b')
    let d3 = new RefVal('/c/d/e')

    expect(d0.canon).equals('a')
    expect(d1.canon).equals('/c')
    expect(d2.canon).equals('a/b')
    expect(d3.canon).equals('/c/d/e')

    d0.append('x')
    d1.append('x')
    d2.append('x')
    d3.append('x')

    expect(d0.canon).equals('a/x')
    expect(d1.canon).equals('/c/x')
    expect(d2.canon).equals('a/b/x')
    expect(d3.canon).equals('/c/d/e/x')

    expect(d0.unify(TOP, ctx).canon).equal('a/x')
    expect(TOP.unify(d0, ctx).canon).equal('a/x')
    expect(d1.unify(TOP, ctx).canon).equal('/c/x')
    expect(TOP.unify(d1, ctx).canon).equal('/c/x')

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
q: a: /u
w: b: /q/a & {y:2, z: 3}
`)

    let u1a = m1.unify(TOP, new Context({ root: m1 }))
    console.log('u1a', u1a.done, u1a.canon)
    //console.dir(u1a, { depth: null })
    let u1b = u1a.unify(TOP, new Context({ root: u1a }))
    console.log('u1b', u1b.done, u1b.canon)
    //console.dir(u1b, { depth: null })
  })


  it('unify', () => {
    let m0 = (P(`
a: 1
b: /a
c: /x
`, { xlog: -1 }) as MapVal)

    //console.dir(m0, { depth: null })
    expect(m0.canon).equals('{"a":1,"b":/a,"c":/x}')

    let c0 = new Context({
      root: m0
    })

    let m0u = m0.unify(TOP, c0)
    // console.dir(m0u, { depth: null })
    expect(m0u.canon).equals('{"a":1,"b":1,"c":/x}')


    let m1 = (P(`
a: /b/c
b: c: 1
`, { xlog: -1 }) as MapVal)

    let c1 = new Context({
      root: m1
    })

    let m1u = m1.unify(TOP, c1)
    console.dir(m1u, { depth: null })
    expect(m1u.canon).equals('{"a":1,"b":{"c":1}}')
  })


  it('pref', () => {
    let ctx = makeCtx()



    let p0 = new PrefVal(new StringVal('p0'))
    expect(p0.canon).equals('*"p0"')
    expect(p0.gen([])).equals('p0')

    let pu0 = p0.unify(TOP, ctx)
    console.log(pu0)

    return;

    /*
    
    p0.peg = new ScalarTypeVal(String)
    expect(p0.canon).equals('*"p0"')
    expect(p0.gen([])).equals('p0')
  
    p0.pref = new Nil([], 'test:pref')
    expect(p0.canon).equals('string')
    expect(p0.gen([])).equals(undefined)
  
    p0.peg = new Nil([], 'test:val')
    expect(p0.canon).equals('nil')
    expect(p0.gen([])).equals(undefined)
  
    let p1 = new PrefVal(new StringVal('p1'))
    let p2 = new PrefVal(new ScalarTypeVal(String))
  
    let up12 = p1.unify(p2, ctx)
    expect(up12.canon).equals('*"p1"')
  
    let up21 = p2.unify(p1, ctx)
    expect(up21.canon).equals('*"p1"')
  
    let up2s0 = p2.unify(new StringVal('s0'), ctx)
    expect(up2s0.canon).equals('*"s0"')
  
    // NOTE: once made concrete a prefval is fixed
    expect(up2s0.unify(new StringVal('s1'), ctx).canon)
      .equals('nil')
  



    let u0 = P('1|number').unify(TOP, ctx)
    console.log(u0)

    let u1 = P('*1|number').unify(TOP, ctx)
    console.log(u1)


    expect(UC('a:1')).equals('{"a":1}')
    expect(UC('a:1,b:/a')).equals('{"a":1,"b":1}')
    expect(UC('a:*1|number,b:2,c:/a&/b')).equals('{"a":*1|number,"b":2,"c":2}')
    expect(UC('a:*1|number,b:top,c:/a&/b'))
      .equals('{"a":*1|number,"b":top,"c":*1|number}')
    expect(UC('a:*1|number,b:*2|number,c:/a&/b'))
      .equals('{"a":*1|number,"b":*2|number,"c":*1|*2|number}')

    */
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
