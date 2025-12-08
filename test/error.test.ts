/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */

import { describe, it } from 'node:test'
import { expect } from '@hapi/code'
import { Aontu, AontuContext } from '../dist/aontu'

import { MapVal } from '../dist/val/MapVal'
import { AontuError } from '../dist/err'


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


    try {
      a0.generate('a:"x')
    }
    catch (e: any) {
      expect(e.name).equal('AontuError')
      expect(e instanceof AontuError).equal(true)
    }
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
    let aontu = new Aontu()

    expect(() => aontu.generate('a:$.b')).throw(/no_path/)

    expect(() =>
      aontu.generate('@"' + __dirname + '/../test/error/e02.jsonic"'))
      .throw(/no_path/)
  })


  it('required', () => {
    let a0 = new Aontu()

    expect(a0.generate('a:string a:A')).equal({ a: 'A' })
    expect(() => a0.generate('a:string')).throws(/mapval_no_gen/)
    expect(() => a0.generate('a:string a:1')).throws(/no_scalar_unify/)

    expect(a0.generate('x:&:s:string x:a:s:S')).equal({ x: { a: { s: 'S' } } })
    expect(() => a0.generate('x:&:s:string x:a:s:1')).throws(/no_scalar_unify/)
    expect(() => a0.generate('x:&:s:string x:a:{}')).throws(/mapval_spread_required/)

    expect(a0.generate('x:[&:s:string] x:[{s:S}]')).equal({ x: [{ s: 'S' }] })
    expect(() => a0.generate('x:[&:s:string] x:[{s:1}]')).throws(/no_scalar_unify/)

    // NOT: map inside list!
    expect(() => a0.generate('x:[&:s:string] x:[{}]')).throws(/mapval_spread_required/)
  })

})

