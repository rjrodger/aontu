
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
  RefVal,
  // norm
} from '../lib/val/RefVal'


import { MapVal } from '../lib/val/MapVal'


import {
  TOP
} from '../lib/type'


const lang = new Lang()
const PL = lang.parse.bind(lang)
const P = (x: string, ctx?: any) => PL(x, ctx)
const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r)).canon
const G = (x: string, ctx?: any) => new Unify(x, lang).res.gen(ctx)
const V = (x: any) => console.dir(x, { depth: null })




describe('val-ref', function() {

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
