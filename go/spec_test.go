/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
)

// TestSpec runs the shared, data-driven conformance suite. The test
// cases live in the top-level test/spec/*.tsv files and are the single
// source of truth shared with the TypeScript implementation (see
// ts/test/spec.test.ts). Both implementations must produce identical
// results.
//
// TSV columns (tab-separated): name <TAB> mode <TAB> src <TAB> expect
//
//	mode=canon : Unify(src).Canon() must equal expect
//	mode=gen   : Generate(src) must deep-equal JSON(expect)
//	mode=err   : Generate(src) must error, message must contain expect
//
// Escapes in src/expect: \n -> newline, \t -> tab, \\ -> backslash.
func TestSpec(t *testing.T) {
	specDir := filepath.Join("..", "test", "spec")
	entries, err := os.ReadDir(specDir)
	if err != nil {
		t.Fatalf("cannot read spec dir %s: %v", specDir, err)
	}

	// Absolute fixtures dir, so file-loading (@"file") rows resolve the
	// same shared fixtures from any cwd.
	fixturesDir, err := filepath.Abs(filepath.Join(specDir, "files"))
	if err != nil {
		t.Fatalf("fixtures dir: %v", err)
	}
	// Use forward slashes even on Windows: this path is spliced into Aontu
	// source as a quoted @"..." load target, where backslashes would be parsed
	// as string escapes (\t -> tab, \a -> a, ...) and corrupt the path.
	fixturesDir = filepath.ToSlash(fixturesDir)

	var files []string
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".tsv") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)
	if len(files) == 0 {
		t.Fatalf("no .tsv spec files found in %s", specDir)
	}

	total := 0
	for _, file := range files {
		data, err := os.ReadFile(filepath.Join(specDir, file))
		if err != nil {
			t.Fatalf("read %s: %v", file, err)
		}
		for _, line := range strings.Split(string(data), "\n") {
			// Tolerate CRLF checkouts (e.g. Windows) by dropping any trailing
			// \r so the last field never carries a stray carriage return.
			line = strings.TrimSuffix(line, "\r")
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.Split(line, "\t")
			if len(parts) < 4 {
				continue
			}
			name := parts[0]
			mode := parts[1]
			src := strings.ReplaceAll(unescapeSpec(parts[2]), "__FIXTURES__", fixturesDir)
			expect := unescapeSpec(parts[3])
			total++

			t.Run(file+":"+name, func(t *testing.T) {
				a := New()
				vars := specVars()
				switch mode {
				case "canon":
					v, err := a.UnifyVars(src, vars)
					if err != nil {
						t.Fatalf("unify error: %v\n src: %q", err, src)
					}
					if got := v.Canon(); got != expect {
						t.Fatalf("canon mismatch\n src:  %q\n want: %s\n got:  %s", src, expect, got)
					}
				case "gen":
					got, err := a.GenerateVars(src, vars)
					if err != nil {
						t.Fatalf("generate error: %v\n src: %q", err, src)
					}
					if !jsonEqual(got, expect) {
						gj, _ := json.Marshal(got)
						t.Fatalf("gen mismatch\n src:  %q\n want: %s\n got:  %s", src, expect, string(gj))
					}
				case "err":
					_, err := a.GenerateVars(src, vars)
					if err == nil {
						t.Fatalf("expected error containing %q, got none\n src: %q", expect, src)
					}
					if !strings.Contains(err.Error(), expect) {
						t.Fatalf("error mismatch\n src:  %q\n want contains: %s\n got:          %s", src, expect, err.Error())
					}
				default:
					t.Fatalf("unknown spec mode %q", mode)
				}
			})
		}
	}

	if total == 0 {
		t.Fatalf("no spec rows loaded from %s", specDir)
	}
}

// specVars are the $var test variables, shared with the TypeScript
// runner (ts/test/spec.test.ts).
func specVars() map[string]Val {
	obj := newMap()
	obj.set("x", newInteger(1))
	return map[string]Val{
		"foo":  newInteger(11),
		"bar":  newString("hello"),
		"flag": newBoolean(true),
		"obj":  obj,
	}
}

func unescapeSpec(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c == '\\' && i+1 < len(s) {
			i++
			switch s[i] {
			case 'n':
				b.WriteByte('\n')
			case 't':
				b.WriteByte('\t')
			default:
				b.WriteByte(s[i])
			}
		} else {
			b.WriteByte(c)
		}
	}
	return b.String()
}

// jsonEqual compares a generated value with an expected JSON document
// by normalising both through JSON (so numeric types and key order do
// not matter).
func jsonEqual(got any, expectJSON string) bool {
	gj, err := json.Marshal(got)
	if err != nil {
		return false
	}
	var ga any
	if err := json.Unmarshal(gj, &ga); err != nil {
		return false
	}
	var ea any
	if err := json.Unmarshal([]byte(expectJSON), &ea); err != nil {
		return false
	}
	return reflect.DeepEqual(ga, ea)
}
