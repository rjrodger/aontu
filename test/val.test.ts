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
} from '../lib/val'


let lang = new Lang()
let P = lang.parse.bind(lang)



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



  it('boolean', () => {
    let bt = BooleanVal.TRUE
    let bf = BooleanVal.FALSE

    expect(bt.unify(bt)).equal(bt)
    expect(bf.unify(bf)).equal(bf)

    expect(bt.unify(bf)).instanceof(Nil)
    expect(bf.unify(bt)).instanceof(Nil)

    expect(bt.unify(TOP)).equal(bt)
    expect(bf.unify(TOP)).equal(bf)
    expect(TOP.unify(bt)).equal(bt)
    expect(TOP.unify(bf)).equal(bf)

    let b0 = new Nil()
    expect(bt.unify(b0)).equal(b0)
    expect(bf.unify(b0)).equal(b0)
    expect(b0.unify(bt)).equal(b0)
    expect(b0.unify(bf)).equal(b0)

    let bs = new ScalarTypeVal(Boolean)
    expect(bt.unify(bs)).equal(bt)
    expect(bs.unify(bt)).equal(bt)

    let n0 = new NumberVal(1)
    expect(bt.unify(n0)).instanceof(Nil)
    expect(bf.unify(n0)).instanceof(Nil)
    expect(n0.unify(bt)).instanceof(Nil)
    expect(n0.unify(bf)).instanceof(Nil)
  })


  it('string', () => {
    let s0 = new StringVal('s0')
    let s1 = new StringVal('s1')

    expect(s0.unify(s0)).equal(s0)
    expect(s1.unify(s1)).equal(s1)

    expect(s0.unify(s1)).instanceof(Nil)
    expect(s1.unify(s0)).instanceof(Nil)

    expect(s0.unify(TOP)).equal(s0)
    expect(s1.unify(TOP)).equal(s1)
    expect(TOP.unify(s0)).equal(s0)
    expect(TOP.unify(s1)).equal(s1)

    let b0 = new Nil()
    expect(s0.unify(b0)).equal(b0)
    expect(s1.unify(b0)).equal(b0)
    expect(b0.unify(s0)).equal(b0)
    expect(b0.unify(s1)).equal(b0)

    let t0 = new ScalarTypeVal(String)
    expect(s0.unify(t0)).equal(s0)
    expect(t0.unify(s0)).equal(s0)

    let n0 = new NumberVal(1)
    expect(s0.unify(n0)).instanceof(Nil)
    expect(s1.unify(n0)).instanceof(Nil)
    expect(n0.unify(s0)).instanceof(Nil)
    expect(n0.unify(s1)).instanceof(Nil)
  })


  it('number', () => {
    let n0 = new NumberVal(0)
    let n1 = new NumberVal(1.1)

    expect(n0.unify(n0)).equal(n0)
    expect(n1.unify(n1)).equal(n1)

    expect(n0.unify(n1)).instanceof(Nil)
    expect(n1.unify(n0)).instanceof(Nil)

    expect(n0.unify(TOP)).equal(n0)
    expect(n1.unify(TOP)).equal(n1)
    expect(TOP.unify(n0)).equal(n0)
    expect(TOP.unify(n1)).equal(n1)

    let b0 = new Nil()
    expect(n0.unify(b0)).equal(b0)
    expect(n1.unify(b0)).equal(b0)
    expect(b0.unify(n0)).equal(b0)
    expect(b0.unify(n1)).equal(b0)

    let t0 = new ScalarTypeVal(Number)
    expect(n0.unify(t0)).equal(n0)
    expect(t0.unify(n0)).equal(n0)

    let s0 = new StringVal('s0')
    expect(n0.unify(s0)).instanceof(Nil)
    expect(n1.unify(s0)).instanceof(Nil)
    expect(s0.unify(n0)).instanceof(Nil)
    expect(s0.unify(n1)).instanceof(Nil)
  })



  it('integer', () => {
    let n0 = new IntegerVal(0)
    let n1 = new IntegerVal(1)

    expect(n0.unify(n0)).equal(n0)
    expect(n1.unify(n1)).equal(n1)

    expect(n0.unify(n1)).instanceof(Nil)
    expect(n1.unify(n0)).instanceof(Nil)

    expect(n0.unify(TOP)).equal(n0)
    expect(n1.unify(TOP)).equal(n1)
    expect(TOP.unify(n0)).equal(n0)
    expect(TOP.unify(n1)).equal(n1)

    let b0 = new Nil()
    expect(n0.unify(b0)).equal(b0)
    expect(n1.unify(b0)).equal(b0)
    expect(b0.unify(n0)).equal(b0)
    expect(b0.unify(n1)).equal(b0)

    let s0 = new StringVal('s0')
    expect(n0.unify(s0)).instanceof(Nil)
    expect(n1.unify(s0)).instanceof(Nil)
    expect(s0.unify(n0)).instanceof(Nil)
    expect(s0.unify(n1)).instanceof(Nil)

    let t0 = new ScalarTypeVal(Integer)
    expect(n0.unify(t0)).equal(n0)
    expect(t0.unify(n0)).equal(n0)

    let t1 = new ScalarTypeVal(Number)
    expect(n0.unify(t1)).equal(n0)
    expect(t1.unify(n0)).equal(n0)

    expect(t0.unify(t1)).equal(t0)
    expect(t1.unify(t0)).equal(t0)

    let x0 = new NumberVal(0)
    expect(n0.unify(x0)).equal(n0)
    expect(x0.unify(n0)).equal(n0)

  })


  it('map', () => {
    let m0 = new MapVal({})
    expect(m0.canon).equals('{}')

    // TODO: update
    expect(m0.unify(m0).canon).equal('{}')

    expect(m0.unify(TOP).canon).equal('{}')
    expect(TOP.unify(m0).canon).equal('{}')

    let b0 = new Nil()
    expect(m0.unify(b0)).equal(b0)
    expect(b0.unify(m0)).equal(b0)

    let s0 = new StringVal('s0')
    expect(m0.unify(s0)).instanceof(Nil)
    expect(s0.unify(m0)).instanceof(Nil)

    let n0 = new NumberVal(0)
    expect(m0.unify(n0)).instanceof(Nil)
    expect(n0.unify(m0)).instanceof(Nil)

    let t0 = new ScalarTypeVal(String)
    expect(m0.unify(t0)).instanceof(Nil)
    expect(t0.unify(m0)).instanceof(Nil)


    let m1 = new MapVal({ a: new NumberVal(1) })
    print(m1, 'm1')
    expect(m1.canon).equals('{"a":1}')

    let m1u = m1.unify(TOP)
    print(m1u, 'm1u')
    expect(m1u.canon).equals('{"a":1}')


    let u01 = m0.unify(m1)
    print(u01, 'u01')
    expect(m1u.canon).equals('{"a":1}')
    expect(m0.canon).equals('{}')
    expect(m1.canon).equals('{"a":1}')

    let u02 = m1.unify(m0)
    print(u02, 'u02')
    expect(u02.canon).equals('{"a":1}')
    expect(m0.canon).equals('{}')
    expect(m1.canon).equals('{"a":1}')

    return;

    /*
    let m2 = new MapVal({
    a: new NumberVal(1),
    b: new ScalarTypeVal(String),
    })
    let m3 = new MapVal({
    b: new StringVal('foo')
    })
    let u02 = m2.unify(m3)
    let u02c = m3.unify(m2)
    
    console.log(m2)
    console.log(m3)
    console.log('u02', u02)
    console.log('u02c', u02c)
    
    
    
    let la = AontuLang
    let m2s = P('a: 1, b: string')
    let m3s = P('b: foo')
    console.log('m2s', m2s)
    console.log('m3s', m3s)
    
    let u02s = m2s.unify(m3s)
    //let u02c = m3.unify(m2)
    console.log('u02s', u02s)
    
    
    let mc0 = P('a:b:c:1')
    let mc1 = P('a:b:d:2')
    console.log('mc0')
    console.dir(mc0, { depth: null })
    
    console.log('mc1')
    console.dir(mc1, { depth: null })
    
    
    console.log('+++++++')
    let mcu0 = mc0.unify(mc1)
    console.log('mcu0')
    console.dir(mcu0, { depth: null })
    
    console.log('mc0-u')
    console.dir(mc0, { depth: null })
    
    console.log('mc1-u')
    console.dir(mc1, { depth: null })
    
    
    let mcu0c = mc1.unify(mc0)
    console.dir(mcu0c, { depth: null })
    */
  })


  it('conjunct', () => {
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


    expect(d0.unify(P('1')).canon).equal('1')
    expect(P('1').unify(d0).canon).equal('1')
    expect(d0.unify(P('2')).canon)
      .equal('nil:&peer[nil:no-unify-val:[1,2],2]')
    expect(P('2').unify(d0).canon)
      .equal('nil:&peer[nil:no-unify-val:[1,2],2]')


    expect(d0.unify(TOP).canon).equal('1')
    expect(TOP.unify(d0).canon).equal('1')

    expect(d1.unify(TOP).canon).equal('1')
    expect(TOP.unify(d1).canon).equal('1')

    expect(d2.unify(TOP).canon)
      .equal('nil:&reduce[nil:no-unify-val:[1,2],2]')
    expect(TOP.unify(d2).canon)
      .equal('nil:&reduce[nil:no-unify-val:[1,2],2]')

    expect(d3.unify(TOP).canon).equal('1')
    expect(TOP.unify(d3).canon).equal('1')

    // TODO: term order is swapped by ConjunctVal impl - should be preserved
    expect(d100.unify(TOP).canon).equal('/x&1')
    expect(TOP.unify(d100).canon).equal('/x&1')
  })


  it('disjunct', () => {
    let d0 = new DisjunctVal(P(['1']))
    let d1 = new DisjunctVal(P(['1', '2']))
    let d2 = new DisjunctVal(P(['1', 'number']))
    let d3 = new DisjunctVal(P(['1', 'number', 'integer']))
    let d4 = new DisjunctVal(P(['{a:1}']))
    let d5 = new DisjunctVal(P(['{a:1}', '{b:2}']))

    expect(d0.canon).equals('1')
    expect(d1.canon).equals('1|2')
    expect(d2.canon).equals('1|number')
    expect(d3.canon).equals('1|number|integer')
    expect(d4.canon).equals('{"a":1}')
    expect(d5.canon).equals('{"a":1}|{"b":2}')


    let g = []

    g = []; expect(d0.unify(P('1')).gen(g)).equal(1)
    g = []; expect(P('1').unify(d0).gen(g)).equal(1)
    g = []; expect(d0.unify(P('2')).gen(g)).equal(undefined)
    g = []; expect(P('2').unify(d0).gen(g)).equal(undefined)

    g = []; expect(d1.unify(P('1')).gen(g)).equal(1)
    g = []; expect(P('1').unify(d1).gen(g)).equal(1)
    g = []; expect(d1.unify(P('2')).gen(g)).equal(2)
    g = []; expect(P('2').unify(d1).gen(g)).equal(2)
    g = []; expect(d1.unify(P('3')).gen(g)).equal(undefined)
    g = []; expect(P('3').unify(d1).gen(g)).equal(undefined)

    g = []; expect(d2.unify(P('1')).gen(g)).equal(1)
    g = []; expect(P('1').unify(d2).gen(g)).equal(1)
    g = []; expect(d2.unify(P('2')).gen(g)).equal(2)
    g = []; expect(P('2').unify(d2).gen(g)).equal(2)
    g = []; expect(d3.unify(P('3')).gen(g)).equal(3)
    g = []; expect(P('3').unify(d3).gen(g)).equal(3)
    g = []; expect(d3.unify(P('true')).gen(g)).equal(undefined)
    g = []; expect(P('true').unify(d3).gen(g)).equal(undefined)




    g = []; expect(d0.gen(g)).equals(1)
    g = []; expect(d1.gen(g)).equals(1)
    g = []; expect(d2.gen(g)).equals(1)
    g = []; expect(d3.gen(g)).equals(1)

    g = []; expect(d4.gen(g)).equals({ a: 1 })
    g = []; expect(d5.gen(g)).equals({ a: 1 })
  })



  it('ref', () => {
    // let la = AontuLang

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

    expect(d0.unify(TOP).canon).equal('a/x')
    expect(TOP.unify(d0).canon).equal('a/x')
    expect(d1.unify(TOP).canon).equal('/c/x')
    expect(TOP.unify(d1).canon).equal('/c/x')

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
})



function print(o: any, t?: string) {
  if (null != t) {
    console.log(t)
  }
  console.dir(o, { depth: null })
}
