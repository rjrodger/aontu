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
		{"note.md", "<!---"},
		{"NOTE.MARKDOWN", "<!---"},
		// An extension the table does not know: the caller passes its
		// own marker, and the default is what it gets meanwhile.
		{"gen.zz", "//-"},
	} {
		if got := MarkerFor(tc.path); tc.want != got {
			t.Fatalf("MarkerFor(%q) = %q, want %q", tc.path, got, tc.want)
		}
	}
}

func TestMarkerFromProfiles(t *testing.T) {
	ocaml := map[string]any{
		"lang": "ocaml",
		"template": map[string]any{
			"marker": "(*-", "close": "*)",
			"ext": []any{"ml", "mli"},
		},
	}
	md := map[string]any{
		"lang":     "markdown",
		"template": map[string]any{"marker": "<!---", "ext": []any{"md"}},
	}
	// No template block, an ext that is not a list, and a list that
	// misses.
	plain := map[string]any{"lang": "plain"}
	odd := map[string]any{
		"lang":     "odd",
		"template": map[string]any{"marker": "%-", "ext": "ml"},
	}
	other := map[string]any{
		"lang":     "other",
		"template": map[string]any{"marker": ";;-", "ext": []any{"zz"}},
	}

	all := []map[string]any{plain, odd, other, ocaml, md}
	for _, tc := range []struct{ path, want string }{
		{"unit.ml", "(*- *)"},
		{"unit.mli", "(*- *)"},
		{"note.md", "<!---"},
		{"gen.ts", ""},
		{"Makefile", ""},
	} {
		if got := MarkerFromProfiles(all, tc.path); tc.want != got {
			t.Fatalf("MarkerFromProfiles(%q) = %q, want %q",
				tc.path, got, tc.want)
		}
	}

	if got := MarkerFromProfiles(nil, "unit.ml"); "" != got {
		t.Fatalf("no profiles: %q", got)
	}
}
