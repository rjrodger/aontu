import Lab from '@hapi/lab'
import Code from '@hapi/code'



var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


import { Jsonic } from 'jsonic'


import {
  AontuLang
} from '../lib/lang'


let {
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
} = require('../lib/val')

describe('val', function() {
  it('canon', () => {
    let la = AontuLang

    expect(la('1').canon).equals('1')
    expect(la('"a"').canon).equals('"a"')
    expect(la('b').canon).equals('"b"')
    expect(la('true').canon).equals('true')
    expect(la('top').canon).equals('top')
    expect(la('nil').canon).equals('nil')
    expect(la('a:1').canon).equals('{"a":1}')
    expect(la('a:1,b:nil').canon).equals('{"a":1,"b":nil}')
    expect(la('a:1,b:c:2').canon).equals('{"a":1,"b":{"c":2}}')


  })


  it('gen', () => {
    let la = AontuLang
    let g = []

    g = []; expect(la('1').gen(g)).equals(1)
    g = []; expect(la('"a"').gen(g)).equals('a')
    g = []; expect(la('b').gen(g)).equals('b')
    g = []; expect(la('true').gen(g)).equals(true)
    g = []; expect(la('top').gen(g)).equals(undefined)

    g = []; expect(la('nil').gen(g)).equals(undefined)
    expect(g).equals(['nil'])

    g = []; expect(la('a:1').gen(g)).equals({ a: 1 })

    g = []; expect(la('a:1,b:nil').gen(g)).equals({ a: 1, b: undefined })
    expect(g).equals(['nil'])

    g = []; expect(la('a:1,b:c:2').gen(g)).equals({ a: 1, b: { c: 2 } })


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
    let m2s = la('a: 1, b: string')
    let m3s = la('b: foo')
    console.log('m2s', m2s)
    console.log('m3s', m3s)
    
    let u02s = m2s.unify(m3s)
    //let u02c = m3.unify(m2)
    console.log('u02s', u02s)
    
    
    let mc0 = la('a:b:c:1')
    let mc1 = la('a:b:d:2')
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
    let la = AontuLang
    let d0 = new ConjunctVal(la(['1']))
    let d1 = new ConjunctVal(la(['1', '1']))
    let d2 = new ConjunctVal(la(['1', '2']))
    let d3 = new ConjunctVal(la(['1', 'number']))
    let d4 = new ConjunctVal(la(['1', 'number', 'integer']))
    let d5 = new ConjunctVal(la(['{a:1}']))
    let d6 = new ConjunctVal(la(['{a:1}', '{b:2}']))

    let d100 = new ConjunctVal([new IntegerVal(1), new RefVal('1')])
    let d101 = new ConjunctVal([new IntegerVal(1), new RefVal('a')])

    expect(d0.canon).equals('1')
    expect(d1.canon).equals('1&1')
    expect(d2.canon).equals('1&2')
    expect(d3.canon).equals('1&number')
    expect(d4.canon).equals('1&number&integer')
    expect(d5.canon).equals('{"a":1}')
    expect(d6.canon).equals('{"a":1}&{"b":2}')


    expect(d0.unify(la('1')).canon).equal('1')
    expect(la('1').unify(d0).canon).equal('1')
    expect(d0.unify(la('2')).canon)
      .equal('nil:&peer[nil:no-unify-val:[1,2],2]')
    expect(la('2').unify(d0).canon)
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

    expect(d100.unify(TOP).dc).equal('1/*d-1*/')
    expect(TOP.unify(d100).dc).equal('1/*d-1*/')

    console.log('+++++++')
    expect(d101.unify(TOP).dc).equal('REF[a]&1/*d1*/')
  })


  it('disjunct', () => {
    let la = AontuLang
    let d0 = new DisjunctVal(la(['1']))
    let d1 = new DisjunctVal(la(['1', '2']))
    let d2 = new DisjunctVal(la(['1', 'number']))
    let d3 = new DisjunctVal(la(['1', 'number', 'integer']))
    let d4 = new DisjunctVal(la(['{a:1}']))
    let d5 = new DisjunctVal(la(['{a:1}', '{b:2}']))

    expect(d0.canon).equals('1')
    expect(d1.canon).equals('1|2')
    expect(d2.canon).equals('1|number')
    expect(d3.canon).equals('1|number|integer')
    expect(d4.canon).equals('{"a":1}')
    expect(d5.canon).equals('{"a":1}|{"b":2}')


    let g = []

    g = []; expect(d0.unify(la('1')).gen(g)).equal(1)
    g = []; expect(la('1').unify(d0).gen(g)).equal(1)
    g = []; expect(d0.unify(la('2')).gen(g)).equal(undefined)
    g = []; expect(la('2').unify(d0).gen(g)).equal(undefined)

    g = []; expect(d1.unify(la('1')).gen(g)).equal(1)
    g = []; expect(la('1').unify(d1).gen(g)).equal(1)
    g = []; expect(d1.unify(la('2')).gen(g)).equal(2)
    g = []; expect(la('2').unify(d1).gen(g)).equal(2)
    g = []; expect(d1.unify(la('3')).gen(g)).equal(undefined)
    g = []; expect(la('3').unify(d1).gen(g)).equal(undefined)

    g = []; expect(d2.unify(la('1')).gen(g)).equal(1)
    g = []; expect(la('1').unify(d2).gen(g)).equal(1)
    g = []; expect(d2.unify(la('2')).gen(g)).equal(2)
    g = []; expect(la('2').unify(d2).gen(g)).equal(2)
    g = []; expect(d3.unify(la('3')).gen(g)).equal(3)
    g = []; expect(la('3').unify(d3).gen(g)).equal(3)
    g = []; expect(d3.unify(la('true')).gen(g)).equal(undefined)
    g = []; expect(la('true').unify(d3).gen(g)).equal(undefined)




    g = []; expect(d0.gen(g)).equals(1)
    g = []; expect(d1.gen(g)).equals(1)
    g = []; expect(d2.gen(g)).equals(1)
    g = []; expect(d3.gen(g)).equals(1)

    g = []; expect(d4.gen(g)).equals({ a: 1 })
    g = []; expect(d5.gen(g)).equals({ a: 1 })
  })



  it('ref', () => {
    let la = AontuLang

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


})


function print(o: any, t?: string) {
  if (null != t) {
    console.log(t)
  }
  console.dir(o, { depth: null })
}
