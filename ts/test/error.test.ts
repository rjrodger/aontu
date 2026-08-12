/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */

import Fs from 'node:fs'
import { describe, it } from 'node:test'
import { expect } from './expect'
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
    let v0 = a0.unify('@"' + __dirname + '/../test/error/e01.aon"', { collect: true })
    expect(v0.err[0].why).equal('scalar_value')
    expect(typeof v0.err[0].msg).equal('string')
  })


  it('generate', () => {
    let aontu = new Aontu()

    expect(() => aontu.generate('a:$.b')).throw(/no_path/)

    expect(() =>
      aontu.generate('@"' + __dirname + '/../test/error/e02.aon"'))
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
      '@"' + __dirname + '/../test/error/e01.aon"',
      { collect: true }
    )
    expect(v0.err[0].why).equal('scalar_value')
    expect(v0.err[0].msg).to.not.contain('SOURCE-NOT-FOUND')
    // e01.aon contains "a: 1\na: 2\n" — error should show the file content
    expect(v0.err[0].msg).to.contain('a: 1')
    expect(v0.err[0].msg).to.contain('a: 2')
  })


  it('error-source-file-cross', () => {
    // Cross-file error: e03.aon imports e04.aon, conflicting on key a.
    // Error message should show file content, not SOURCE-NOT-FOUND.
    let a0 = new Aontu({ fs: Fs })
    let v0 = a0.unify(
      '@"' + __dirname + '/../test/error/e03.aon"',
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



  // The FULL thrown-message twin: this exact literal -- marker,
  // headline, verbatim hint, and both ANSI-coloured source frames -- is
  // asserted byte-for-byte here AND by TestFullMessageTwin in
  // go/hints_test.go, so a change to either port's rendering fails
  // that side loudly. This is the completion pin of issue #29: thrown
  // error text is in cross-port parity. (Spec rows still assert only
  // probed substrings -- the twins are the byte-level guard.)
  it('full-message-twin', () => {
    let err: any = undefined
    try {
      new Aontu().generate('a:1 a:2')
    }
    catch (e: any) {
      err = e
    }
    if (undefined === err) {
      throw new Error('expected error')
    }
    expect(err.message).equal("[aontu/scalar_value]: Cannot unify values at path $.a\n\nLiteral scalar values of the same kind can only unify if they are\nexactly equal.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  a & a   -> a    # Does unify (equal Strings);\n  1 & 2   -> nil  # Does not unify (unequal Integers);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: 2 with value: 1\n  \u001b[34m--> <no-file>:1:7\n\u001b[34m  1 | \u001b[0ma:1 a:2\n            \u001b[34m^ value was: 2\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: 1 with value: 2\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:1 a:2\n        \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n")
  })


  // The BAG-OPERAND twin (issue #34): a map operand carries its real
  // source position (its `{`), so it wins the later-in-source primary
  // rule and its frame points at column 7 -- byte-identical with
  // TestFullMessageBagTwin in go/hints_test.go, where the MapVal
  // source position was missing entirely (frames said 1:1, the operand
  // order flipped) until the Go parse recorded it.
  it('full-message-bag-twin', () => {
    let err: any = undefined
    try {
      new Aontu().generate('a:1 a:{b:1}')
    }
    catch (e: any) {
      err = e
    }
    if (undefined === err) {
      throw new Error('expected error')
    }
    expect(err.message).equal("[aontu/scalar_kind]: Cannot unify values at path $.a\n\nLiteral scalar values of different kinds cannot unify.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: {\"b\":1} with value: 1\n  \u001b[34m--> <no-file>:1:7\n\u001b[34m  1 | \u001b[0ma:1 a:{b:1}\n            \u001b[34m^ value was: {\"b\":1}\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: 1 with value: {\"b\":1}\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:1 a:{b:1}\n        \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n")
  })

})
