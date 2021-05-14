import Lab from '@hapi/lab'
import Code from '@hapi/code'




var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect


import { makeFileResolver } from '@jsonic/multisource'




import {
  TOP,
  Val,
  MapVal,
} from '../lib/val'

import {
  Lang
} from '../lib/lang'

import {
  Unify,
  Context,
} from '../lib/unify'


let lang = new Lang()
let P: (s: string, o?: any) => Val = lang.parse.bind(lang)


describe('lang', function() {

  it('happy', () => {
    expect(P('1').canon).equal('1')
    expect(P('a:1').canon).equal('{"a":1}')
    expect(P('{a:{b:x}}').canon).equal('{"a":{"b":"x"}}')

    expect(P('a:11|22,b:33', { xlog: -1 }).canon).equal('{"a":11|22,"b":33}')
    expect(P('a:11|22|33,b:44', { xlog: -1 }).canon).equal('{"a":11|22|33,"b":44}')


    expect(P('a:{b:11}|{c:22},b:33', { xlog: -1 }).canon)
      .equal('{"a":{"b":11}|{"c":22},"b":33}')
    //console.dir(P('a:{b:11}|{c:22},b:33'), { depth: null })



    expect(P('a:11&22,b:33', { xlog: -1 }).canon).equal('{"a":11&22,"b":33}')
    expect(P('a:11&22&33,b:44', { xlog: -1 }).canon).equal('{"a":11&22&33,"b":44}')

    expect(P('a:{b:11}&{c:22},b:33', { xlog: -1 }).canon)
      .equal('{"a":{"b":11}&{"c":22},"b":33}')
    //console.dir(P('a:{b:11}&{c:22},b:33'), { depth: null })


    expect(P('a:11&22|33,b:44', { xlog: -1 }).canon).equal('{"a":11&22|33,"b":44}')
    console.dir(P('a:11&22|33,b:44', { xlog: -1 }), { depth: null })

    expect(P('a:11|22&33,b:44', { xlog: -1 }).canon).equal('{"a":11|22&33,"b":44}')
    console.dir(P('a:11|22&33,b:44', { xlog: -1 }), { depth: null })


  })


  it('merge', () => {
    let ctx = makeCtx()

    let v0 = P('a:{x:1},a:{y:2}')
    //console.dir(v0, { depth: null })
    expect(v0.canon).equal('{"a":{"x":1}&{"y":2}}')

    let u0 = v0.unify(TOP, ctx)
    //console.dir(u0, { depth: null })
    expect(u0.canon).equal('{"a":{"x":1,"y":2}}')

    expect(u0.gen([])).equal({ a: { x: 1, y: 2 } })
  })


  it('ref', () => {
    // console.dir(lang.jsonic.internal().config)

    let v0 = P('a:/x')
    console.log(v0)
    expect(v0.peg.a.parts).equals(['x'])

    let v1 = P('a:/x/y', { xlog: -1 })
    console.log(v1)
    expect(v1.peg.a.parts).equals(['x', 'y'])
  })


  it('file', () => {
    let g0 = new Lang({ resolver: makeFileResolver() })

    let t01v = g0.parse('@"' + __dirname + '/t01.jsonic"')
    expect(t01v.canon).equals('{"a":1,"b":{"d":2},"c":3}')

    let t02v = g0.parse('@"' + __dirname + '/t02.jsonic"')
    console.dir(t02v, { depth: null })
    console.log(t02v.canon)


    let u02 = new Unify(t02v)
    console.log(u02.res.canon)
    console.log(u02.res.gen([]))
  })


  it('conjunct', () => {
    expect(() => P('*1')).throws()
    expect(() => P('*1&number')).throws()
    expect(() => P('number&*1')).throws()
  })


  it('disjunct', () => {
    expect(() => P('*1')).throws()

    let v1 = P('*1|number')
    //console.dir(v1, { depth: null })
    expect(v1.canon).equals('*1|number')

    let v2 = P('integer|*2', { xlog: -1 })
    //console.dir(v2, { depth: null })
    expect(v2.canon).equals('integer|*2')
  })


  it('precedence', () => {
    let v0 = P('a:b:1&2')
    // console.dir(v0, { depth: null })
    expect(v0.canon).equal('{"a":{"b":1&2}}')
  })


  it('spreads', () => {
    let ctx = makeCtx()

    let v0 = P('a:{&={x:1,y:integer},b:{y:1},c:{y:2}}')
    expect(v0.canon).equals('{"a":{&={"x":1,"y":integer},"b":{"y":1},"c":{"y":2}}}')

    let u0 = v0.unify(TOP, ctx)
    expect(u0.canon)
      .equals('{"a":{&={"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')

    let v1 = P('k:{x:1,y:integer},a:{&=/k,b:{y:1},c:{y:2}}')
    expect(v1.canon)
      .equals('{"k":{"x":1,"y":integer},"a":{&=/k,"b":{"y":1},"c":{"y":2}}}')

    let c1 = makeCtx({ root: v1 })
    let u1a = v1.unify(TOP, c1)
    //console.log(u1a.done, u1a.canon)
    expect(u1a.canon).
      equal('{"k":{"x":1,"y":integer},"a":{&={"x":1,"y":integer},' +
        '"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')


    let v2 = P('a:{&=number},a:{x:1},a:{y:2}')
    expect(v2.canon).equals('{"a":{&=number}&{"x":1}&{"y":2}}')
    let u2 = v2.unify(TOP, ctx)
    expect(u2.canon).equal('{"a":{&=number,"x":1,"y":2}}')

    let v3 = P('a:{&=number,z:3},a:{x:1},a:{y:2}')
    expect(v3.canon).equals('{"a":{&=number,"z":3}&{"x":1}&{"y":2}}')
    let u3 = v3.unify(TOP, ctx)
    expect(u3.canon).equal('{"a":{&=number,"z":3,"x":1,"y":2}}')

    let v4 = P('b:{a:{&=number,z:3},a:{x:1},a:{y:2}}')
    expect(v4.canon).equals('{"b":{"a":{&=number,"z":3}&{"x":1}&{"y":2}}}')
    let u4 = v4.unify(TOP, ctx)
    expect(u4.canon).equal('{"b":{"a":{&=number,"z":3,"x":1,"y":2}}}')

    // Must commute!

    let v5a = P('{&={x:1}}&{a:{y:1}}')
    let u5a = v5a.unify(TOP, ctx)
    expect(u5a.canon).equal('{&={"x":1},"a":{"y":1,"x":1}}')

    let v5b = P('{a:{y:1}}&{&={x:1}}')
    let u5b = v5b.unify(TOP, ctx)
    expect(u5b.canon).equal('{&={"x":1},"a":{"y":1,"x":1}}')


    let v6 = P('b:{a:{&={K:0},z:{Z:3}},a:{x:{X:1}},a:{y:{Y:2}}}')
    expect(v6.canon)
      .equals('{"b":{"a":{&={"K":0},"z":{"Z":3}}&{"x":{"X":1}}&{"y":{"Y":2}}}}')
    let u6 = v6.unify(TOP, ctx)
    expect(u6.canon)
      .equal('{"b":{"a":{&={"K":0},' +
        '"z":{"Z":3,"K":0},"x":{"X":1,"K":0},"y":{"Y":2,"K":0}}}}')

  })



  it('source', () => {
    let v0 = P(`
a: {
  b: {
    c: 1
    d: 2 & 3 
  }
}
`)

    // REMOVE
    console.dir(v0, { depth: null })
  })
})


function makeCtx(opts?: any) {
  return new Context(opts || { root: new MapVal({}) })
}
