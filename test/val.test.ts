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
let P = lang.parse.bind(lang)

let D = (x: any) => console.dir(x, { depth: null })


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
    let g = []

    g = []; expect(P('1').gen(g)).equals(1)
    g = []; expect(P('"a"').gen(g)).equals('a')
    g = []; expect(P('b').gen(g)).equals('b')
    g = []; expect(P('true').gen(g)).equals(true)
    g = []; expect(P('top').gen(g)).equals(undefined)

    g = []; expect(P('nil').gen(g)).equals(undefined)
    expect(g).equals(['nil'])

    g = []; expect(P('a:1').gen(g)).equals({ a: 1 })

    g = []; expect(P('a:1,b:nil').gen(g)).equals({ a: 1, b: undefined })
    expect(g).equals(['nil'])

    g = []; expect(P('a:1,b:c:2').gen(g)).equals({ a: 1, b: { c: 2 } })


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

    expect(bt.unify(bt, ctx)).equal(bt)
    expect(bf.unify(bf, ctx)).equal(bf)

    expect(bt.unify(bf, ctx)).instanceof(Nil)
    expect(bf.unify(bt, ctx)).instanceof(Nil)

    expect(bt.unify(TOP, ctx)).equal(bt)
    expect(bf.unify(TOP, ctx)).equal(bf)
    expect(TOP.unify(bt, ctx)).equal(bt)
    expect(TOP.unify(bf, ctx)).equal(bf)

    let b0 = new Nil([], 'test')
    expect(bt.unify(b0, ctx)).equal(b0)
    expect(bf.unify(b0, ctx)).equal(b0)
    expect(b0.unify(bt, ctx)).equal(b0)
    expect(b0.unify(bf, ctx)).equal(b0)

    let bs = new ScalarTypeVal(Boolean)
    expect(bt.unify(bs, ctx)).equal(bt)
    expect(bs.unify(bt, ctx)).equal(bt)

    let n0 = new NumberVal(1)
    expect(bt.unify(n0, ctx)).instanceof(Nil)
    expect(bf.unify(n0, ctx)).instanceof(Nil)
    expect(n0.unify(bt, ctx)).instanceof(Nil)
    expect(n0.unify(bf, ctx)).instanceof(Nil)

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

    expect(s0.unify(s0, ctx)).equal(s0)
    expect(s1.unify(s1, ctx)).equal(s1)

    expect(s0.unify(s1, ctx)).instanceof(Nil)
    expect(s1.unify(s0, ctx)).instanceof(Nil)

    expect(s0.unify(TOP, ctx)).equal(s0)
    expect(s1.unify(TOP, ctx)).equal(s1)
    expect(TOP.unify(s0, ctx)).equal(s0)
    expect(TOP.unify(s1, ctx)).equal(s1)

    let b0 = new Nil([], 'test')
    expect(s0.unify(b0, ctx)).equal(b0)
    expect(s1.unify(b0, ctx)).equal(b0)
    expect(b0.unify(s0, ctx)).equal(b0)
    expect(b0.unify(s1, ctx)).equal(b0)

    let t0 = new ScalarTypeVal(String)
    expect(s0.unify(t0, ctx)).equal(s0)
    expect(t0.unify(s0, ctx)).equal(s0)

    let n0 = new NumberVal(1)
    expect(s0.unify(n0, ctx)).instanceof(Nil)
    expect(s1.unify(n0, ctx)).instanceof(Nil)
    expect(n0.unify(s0, ctx)).instanceof(Nil)
    expect(n0.unify(s1, ctx)).instanceof(Nil)

    expect(s0.same(s0)).true()
    expect(new StringVal('a').same(new StringVal('a'))).true()
    expect(new StringVal('a').same(new StringVal('b'))).false()
  })


  it('number', () => {
    let ctx = makeCtx()

    let n0 = new NumberVal(0)
    let n1 = new NumberVal(1.1)

    expect(n0.unify(n0, ctx)).equal(n0)
    expect(n1.unify(n1, ctx)).equal(n1)

    expect(n0.unify(n1, ctx)).instanceof(Nil)
    expect(n1.unify(n0, ctx)).instanceof(Nil)

    expect(n0.unify(TOP, ctx)).equal(n0)
    expect(n1.unify(TOP, ctx)).equal(n1)
    expect(TOP.unify(n0, ctx)).equal(n0)
    expect(TOP.unify(n1, ctx)).equal(n1)

    let b0 = new Nil([], 'test')
    expect(n0.unify(b0, ctx)).equal(b0)
    expect(n1.unify(b0, ctx)).equal(b0)
    expect(b0.unify(n0, ctx)).equal(b0)
    expect(b0.unify(n1, ctx)).equal(b0)

    let t0 = new ScalarTypeVal(Number)
    expect(n0.unify(t0, ctx)).equal(n0)
    expect(t0.unify(n0, ctx)).equal(n0)

    let s0 = new StringVal('s0')
    expect(n0.unify(s0, ctx)).instanceof(Nil)
    expect(n1.unify(s0, ctx)).instanceof(Nil)
    expect(s0.unify(n0, ctx)).instanceof(Nil)
    expect(s0.unify(n1, ctx)).instanceof(Nil)

    expect(n0.same(n0)).true()
    expect(new NumberVal(11).same(new NumberVal(11))).true()
    expect(new NumberVal(11).same(new NumberVal(22))).false()

  })



  it('integer', () => {
    let ctx = makeCtx()

    let n0 = new IntegerVal(0)
    let n1 = new IntegerVal(1)

    expect(n0.unify(n0, ctx)).equal(n0)
    expect(n1.unify(n1, ctx)).equal(n1)

    expect(n0.unify(n1, ctx)).instanceof(Nil)
    expect(n1.unify(n0, ctx)).instanceof(Nil)

    expect(n0.unify(TOP, ctx)).equal(n0)
    expect(n1.unify(TOP, ctx)).equal(n1)
    expect(TOP.unify(n0, ctx)).equal(n0)
    expect(TOP.unify(n1, ctx)).equal(n1)

    let b0 = new Nil([], 'test')
    expect(n0.unify(b0, ctx)).equal(b0)
    expect(n1.unify(b0, ctx)).equal(b0)
    expect(b0.unify(n0, ctx)).equal(b0)
    expect(b0.unify(n1, ctx)).equal(b0)

    let s0 = new StringVal('s0')
    expect(n0.unify(s0, ctx)).instanceof(Nil)
    expect(n1.unify(s0, ctx)).instanceof(Nil)
    expect(s0.unify(n0, ctx)).instanceof(Nil)
    expect(s0.unify(n1, ctx)).instanceof(Nil)

    let t0 = new ScalarTypeVal(Integer)
    expect(n0.unify(t0, ctx)).equal(n0)
    expect(t0.unify(n0, ctx)).equal(n0)

    let t1 = new ScalarTypeVal(Number)
    expect(n0.unify(t1, ctx)).equal(n0)
    expect(t1.unify(n0, ctx)).equal(n0)

    expect(t0.unify(t1, ctx)).equal(t0)
    expect(t1.unify(t0, ctx)).equal(t0)

    let x0 = new NumberVal(0)
    expect(n0.unify(x0, ctx)).equal(n0)
    expect(x0.unify(n0, ctx)).equal(n0)

    expect(n0.same(n0)).true()
    expect(new IntegerVal(11).same(new IntegerVal(11))).true()
    expect(new IntegerVal(11).same(new IntegerVal(22))).false()


  })


  it('map', () => {
    let ctx = makeCtx()

    let m0 = new MapVal({})
    expect(m0.canon).equals('{}')

    // TODO: update
    expect(m0.unify(m0, ctx).canon).equal('{}')

    expect(m0.unify(TOP, ctx).canon).equal('{}')
    expect(TOP.unify(m0, ctx).canon).equal('{}')

    let b0 = new Nil([], 'test')
    expect(m0.unify(b0, ctx)).equal(b0)
    expect(b0.unify(m0, ctx)).equal(b0)

    let s0 = new StringVal('s0')
    expect(m0.unify(s0, ctx)).instanceof(Nil)
    expect(s0.unify(m0, ctx)).instanceof(Nil)

    let n0 = new NumberVal(0)
    expect(m0.unify(n0, ctx)).instanceof(Nil)
    expect(n0.unify(m0, ctx)).instanceof(Nil)

    let t0 = new ScalarTypeVal(String)
    expect(m0.unify(t0, ctx)).instanceof(Nil)
    expect(t0.unify(m0, ctx)).instanceof(Nil)


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


  it('conjunct', () => {
    let ctx = makeCtx()

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


    expect(d0.unify(P('1'), ctx).canon).equal('1')
    expect(P('1').unify(d0, ctx).canon).equal('1')
    expect(d0.unify(P('2'), ctx).canon)
      .equal('nil')
    expect(P('2').unify(d0, ctx).canon)
      .equal('nil')


    expect(d0.unify(TOP, ctx).canon).equal('1')
    expect(TOP.unify(d0, ctx).canon).equal('1')

    expect(d1.unify(TOP, ctx).canon).equal('1')
    expect(TOP.unify(d1, ctx).canon).equal('1')

    expect(d2.unify(TOP, ctx).canon)
      .equal('nil')
    expect(TOP.unify(d2, ctx).canon)
      .equal('nil')

    expect(d3.unify(TOP, ctx).canon).equal('1')
    expect(TOP.unify(d3, ctx).canon).equal('1')

    // TODO: term order is swapped by ConjunctVal impl - should be preserved
    expect(d100.unify(TOP, ctx).canon).equal('/x&1')
    expect(TOP.unify(d100, ctx).canon).equal('/x&1')
  })


  it('disjunct', () => {
    let ctx = makeCtx()

    let d1 = new DisjunctVal(P(['1', '2']))

    expect(d1.unify(P('2'), ctx).canon).equal('2')

    expect(P('1|number', ctx).canon).equals('1|number')
    expect(P('1|number|top', ctx).canon).equals('1|number|top')

    expect(P('1|number').gen([])).equals(1)
    expect(P('1|number|top').gen([])).equals(1)

    expect(P('number|1').unify(P('top'), ctx).canon).equals('number|1')

    expect(P('1|number|1').unify(P('top'), ctx).canon).equals('1|number')

    expect(P('number|string').unify(P('top'), ctx).canon).equals('number|string')

    expect(P('number|string').unify(P('1'), ctx).canon).equals('1')
    expect(P('number|1').unify(P('1'), ctx).canon).equals('1')


    expect(P('number|1').unify(P('number|1'), ctx).canon).equal('number|1')
    expect(P('1|number').unify(P('1|number'), ctx).canon).equals('1|number')
    expect(P('number|1').unify(P('1|number'), ctx).canon).equals('1|number')

    expect(P('number|1').unify(P('number|string'), ctx).canon).equals('number|1')
    expect(P('number|string').unify(P('boolean|number'), ctx).canon).equals('number')



    let u0 = P('number|*1').unify(P('number'), ctx)
    //console.dir(u0, { depth: null })
    //console.log(u0.canon)
    //console.log(u0.gen([]))
    expect(u0.canon).equals('number|*1')
    expect(u0.gen([])).equals(1)


    let u1 = P('number|*1').unify(P('number|string'), ctx)
    //console.dir(u1, { depth: null })
    //console.log(u1.canon)
    //console.log(u1.gen([]))
    expect(u1.canon).equals('number|*1')
    expect(u1.gen([])).equals(1)



    let u2 = P('number|*1').unify(P('2'), ctx)
    console.dir(u2, { depth: null })
    console.log(u2.canon)
    console.log(u2.gen([]))
    expect(u2.canon).equals('2')
    expect(u2.gen([])).equals(2)

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
    g = []; console.log(m0.gen(g))

    let c0 = new Context({ root: m0 })
    let u0 = m0.unify(TOP, c0)

    console.log('u0===', u0.done, u0.canon)
    g = []; console.log(u0.gen(g))

    let c0a = new Context({ root: u0 })
    let u0a = u0.unify(TOP, c0a)

    console.log('u0a===', u0a.done, u0a.canon)
    g = []; console.log(u0a.gen(g))


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

    p0.val = new ScalarTypeVal(String)
    expect(p0.canon).equals('*"p0"')
    expect(p0.gen([])).equals('p0')

    p0.pref = new Nil([], 'test:pref')
    expect(p0.canon).equals('string')
    expect(p0.gen([])).equals(undefined)

    p0.val = new Nil([], 'test:val')
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

  })

})



function print(o: any, t?: string) {
  if (null != t) {
    console.log(t)
  }
  console.dir(o, { depth: null })
}


function makeCtx() {
  return new Context({ root: new MapVal({}) })
}
