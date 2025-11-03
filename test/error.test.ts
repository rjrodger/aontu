/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */

import { describe, it } from 'node:test'
import { expect } from '@hapi/code'
import { Aontu, Context } from '../dist/aontu'

import { MapVal } from '../dist/val/MapVal'


describe('error', function() {

  it('syntax', () => {
    let v0 = Aontu('a::1')
    expect(v0.err[0]).include({ nil: true, why: 'syntax' })
    expect(typeof v0.err[0].msg).equal('string')
  })


  it('unify', () => {
    let v0 = Aontu('a:1,a:2')
    expect(v0.err[0].why).equal('scalar')
    expect(typeof v0.err[0].msg).equal('string')
  })


  it('file-e01', async () => {
    let v0 = Aontu('@"' + __dirname + '/../test/error/e01.jsonic"')
    expect(v0.err[0].why).equal('scalar')
    expect(typeof v0.err[0].msg).equal('string')
  })


  it('generate', () => {
    let v0 = Aontu('a:$.b')


    try {
      v0.gen(makeCtx())
    }
    catch (err: any) {
      // expect(err.message).contain('Cannot')
    }

    let c0 = new Context({ root: v0 })
    let g0 = v0.gen(c0)
    // expect(g0).equal({ a: undefined })

    /*
    expect(c0.err[0] as any).include({
      path: ['a'],
      row: 1,
      col: 3,
      nil: true,
      why: 'ref',
    })
    expect(c0.err[0].primary as any).include({
      peg: ['b'],
      absolute: true
      })
      */
  })


  it('generate-file-e02', () => {
    let ctx = makeCtx()
    let v0 = Aontu('@"' + __dirname + '/../test/error/e02.jsonic"')

    try {
      v0.gen(ctx)
    }
    catch (err: any) {
      expect(err.message).contain('RefVal')
    }

    let v1 = Aontu('@"' + __dirname + '/../test/error/e02.jsonic"')
    let c1 = new Context({ root: v1 })
    let g1 = v1.gen(c1)
    // expect(g1).equal({ a: undefined })
    expect(g1).includes({ isNil: true })

    /*
    expect(c1.err[0] as any).include({
      path: ['a'],
      row: 1,
      col: 4,
      nil: true,
      why: 'ref',
    })
    expect(c1.err[0].primary as any).include({
      peg: ['b'],
      absolute: true
      })
      */
  })

})


function makeCtx(r?: any) {
  return new Context({ root: r || new MapVal({ peg: {} }) })
}
