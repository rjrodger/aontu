
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




describe('val-ref', function() {

  test('construct', () => {
    let r0 = new RefVal(['$', 'a'])
    // console.log(r0)
    expect(r0).toMatchObject({
      peg: '$.a',
      path: [],
      absolute: true,
      parts: ['a']
    })

    let r1 = new RefVal(['$', 'a', 'b'])
    // console.log(r0)
    expect(r1).toMatchObject({
      peg: '$.a.b',
      path: [],
      absolute: true,
      parts: ['a', 'b']
    })

    let r2 = new RefVal(['$'])
    // console.log(r0)
    expect(r2).toMatchObject({
      peg: '$',
      path: [],
      absolute: true,
      parts: []
    })

    let r3 = new RefVal([])
    // console.log(r0)
    expect(r3).toMatchObject({
      peg: '',
      path: [],
      absolute: false,
      parts: []
    })

    let r4 = new RefVal(['a'])
    // console.log(r0)
    expect(r4).toMatchObject({
      peg: '.a',
      path: [],
      absolute: false,
      parts: ['a']
    })

    let r5 = new RefVal(['a', 'b'])
    // console.log(r0)
    expect(r5).toMatchObject({
      peg: '.a.b',
      path: [],
      absolute: false,
      parts: ['a', 'b']
    })
  })


  test('clone', () => {

    let c0 = makeCtx(null, ['x'])

    let r0 = new RefVal(['$', 'a'], c0)
    // console.log(r0)
    expect(r0).toMatchObject({
      peg: '$.a',
      path: ['x'],
      absolute: true,
      parts: ['a']
    })

    let r1 = r0.clone()
    expect(r1).toMatchObject({
      peg: '$.a',
      path: ['x'],
      absolute: true,
      parts: ['a']
    })

    let c1 = makeCtx(null, ['y', 'z'])
    let r2 = r0.clone(c1)
    expect(r2).toMatchObject({
      peg: '$.a',
      path: ['y', 'z'],
      absolute: true,
      parts: ['a']
    })


    let c2 = makeCtx(null, ['k'])
    let r3 = r2.clone(c2)
    expect(r3).toMatchObject({
      peg: '$.a',
      path: ['k', 'z'],
      absolute: true,
      parts: ['a']
    })


  })


  test('absolute', () => {
    let s0 = 'a:$.x,x:1'
    let v0 = P(s0)
    // console.log(v0)
    expect(v0.peg.a.parts).toEqual(['x'])
    expect(v0.canon).toEqual('{"a":$.x,"x":1}')
    expect(G(s0)).toEqual({ a: 1, x: 1 })

    let s1 = 'a:$.x.y,x:y:1'
    let v1 = P(s1)
    // console.log(v0)
    expect(v1.peg.a.parts).toEqual(['x', 'y'])
    expect(v1.canon).toEqual('{"a":$.x.y,"x":{"y":1}}')
    expect(G(s1)).toEqual({ a: 1, x: { y: 1 } })

    let s2 = 'a:$.x.y.z,x:y:z:1'
    let v2 = P(s2)
    // console.log(v0)
    expect(v2.peg.a.parts).toEqual(['x', 'y', 'z'])
    expect(v2.canon).toEqual('{"a":$.x.y.z,"x":{"y":{"z":1}}}')
    expect(G(s2)).toEqual({ a: 1, x: { y: { z: 1 } } })
  })


  test('relative-sibling', () => {
    let s0 = 'a:{b:.c,c:1}'
    let v0 = P(s0)
    // console.log(v0)
    expect(v0.peg.a.peg.b.parts).toEqual(['c'])
    expect(v0.canon).toEqual('{"a":{"b":.c,"c":1}}')
    expect(G(s0)).toEqual({ a: { b: 1, c: 1 } })

    let s1 = 'a:{b:.c.d,c:d:1}'
    let v1 = P(s1)
    // console.log(v0)
    expect(v1.peg.a.peg.b.parts).toEqual(['c', 'd'])
    expect(v1.canon).toEqual('{"a":{"b":.c.d,"c":{"d":1}}}')
    expect(G(s1)).toEqual({ a: { b: 1, c: { d: 1 } } })
  })


  test('relative-parent', () => {
    let s0 = 'a:b:c:1,a:d:e:..b.c'
    let v0 = P(s0)
    // console.dir(v0, { depth: null })
    expect(v0.peg.a.peg[1].peg.d.peg.e.parts).toEqual(['.', 'b', 'c'])
    expect(v0.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":..b.c}}}')
    expect(G(s0)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } })

    let s1 = 'a:b:c:1,a:d:e:...a.b.c'
    let v1 = P(s1)
    // console.dir(v0, { depth: null })
    expect(v1.peg.a.peg[1].peg.d.peg.e.parts).toEqual(['.', '.', 'a', 'b', 'c'])
    expect(v1.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":...a.b.c}}}')
    expect(G(s1)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } })
  })


  test('key', () => {
    let s0 = 'a:b:1,c:$.a.b$KEY'
    // let v0 = P(s0)
    // console.log('AAA', v0)
    // expect(v0.canon).toEqual('{"a":{"b":1},"c":$.a.b$KEY}')
    expect(G(s0)).toEqual({ a: { b: 1 }, c: 'a' })


    let s1 = 'a:b:c:.$KEY'
    // let v1 = P(s1)
    // console.log('AAA', v0)
    // expect(v1.canon).toEqual('')
    expect(G(s1)).toEqual({ a: { b: { c: 'b' } } })

    let s2 = 'a:b:.$KEY'
    // let v1 = P(s1)
    // console.log('AAA', v0)
    // expect(v1.canon).toEqual('')
    expect(G(s2)).toEqual({ a: { b: 'a' } })


    // TRY: copy RefVal on first find 

    let s3 = `
# a: { n: .$KEY, x:1 }
# b: { &: .a }
b: { &: {n:.$KEY} }
b: { c0: { k:0, m:.$KEY }}
b: { c1: { k:1 }}
`
    console.dir(G(s3), { depth: null })


    // let v1 = P(s1)
    // console.log('AAA', v0)
    // expect(v0.canon).toEqual('{"a":{"b":1},"c":$.a.b$KEY}')
    // expect(G(s1)).toEqual({})

  })



  it('ref', () => {
    let ctx = makeCtx()

    let d0 = new RefVal(['a'])
    let d1 = new RefVal(['$', 'c'])
    let d2 = new RefVal(['a', 'b'])
    let d3 = new RefVal(['$', 'c', 'd', 'e'])

    expect(d0.canon).toEqual('.a')
    expect(d1.canon).toEqual('$.c')
    expect(d2.canon).toEqual('.a.b')
    expect(d3.canon).toEqual('$.c.d.e')

    d0.append('x')
    d1.append('x')
    d2.append('x')
    d3.append('x')

    expect(d0.canon).toEqual('.a.x')
    expect(d1.canon).toEqual('$.c.x')
    expect(d2.canon).toEqual('.a.b.x')
    expect(d3.canon).toEqual('$.c.d.e.x')

    expect(d0.unify(TOP, ctx).canon).toEqual('.a.x')
    expect(TOP.unify(d0, ctx).canon).toEqual('.a.x')
    expect(d1.unify(TOP, ctx).canon).toEqual('$.c.x')
    expect(TOP.unify(d1, ctx).canon).toEqual('$.c.x')
  })

  /*
  it('unify', () => {
    let r1 = new RefVal('a')
    let r2 = new RefVal('a')

    let ctx = makeCtx()
    let u12 = r1.unify(r2, ctx)
    // console.log(u12, r1.id, r2.id)

    expect(r1).toEqual(u12)
  })


  it('spreadable', () => {
    let g0 = G('a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3')
    // console.log(g0)
    expect(g0).toEqual({ a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } })

    let g1 = G('{z:4} & {a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3}')
    // console.log(g1)
    expect(g1).toEqual({ z: 4, a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } })

    let g2 = G('{ x:{&:.a} x:{y:{q:2}} x:{m:{q:3}} } & {a:{z:1}}')
    // console.log(g2)
    expect(g2).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 }, m: { z: 1, q: 3 } } })

    let g3 = G('{}&{a:{z:1},x:{&:.a}&{y:{q:2}}}')
    // console.log(g3)
    expect(g3).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 } } })
  })

  */
})


function print(o: any, t?: string) {
  if (null != t) {
    console.log(t)
  }
  console.dir(o, { depth: null })
}


function makeCtx(r?: any, p?: string[]) {
  return new Context({
    root: r || new MapVal({}),
    path: p
  })
}
