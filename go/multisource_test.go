/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"path/filepath"
	"reflect"
	"runtime"
	"testing"
)

// testDir returns the absolute path to the project's test/ directory,
// matching the __dirname + '/../test' pattern from lang.test.ts.
func testDir(t *testing.T) string {
	t.Helper()
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Join(filepath.Dir(filename), "..", "test")
	abs, err := filepath.Abs(dir)
	if err != nil {
		t.Fatalf("abs(%q): %v", dir, err)
	}
	return abs
}

// canonOf parses src and returns the resulting Val's canonical form.
// Unlike Generate, this exposes the pre-unification structure so that
// ConjunctVal factors (e.g. `{}&{a:1}`) remain visible.
func canonOf(t *testing.T, src string) string {
	t.Helper()
	a := NewAontu(nil)
	v, err := a.Parse(src)
	if err != nil {
		t.Fatalf("parse error for %q: %v", src, err)
	}
	if v == nil {
		t.Fatalf("nil val for %q", src)
	}
	return v.Canon()
}

// TestMultiSourceFileImport mirrors the file-import block of test/lang.test.ts
// (lines ~155-242). Expected canons differ from the TS strings only in key
// quoting — Go's Canon emits bare keys, TS quotes them. Structural shape
// (ConjunctVal factors, nested maps) must match exactly.
func TestMultiSourceFileImport(t *testing.T) {
	dir := testDir(t)
	t00 := dir + "/t00.jsonic"
	t01 := dir + "/t01.aontu"
	t02 := dir + "/t02.aon"
	t04 := dir + "/t04.jsonic"

	cases := []struct {
		src  string
		want string
	}{
		// Pair-value position: file content replaces the value.
		{`x:@"` + t00 + `"`, `{x:{a:1}}`},
		{`A:11,x:@"` + t00 + `"`, `{A:11,x:{a:1}}`},
		{`x:@"` + t00 + `",B:22`, `{B:22,x:{a:1}}`},
		{`A:11,x:@"` + t00 + `",B:22`, `{A:11,B:22,x:{a:1}}`},

		// Same patterns with implicit (whitespace) separators.
		{`A:11 x:@"` + t00 + `"`, `{A:11,x:{a:1}}`},
		{`x:@"` + t00 + `" B:22`, `{B:22,x:{a:1}}`},
		{`A:11 x:@"` + t00 + `" B:22`, `{A:11,B:22,x:{a:1}}`},

		// Top-level @ alone: empty map conjunct file.
		{`@"` + t00 + `"`, `{}&{a:1}`},
		{`X:11 @"` + t00 + `"`, `{X:11}&{a:1}`},
		{`@"` + t00 + `" Y:22`, `{Y:22}&{a:1}`},

		// @ inside an explicit map literal.
		{`D:{@"` + t00 + `"}`, `{D:{}&{a:1}}`},

		// Recursive imports with relative paths (t01 imports ./f01/f01t01.jsonic).
		{`@"` + t01 + `"`, `{}&{a:1,b:{d:2},c:3}`},
		// t02 imports t03.aon as a sibling, producing a nested conjunct.
		{`@"` + t02 + `"`, `{}&({x:1}&{y:2})`},

		// Multiple top-level imports concatenate as conjunct factors.
		{"\n@\"" + t00 + "\"\n", `{}&{a:1}`},
		{"\n@\"" + t00 + "\"\n@\"" + t04 + "\"\n", `{}&{a:1}&{b:2}`},
		{"\nx: 11\n@\"" + t00 + "\"\ny: 22\n@\"" + t04 + "\"\nz: 33\n",
			`{x:11,y:22,z:33}&{a:1}&{b:2}`},
		{"\nx:y:{}\n@\"" + t00 + "\"\n", `{x:{y:{}}}&{a:1}`},
	}

	for _, c := range cases {
		got := canonOf(t, c.src)
		if got != c.want {
			t.Errorf("canon mismatch\n  src:  %q\n  got:  %s\n  want: %s", c.src, got, c.want)
		}
	}
}

// TestMultiSourceGenerate verifies that file-imported values unify and
// generate the expected concrete output, matching the .res.gen(ctx) checks
// in test/lang.test.ts.
func TestMultiSourceGenerate(t *testing.T) {
	dir := testDir(t)
	t00 := dir + "/t00.jsonic"
	t01 := dir + "/t01.aontu"
	t02 := dir + "/t02.aon"

	cases := []struct {
		src  string
		want any
	}{
		{`@"` + t00 + `"`, map[string]any{"a": 1}},
		{`X:11 @"` + t00 + `"`, map[string]any{"X": 11, "a": 1}},
		{`@"` + t00 + `" Y:22`, map[string]any{"Y": 22, "a": 1}},
		{`D:{@"` + t00 + `"}`, map[string]any{"D": map[string]any{"a": 1}}},
		{`@"` + t01 + `"`, map[string]any{
			"a": 1,
			"b": map[string]any{"d": 2},
			"c": 3,
		}},
		{`@"` + t02 + `"`, map[string]any{"x": 1, "y": 2}},
	}

	a := NewAontu(nil)
	for _, c := range cases {
		got, err := a.Generate(c.src)
		if err != nil {
			t.Errorf("generate error for %q: %v", c.src, err)
			continue
		}
		if !reflect.DeepEqual(got, c.want) {
			t.Errorf("generate mismatch\n  src:  %q\n  got:  %#v\n  want: %#v", c.src, got, c.want)
		}
	}
}
