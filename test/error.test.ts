/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */

import { describe, it } from 'node:test'
import { expect } from '@hapi/code'
import { Aontu, AontuContext } from '../dist/aontu'

import { MapVal } from '../dist/val/MapVal'


describe('error', function() {

  it('syntax', () => {
    let a0 = new Aontu()

    let v0 = a0.parse('a::1', { collect: true })
    expect(v0?.err[0].why).equal('syntax')

    let v1 = a0.unify('a::1', { collect: true })
    expect(v1?.err[0].why).equal('syntax')

    let err: any[] = []
    let v2 = a0.generate('a::1', { err })
    expect(v2).equal(undefined)
    expect(err[0].why).equal('syntax')

    expect(() => a0.parse('a::1')).throws(/syntax/)
    expect(() => a0.unify('a::1')).throws(/syntax/)
    expect(() => a0.generate('a::1')).throws(/syntax/)
  })


  it('unify', () => {
    let a0 = new Aontu()
    let v0 = a0.unify('a:1,a:2', { collect: true })
    expect(v0.err[0].why).equal('scalar_value')
    expect(typeof v0.err[0].msg).equal('string')
  })


  it('file-e01', async () => {
    let a0 = new Aontu()
    let v0 = a0.unify('@"' + __dirname + '/../test/error/e01.jsonic"', { collect: true })
    expect(v0.err[0].why).equal('scalar_value')
    expect(typeof v0.err[0].msg).equal('string')
  })


  it('generate', () => {
    let a0 = new Aontu()
    let v0 = a0.unify('a:$.b')


    try {
      v0.gen(makeCtx())
    }
    catch (err: any) {
      // expect(err.message).contain('Cannot')
    }

    let c0 = new AontuContext({ root: v0 })
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
    let a0 = new Aontu()
    let v0 = a0.unify('@"' + __dirname + '/../test/error/e02.jsonic"')

    try {
      v0.gen(ctx)
    }
    catch (err: any) {
      expect(err.message).contain('RefVal')
    }

    let v1 = a0.unify('@"' + __dirname + '/../test/error/e02.jsonic"')
    let c1 = new AontuContext({ root: v1 })
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
  return new AontuContext({ root: r || new MapVal({ peg: {} }) })
}
