/* Copyright (c) 2020-2025 Richard Rodger and other contributors, MIT License */

import { describe, it } from 'node:test'
import { expect } from '@hapi/code'


import {
  Lang
} from '../dist/lang'

import {
  AontuContext
} from '../dist/ctx'


import { MapVal } from '../dist/val/MapVal'



import {
  unite,
} from '../dist/unify'



let lang = new Lang()
let PL = lang.parse.bind(lang)
let P = (x: string, ctx?: any) => PL(x, ctx)
let PA = (x: string[], ctx?: any) => x.map(s => PL(s, ctx))

describe('op', () => {
  it('happy', () => {
    expect(unite.name).equal('unite')
    // expect(disjunct.name).equal('disjunct')
  })



  it('unite-conjunct', () => {
    let U = makeUnite()

    //expect(U('1&1')).equal('1')
    expect(U('1&number')).equal('1')
  })
})


function makeCtx(r?: any) {
  return new AontuContext({ root: r || new MapVal({ peg: {} }) })
}



function makeUnite(r?: any) {
  let ctx = makeCtx(r)
  return (s: string) => {
    let terms: any[] = s.trim().split(/\s+/).map(x => 'undef' === x ? undefined : x)
    let pterms: any = PA(terms)
    // console.log(pterms)
    let u = unite(ctx, pterms[0], pterms[1], 'op-test')
    // console.log(u)
    return u.canon
  }
}

