/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

// The extension table of the template surface. The two TRANSFORMS are
// pinned by test/spec/template.tsv, which both runners execute; this
// is the one piece of the surface a spec row cannot reach, because the
// mode is handed a marker rather than a file name. Twin of the
// marker-for cases in ts/test/template.test.ts.

import "testing"

func TestMarkerFor(t *testing.T) {
	for _, tc := range []struct{ path, want string }{
		// The comment token of the language, plus a dash.
		{"gen.ts", "//-"},
		{"handlers/gen.go", "//-"},
		{"gen.rb", "#-"},
		{"gen.sql", "---"},
		// A language with no line comment marks with the block form.
		{"theme.css", "/*-"},
		// THE EXTENSION IS CASE-INSENSITIVE: a file from a case-folding
		// filesystem is the same generator.
		{"GEN.TS", "//-"},
		// NO EXTENSION AT ALL takes the default rather than no marker:
		// `Makefile` and `Dockerfile` are ordinary generators, and the
		// table is a convenience over a default rather than the thing
		// that decides a file is a template.
		{"Makefile", "//-"},
		{"gen", "//-"},
		// A DOT IN A DIRECTORY IS NOT AN EXTENSION, or `v1.2/gen` would
		// be read as a `2/gen` file.
		{"v1.2/gen", "//-"},
		{`win\v1.2\gen`, "//-"},
		// An extension the table does not know: the caller passes its
		// own marker, and the default is what it gets meanwhile.
		{"gen.zz", "//-"},
	} {
		if got := MarkerFor(tc.path); tc.want != got {
			t.Fatalf("MarkerFor(%q) = %q, want %q", tc.path, got, tc.want)
		}
	}
}
