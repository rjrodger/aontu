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
  TOP,
  Nil,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ScalarTypeVal,
  MapVal,
  Integer,
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

    expect(m0.unify(m0)).equal(m0)

    expect(m0.unify(TOP)).equal(m0)
    expect(TOP.unify(m0)).equal(m0)

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
    let u01 = m0.unify(m1)

    console.log(m0)
    console.log(m1)
    console.log(u01)


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

  })


})
