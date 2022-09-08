
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


import {
  ConjunctVal,
  // norm
} from '../lib/val/ConjunctVal'

import { MapVal } from '../lib/val/MapVal'



import {
  TOP
} from '../lib/type'


const lang = new Lang()
const PL = lang.parse.bind(lang)
const P = (x: string, ctx?: any) => PL(x, ctx)
const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r)).canon
const G = (x: string, ctx?: any) => new Unify(x, lang).res.gen()
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
    let g0 = G('a:1,b:number&.a')
    expect(g0).toEqual({ a: 1, b: 1 })

    let g1 = G('x:a:1,x:b:.x.a')
    expect(g1).toEqual({ x: { a: 1, b: 1 } })

    // let g2 = G('x:a:1,x:b:number&.x.a')
    // expect(g2).toEqual({ x: { a: 1, b: 1 } })

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