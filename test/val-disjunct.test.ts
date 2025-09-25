/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */


import {
  Lang
} from '../lib/lang'

import {
  Context,
  Unify,
} from '../lib/unify'




import { expect } from '@hapi/code'
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
// const D = (x: any) => console.dir(x, { depth: null })
const UC = (s: string, r?: any) => (r = P(s)).unify(TOP, makeCtx(r)).canon
const G = (x: string, ctx?: any) => new Unify(x, lang).res.gen(ctx)
// const V = (x: any) => console.dir(x, { depth: null })




describe('val-disjunct', function() {


  it('basic', () => {
    let u0 = UC('a:{x:1}|{y:2},a:{z:3}')
    expect(u0).equal('{"a":{"x":1,"z":3}|{"y":2,"z":3}}')

    let u1 = UC('a:{x:1}|{y:2},a:{z:3}|{q:4}')
    expect(u1)
      .equal('{"a":{"x":1,"z":3}|{"y":2,"z":3}|{"x":1,"q":4}|{"y":2,"q":4}}')

    let u2 = UC('a:*1|number,a:*2|number')
    expect(u2).equal('{"a":*2|*1|number}')

    let u3 = UC('*1|number & *2|number')
    expect(u3).equal('*2|*1|number')

    let g0 = G('{&:{x:*1|number},a:{},b:{x:2}}')
    expect(g0).equal({ a: { x: 1 }, b: { x: 2 } })

    let g1 = G('&:{x:*1|number},a:{},b:{x:2}')
    expect(g1).equal({ a: { x: 1 }, b: { x: 2 } })
  })


  it('clone', () => {
    let v0 = P('{x:1}|{y:2}|{z:3}')
    // console.log(v0.canon)
    expect(v0.canon).equal('({"x":1}|{"y":2})|{"z":3}')

    let v0c = v0.clone()
    expect(v0c.canon).equal('({"x":1}|{"y":2})|{"z":3}')
  })

})


function makeCtx(r?: any) {
  return new Context({ root: r || new MapVal({ peg: {} }) })
}
