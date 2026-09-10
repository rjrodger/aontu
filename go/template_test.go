/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu


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
		{"Makefile", "//-"},
		{"gen", "//-"},
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
