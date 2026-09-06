/* Copyright (c) 2026 Richard Rodger, MIT License */

// The extension table of the template surface. The two TRANSFORMS are
// pinned by test/spec/template.tsv, which both runners execute; this is
// the one piece of the surface a spec row cannot reach, because the
// mode is handed a marker rather than a file name. Twin of
// TestMarkerFor in go/template_test.go.

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
      // NO EXTENSION AT ALL takes the default rather than no marker:
      // `Makefile` and `Dockerfile` are ordinary generators, and the
      // table is a convenience over a default rather than the thing
      // that decides a file is a template.
      ['Makefile', '//-'],
      ['gen', '//-'],
      // A DOT IN A DIRECTORY IS NOT AN EXTENSION, or `v1.2/gen` would
      // be read as a `2/gen` file.
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
