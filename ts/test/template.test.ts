/* Copyright (c) 2026 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import Assert from 'node:assert'

import { markerFor } from '../dist/template'


describe('template-marker', () => {
  test('marker-for-reads-the-extension', () => {
    const cases: [string, string][] = [
      // The comment token of the language, plus a dash.
      ['gen.ts', '//-'],
      ['handlers/gen.go', '//-'],
      ['gen.rb', '#-'],
      ['gen.sql', '---'],
      // A language with no line comment marks with the block form.
      ['theme.css', '/*-'],
      // THE EXTENSION IS CASE-INSENSITIVE: a file from a case-folding
      // filesystem is the same generator.
      ['GEN.TS', '//-'],
      ['Makefile', '//-'],
      ['gen', '//-'],
      ['v1.2/gen', '//-'],
      ['win\\v1.2\\gen', '//-'],
      // An extension the table does not know: the caller passes its own
      // marker, and the default is what it gets meanwhile.
      ['gen.zz', '//-'],
    ]
    for (const [path, want] of cases) {
      Assert.equal(markerFor(path), want, path)
    }
  })
})
