/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */

import Fs from 'node:fs'
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

    // TODO: better resolution of spresd children for error msgs
    expect(a0.generate('x:&:&:s:string x:a:b:s:S'))
      .equal({ x: { a: { b: { s: 'S' } } } })
    // expect(() => a0.generate('x:&:&:s:string x:a:b:{}'))
    //   .throws(/mapval_spread_required/)
  })


  it('error-source-inline', () => {
    // Inline source: error message should show the actual source text,
    // not SOURCE-NOT-FOUND.
    let a0 = new Aontu()
    let v0 = a0.unify('a:1,a:2', { collect: true })
    expect(v0.err[0].why).equal('scalar_value')
    expect(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND')
    expect(v0.err[0].msg).to.contain('a:1,a:2')
  })


  it('error-source-inline-no-fs', () => {
    // Inline source without fs: should still show the source text
    // via errctx.src fallback.
    let a0 = new Aontu()
    let v0 = a0.unify('x:1,x:2', { collect: true })
    expect(v0.err[0].why).equal('scalar_value')
    expect(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND')
    expect(v0.err[0].msg).to.not.contain('NO-FS')
    expect(v0.err[0].msg).to.contain('x:1,x:2')
  })


  it('error-source-inline-with-fs', () => {
    // Inline source with fs provided: fs cannot read a directory,
    // so should fall back to errctx.src.
    let a0 = new Aontu({ fs: Fs, path: process.cwd() })
    let v0 = a0.unify('b:1,b:2', { collect: true })
    expect(v0.err[0].why).equal('scalar_value')
    expect(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND')
    expect(v0.err[0].msg).to.contain('b:1,b:2')
  })


  it('error-source-file', () => {
    // File source: error message should show the file content.
    let a0 = new Aontu({ fs: Fs })
    let v0 = a0.unify(
      '@"' + __dirname + '/../test/error/e01.jsonic"',
      { collect: true }
    )
    expect(v0.err[0].why).equal('scalar_value')
    expect(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND')
    // e01.jsonic contains "a: 1\na: 2\n" — error should show the file content
    expect(v0.err[0].msg).to.contain('a: 1')
    expect(v0.err[0].msg).to.contain('a: 2')
  })


  it('error-source-file-cross', () => {
    // Cross-file error: e03.jsonic imports e04.jsonic, conflicting on key a.
    // Error message should show file content, not SOURCE-NOT-FOUND.
    let a0 = new Aontu({ fs: Fs })
    let v0 = a0.unify(
      '@"' + __dirname + '/../test/error/e03.jsonic"',
      { collect: true }
    )
    expect(v0.err[0].why).equal('scalar_value')
    expect(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND')
  })


  it('error-source-generate-inline', () => {
    // Generate with inline source: thrown error should contain source text.
    let a0 = new Aontu()
    try {
      a0.generate('a:1,a:2')
      throw new Error('should have thrown')
    }
    catch (e: any) {
      expect(e instanceof AontuError).equal(true)
      expect(e.message).to.not.contain('SOURCE-NOT-FOUND')
      expect(e.message).to.contain('a:1,a:2')
    }
  })

})

