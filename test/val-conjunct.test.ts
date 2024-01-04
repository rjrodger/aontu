/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */



import {
  Lang
} from '../lib/lang'

import {
  Context,
  Unify,
} from '../lib/unify'




import { TOP } from '../lib/val'
import { ConjunctVal } from '../lib/val/ConjunctVal'
import { DisjunctVal } from '../lib/val/DisjunctVal'
import { ListVal } from '../lib/val/ListVal'
import { MapVal } from '../lib/val/MapVal'
import { Nil } from '../lib/val/Nil'
import { PrefVal } from '../lib/val/PrefVal'
import { RefVal } from '../lib/val/RefVal'
import { ValBase } from '../lib/val/ValBase'




const lang = new Lang()
const PL = lang.parse.bind(lang)
const P = (x: string, ctx?: any) => PL(x, ctx)
const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r)).canon
const G = (x: string, ctx?: any) => new Unify(x, lang).res.gen(ctx)
const V = (x: any) => console.dir(x, { depth: null })




describe('val-conjunct', function() {

  it('norm', () => {
    // let c0 = P('1&2&3')
    // let nc0 = norm(c0.peg)
    // expect(nc0.map(e => e.peg)).equal([1, 2, 3])

    // // Only norm to one level!
    // let c1 = P('1&2&3&4')
    // let nc1 = norm(c1.peg)
    // expect(nc1.map(e => e.peg)).equal([nc1[0].peg, 3, 4])
  })

  it('basic', () => {
    let g0 = G('1&number')
    // console.log(g0)
    expect(g0).toEqual(1)

    let g1 = G('{a:1}&{b:2}&{c:3}')
    // console.log(g0)
    expect(g1).toEqual({ a: 1, b: 2, c: 3 })

  })


  it('ref', () => {
    let g0 = G('a:1,b:number&$.a')
    expect(g0).toEqual({ a: 1, b: 1 })

    let g1 = G('x:a:1,x:b:$.x.a')
    expect(g1).toEqual({ x: { a: 1, b: 1 } })

    let g2 = G('x:a:1,x:b:number&$.x.a')
    expect(g2).toEqual({ x: { a: 1, b: 1 } })

    expect(UC('a:*1|number,b:*2|number,c:$.a&$.b'))
      .toEqual('{"a":*1|number,"b":*2|number,"c":*2|*1|number}')

    let g3 = G('{b:$.a&$.a}&{a:1}')
    expect(g3).toEqual({ a: 1, b: 1 })

  })


  it('disjunct', () => {
    let u0 = UC('a:{x:1}|{y:2},a:{z:3}')
    expect(u0).toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}}')

    let u1 = UC('a:{x:1}|{y:2},a:{z:3}|{q:4}')
    expect(u1)
      .toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}|{"x":1,"q":4}|{"y":2,"q":4}}')

    let u2 = UC('a:*1|number,a:*2|number')
    expect(u2).toEqual('{"a":*2|*1|number}')

    let u3 = UC('*1|number & *2|number')
    expect(u3).toEqual('*2|*1|number')

  })


  it('map', () => {
    let m0 = UC('{a:1}&{b:2}')
    expect(m0).toEqual('{"a":1,"b":2}')

    let m1 = UC('x:{a:$.y}&{b:2},y:1')
    expect(m1).toEqual('{"x":{"a":1,"b":2},"y":1}')

    let s2 = 'x:{a:$.x.b}&{b:2}'
    expect(UC(s2)).toEqual('{"x":{"a":$.x.b,"b":2}}')
    expect(G(s2)).toEqual({ "x": { "a": 2, "b": 2 } })

    let s3 = 'y:x:{a:$.y.x.b}&{b:2}'
    expect(UC(s3)).toEqual('{"y":{"x":{"a":$.y.x.b,"b":2}}}')
    expect(G(s3)).toEqual({ y: { x: { a: 2, b: 2 } } })

  })


  it('conjunct-spread', () => {
    let g0 = G('{&:{x:*1|number},a:{},b:{x:2}}')
    expect(g0).toEqual({ a: { x: 1 }, b: { x: 2 } })

    let g1 = G('&:{x:*1|number},a:{},b:{x:2}')
    expect(g1).toEqual({ a: { x: 1 }, b: { x: 2 } })

    // let p2 = P('a1: &: { x1: 11 } b2: { y2: 22 }')
    // console.dir(p2, { depth: null })

    let g2 = G('a1: &: { x1: 11 } b2: { y2: 22 }')
    expect(g2).toEqual({ a1: {}, b2: { y2: 22 } })

    let g3 = G('a1: &: { c1: { x1: 11 } } b2: { y2: 22 }')
    expect(g3).toEqual({ a1: {}, b2: { y2: 22 } })

    // let p4 = P('a1: &: { c1: &: { x1: 11 } } b2: { y2: 22 }')
    // console.dir(p4, { depth: null })

    let g4 = G('a1: &: { c1: &: { x1: 11 } } b2: { y2: 22 }')
    expect(g4).toEqual({ a1: {}, b2: { y2: 22 } })

    // let p5 = P('a1: &: { c1: &: { d1: &: { x1: 11 } } } b2: { y2: 22 }')
    // console.dir(p5, { depth: null })

    let g5 = G('a1: &: { c1: &: { d1: &: { x1: 11 } } } b2: { y2: 22 }')
    expect(g5).toEqual({ a1: {}, b2: { y2: 22 } })
  })


  it('clone', () => {
    let v0 = P('{x:1}&{y:2}&{z:3}')
    // console.log(v0.canon)
    expect(v0.canon).toEqual('{"x":1}&{"y":2}&{"z":3}')

    let v0c = v0.clone()
    expect(v0c.canon).toEqual('{"x":1}&{"y":2}&{"z":3}')
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
