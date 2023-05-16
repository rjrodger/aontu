

import type {
  Val,
} from '../lib/type'

import {
  Lang
} from '../lib/lang'

import {
  Unify,
  Context,
} from '../lib/unify'

import { MapVal } from '../lib/val/MapVal'
import { Nil } from '../lib/val/Nil'

import {
  TOP,
} from '../lib/type'


let lang = new Lang()
let P: (s: string, o?: any) => Val = lang.parse.bind(lang)


describe('lang', function() {


  it('happy', () => {
    expect(P('1').canon).toEqual('1')
    expect(P('a:1').canon).toEqual('{"a":1}')
    expect(P('{a:{b:x}}').canon).toEqual('{"a":{"b":"x"}}')

    expect(P('a:11|22,b:33', { xlog: -1 }).canon).toEqual('{"a":11|22,"b":33}')
    expect(P('a:11|22|33,b:44', { xlog: -1 }).canon).toEqual('{"a":11|22|33,"b":44}')


    expect(P('a:{b:11}|{c:22},b:33', { xlog: -1 }).canon)
      .toEqual('{"a":{"b":11}|{"c":22},"b":33}')
    //console.dir(P('a:{b:11}|{c:22},b:33'), { depth: null })



    expect(P('a:11&22,b:33', { xlog: -1 }).canon).toEqual('{"a":11&22,"b":33}')
    expect(P('a:11&22&33,b:44', { xlog: -1 }).canon).toEqual('{"a":11&22&33,"b":44}')

    expect(P('a:{b:11}&{c:22},b:33', { xlog: -1 }).canon)
      .toEqual('{"a":{"b":11}&{"c":22},"b":33}')
    //console.dir(P('a:{b:11}&{c:22},b:33'), { depth: null })


    expect(P('a:11&22|33,b:44', { xlog: -1 }).canon).toEqual('{"a":11&22|33,"b":44}')
    // console.dir(P('a:11&22|33,b:44', { xlog: -1 }), { depth: null })

    expect(P('a:11|22&33,b:44', { xlog: -1 }).canon).toEqual('{"a":11|22&33,"b":44}')
    // console.dir(P('a:11|22&33,b:44', { xlog: -1 }), { depth: null })


  })



  it('merge', () => {
    let ctx = makeCtx()


    let v0 = P('a:{x:1},a:{y:2}')
    expect(v0.canon).toEqual('{"a":{"x":1}&{"y":2}}')

    let u0 = v0.unify(TOP, ctx)
    expect(u0.canon).toEqual('{"a":{"x":1,"y":2}}')
    expect(u0.gen()).toEqual({ a: { x: 1, y: 2 } })


    let v1 = P('a:b:{x:1},a:b:{y:2}')
    expect(v1.canon).toEqual('{"a":{"b":{"x":1}}&{"b":{"y":2}}}')

    let u1 = v1.unify(TOP, ctx)
    expect(u1.canon).toEqual('{"a":{"b":{"x":1,"y":2}}}')
    expect(u1.gen()).toEqual({ a: { b: { x: 1, y: 2 } } })


    let v2 = P('a:b:c:{x:1},a:b:c:{y:2}')
    expect(v2.canon).toEqual('{"a":{"b":{"c":{"x":1}}}&{"b":{"c":{"y":2}}}}')

    let u2 = v2.unify(TOP, ctx)
    expect(u2.canon).toEqual('{"a":{"b":{"c":{"x":1,"y":2}}}}')
    expect(u2.gen()).toEqual({ a: { b: { c: { x: 1, y: 2 } } } })


    let v0m = P('a:{x:1},a:{y:2},a:{z:3}')
    expect(v0m.canon).toEqual('{"a":{"x":1}&{"y":2}&{"z":3}}')

    let u0m = v0m.unify(TOP, ctx)
    expect(u0m.canon).toEqual('{"a":{"x":1,"y":2,"z":3}}')
    expect(u0m.gen()).toEqual({ a: { x: 1, y: 2, z: 3 } })


    let v1m = P('a:b:{x:1},a:b:{y:2},a:b:{z:3}')
    expect(v1m.canon).toEqual('{"a":{"b":{"x":1}}&{"b":{"y":2}}&{"b":{"z":3}}}')

    let u1m = v1m.unify(TOP, ctx)
    expect(u1m.canon).toEqual('{"a":{"b":{"x":1,"y":2,"z":3}}}')
    expect(u1m.gen()).toEqual({ a: { b: { x: 1, y: 2, z: 3 } } })


    let v2m = P('a:b:c:{x:1},a:b:c:{y:2},a:b:c:{z:3}')
    expect(v2m.canon).toEqual(
      '{"a":' +
      '{"b":{"c":{"x":1}}}&' +
      '{"b":{"c":{"y":2}}}&' +
      '{"b":{"c":{"z":3}}}}')

    let u2m = v2m.unify(TOP, ctx)
    expect(u2m.canon).toEqual('{"a":{"b":{"c":{"x":1,"y":2,"z":3}}}}')
    expect(u2m.gen()).toEqual({ a: { b: { c: { x: 1, y: 2, z: 3 } } } })


  })


  it('ref', () => {
    // console.dir(lang.jsonic.internal().config)

    let v0 = P('a:.x')
    // console.log(v0)
    expect(v0.peg.a.parts).toEqual(['x'])

    let v1 = P('a:.x.y', { xlog: -1 })
    // console.log(v1)
    expect(v1.peg.a.parts).toEqual(['x', 'y'])
  })


  it('file', () => {
    global.console = require('console')

    let g0 = new Lang({
      // resolver: makeFileResolver((spec: any) => {
      //   return 'string' === typeof spec ? spec : spec?.peg
      // })
    })

    let t00x = g0.parse('x:@"' + __dirname + '/t00.jsonic"')
    expect(t00x.canon).toEqual('{"x":{"a":1}}')

    let t00xA = g0.parse('A:11,x:@"' + __dirname + '/t00.jsonic"')
    expect(t00xA.canon).toEqual('{"A":11,"x":{"a":1}}')
    let t00xB = g0.parse('x:@"' + __dirname + '/t00.jsonic",B:22')
    expect(t00xB.canon).toEqual('{"x":{"a":1},"B":22}')
    let t00xAB = g0.parse('A:11,x:@"' + __dirname + '/t00.jsonic",B:22')
    expect(t00xAB.canon).toEqual('{"A":11,"x":{"a":1},"B":22}')

    let t00xAs = g0.parse('A:11 x:@"' + __dirname + '/t00.jsonic"')
    expect(t00xAs.canon).toEqual('{"A":11,"x":{"a":1}}')
    let t00xBs = g0.parse('x:@"' + __dirname + '/t00.jsonic" B:22')
    expect(t00xBs.canon).toEqual('{"x":{"a":1},"B":22}')
    let t00xABs = g0.parse('A:11 x:@"' + __dirname + '/t00.jsonic" B:22')
    expect(t00xABs.canon).toEqual('{"A":11,"x":{"a":1},"B":22}')


    let t00v = g0.parse('@"' + __dirname + '/t00.jsonic"')
    expect(t00v.canon).toEqual('{}&{"a":1}')
    let t00 = new Unify(t00v)
    expect(t00.res.canon).toEqual('{"a":1}')
    expect(t00.res.gen()).toEqual({ a: 1 })

    let t00vX = g0.parse(' X:11 @"' + __dirname + '/t00.jsonic"')
    expect(t00vX.canon).toEqual('{"X":11}&{"a":1}')
    let t00X = new Unify(t00vX)
    expect(t00X.res.canon).toEqual('{"X":11,"a":1}')
    expect(t00X.res.gen()).toEqual({ X: 11, a: 1 })

    let t00vY = g0.parse('@"' + __dirname + '/t00.jsonic" Y:22 ')
    expect(t00vY.canon).toEqual('{"Y":22}&{"a":1}')
    let t00Y = new Unify(t00vY)
    expect(t00Y.res.canon).toEqual('{"Y":22,"a":1}')
    expect(t00Y.res.gen()).toEqual({ Y: 22, a: 1 })


    let t00dv = g0.parse('D:{@"' + __dirname + '/t00.jsonic"}')
    expect(t00dv.canon).toEqual('{"D":{}&{"a":1}}')
    let t00d = new Unify(t00dv)
    expect(t00d.res.canon).toEqual('{"D":{"a":1}}')
    expect(t00d.res.gen()).toEqual({ D: { a: 1 } })


    let t01v = g0.parse('@"' + __dirname + '/t01.jsonic"')
    expect(t01v.canon).toEqual('{}&{"a":1,"b":{"d":2},"c":3}')

    // let t02v = g0.parse('@"' + __dirname + '/t02.jsonic"')
    // console.dir(t02v, { depth: null })
    // console.log(t02v.canon)

    // let u02 = new Unify(t02v)
    // console.log(u02.res.canon)
    // console.log(u02.res.gen())
  })


  it('conjunct', () => {
    expect(P('1&number').canon).toEqual('1&number')
    expect(P('number&1').canon).toEqual('number&1')

    // FIX
    // expect(() => P('*1&number')).throws()
    // expect(() => P('number&*1')).throws()

    expect(P('{a:1}&{b:2}').canon).toEqual('{"a":1}&{"b":2}')
    expect(P('{a:{c:1}}&{b:{d:2}}').canon).toEqual('{"a":{"c":1}}&{"b":{"d":2}}')

    // FIX
    // expect(() => P('*1')).throws()
  })


  it('disjunct', () => {
    // console.log(P('1|2|3|4', { log: -1 }).canon)

    // FIX
    // expect(() => P('*1')).throws()

    let v0 = P('1|number')
    expect(v0.canon).toEqual('1|number')

    let v1 = P('*1|number', { xlog: -1 })
    //console.dir(v1, { depth: null })
    expect(v1.canon).toEqual('*1|number')

    let v2 = P('integer|*2', { xlog: -1 })
    //console.dir(v2, { depth: null })
    expect(v2.canon).toEqual('integer|*2')
  })


  it('precedence', () => {
    let v0 = P('a:b:1&2')
    // console.dir(v0, { depth: null })
    expect(v0.canon).toEqual('{"a":{"b":1&2}}')
  })


  it('spreads', () => {
    let ctx = makeCtx()

    let v0 = P('a:{&:{x:1,y:integer},b:{y:1},c:{y:2}}')
    expect(v0.canon).toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1},"c":{"y":2}}}')

    let u0 = v0.unify(TOP, ctx)
    expect(u0.canon)
      .toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')

    let v1 = P('k:{x:1,y:integer},a:{&:.k,b:{y:1},c:{y:2}}')
    expect(v1.canon)
      .toEqual('{"k":{"x":1,"y":integer},"a":{&:.k,"b":{"y":1},"c":{"y":2}}}')

    let c1 = makeCtx({ root: v1 })
    let u1a = v1.unify(TOP, c1)
    //console.log(u1a.done, u1a.canon)
    expect(u1a.canon).
      toEqual('{"k":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},' +
        '"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')


    let v2 = P('a:{&:number},a:{x:1},a:{y:2}')
    expect(v2.canon).toEqual('{"a":{&:number}&{"x":1}&{"y":2}}')
    let u2 = v2.unify(TOP, ctx)
    expect(u2.canon).toEqual('{"a":{&:number,"x":1,"y":2}}')

    let v3 = P('a:{&:number,z:3},a:{x:1},a:{y:2}')
    expect(v3.canon).toEqual('{"a":{&:number,"z":3}&{"x":1}&{"y":2}}')
    let u3 = v3.unify(TOP, ctx)
    expect(u3.canon).toEqual('{"a":{&:number,"z":3,"x":1,"y":2}}')

    let v4 = P('b:{a:{&:number,z:3},a:{x:1},a:{y:2}}')
    expect(v4.canon).toEqual('{"b":{"a":{&:number,"z":3}&{"x":1}&{"y":2}}}')
    let u4 = v4.unify(TOP, ctx)
    expect(u4.canon).toEqual('{"b":{"a":{&:number,"z":3,"x":1,"y":2}}}')

    // Must commute!

    let v5a = P('{&:{x:1}}&{a:{y:1}}')
    let u5a = v5a.unify(TOP, ctx)
    expect(u5a.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1}}')

    let v5b = P('{a:{y:1}}&{&:{x:1}}')
    let u5b = v5b.unify(TOP, ctx)
    expect(u5b.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1}}')


    let v6 = P('b:{a:{&:{K:0},z:{Z:3}},a:{x:{X:1}},a:{y:{Y:2}}}')
    expect(v6.canon)
      .toEqual('{"b":{"a":{&:{"K":0},"z":{"Z":3}}&{"x":{"X":1}}&{"y":{"Y":2}}}}')
    let u6 = v6.unify(TOP, ctx)
    expect(u6.canon)
      .toEqual('{"b":{"a":{&:{"K":0},' +
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
    // console.dir(v0, { depth: null })
  })


})


function makeCtx(opts?: any) {
  return new Context(opts || { root: new MapVal({}) })
}
