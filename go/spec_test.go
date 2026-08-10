/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"bytes"
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
//	mode=gens  : Generate(src) serialised as compact JSON must equal
//	             expect BYTE FOR BYTE
//	mode=err   : Generate(src) must error, message must contain expect
//
// gen vs gens: gen normalises both sides through a JSON decode, which
// collapses every number to a float64 — so two distinct exact integers
// above 2^53 compare EQUAL and exactness is unassertable. gens compares
// the serialised text instead, and is the mode the number tower's exact
// leaves need (docs/design/number-tower.md, D10). See specGens for the
// serialisation contract the two runners share.
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
				case "gens":
					got, err := a.GenerateVars(src, vars)
					if err != nil {
						t.Fatalf("generate error: %v\n src: %q", err, src)
					}
					text, merr := specGens(got)
					if merr != nil {
						t.Fatalf("serialise error: %v\n src: %q", merr, src)
					}
					if text != expect {
						t.Fatalf("gens mismatch\n src:  %q\n want: %s\n got:  %s", src, expect, text)
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

// specGens serialises a generated value the way the `gens` spec mode
// defines it: COMPACT JSON (no indentation, no spaces), keys in the
// order the engine generates them, compared byte for byte.
//
// Two deliberate choices make the Go and TypeScript runners agree on the
// same bytes:
//
//   - HTML escaping is OFF. Go's encoder rewrites <, > and & as their
//     \u00xx escapes by default; JavaScript's JSON.stringify — which the
//     TypeScript runner uses — leaves them as-is. Byte-exactness is the
//     whole point of this mode, so Go must not add escapes of its own.
//   - Key order needs no work here: MapVal.Gen already emits keys
//     alphabetically in BOTH ports (see the entries sort in TS
//     BagVal.gen), and Go's encoder sorts map keys, so the two agree.
//
// Number rendering also agrees: encoding/json switches to exponent form
// outside [1e-6, 1e21) and writes an unpadded, always-signed exponent
// ("1e+21", "1e-7"), which is exactly what JS Number.toString does — the
// same rule formatNumber implements for canon.
func specGens(v any) (string, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return "", err
	}
	// Encode always appends a newline; the compared text must not have one.
	return strings.TrimSuffix(buf.String(), "\n"), nil
}

// TestSpecGensMode proves the gens mode itself, ahead of the exact
// number leaves that will rely on it. Each row is run through exactly
// the code path TestSpec's "gens" case uses, and each expectation is the
// byte-for-byte output of JSON.stringify on the same document, so the
// two runners are pinned to the same text.
func TestSpecGensMode(t *testing.T) {
	rows := []struct{ name, src, expect string }{
		{"scalar-int", "a:1", `{"a":1}`},
		{"scalar-float", "a:1.5", `{"a":1.5}`},
		// The integral float generates as the number 1: gens sees the
		// JSON text, not the kind (canon is the kind-faithful surface).
		{"integral-float", "a:1.0", `{"a":1}`},
		{"no-indent", "a:1\nb:2", `{"a":1,"b":2}`},
		// Keys come out alphabetically in both ports, not in source order.
		{"key-order", "b:1\na:2", `{"a":2,"b":1}`},
		{"nested", "a:{b:{c:true}}", `{"a":{"b":{"c":true}}}`},
		{"list", "a:[1,2,3]", `{"a":[1,2,3]}`},
		{"string", `a:"x y"`, `{"a":"x y"}`},
		{"null", "a:null", `{"a":null}`},
		// JSON.stringify leaves <, > and & alone; so must Go.
		{"no-html-escape", `a:"<b>&</b>"`, `{"a":"<b>&</b>"}`},
		// JS-style exponent form at both ends of the fixed-notation window.
		{"big-exponent", "a:1e21", `{"a":1e+21}`},
		{"small-exponent", "a:1e-7", `{"a":1e-7}`},
		{"fixed-edge", "a:1e20", `{"a":100000000000000000000}`},
		// R2: negative zero never reaches output.
		{"neg-zero", "a:-0.0", `{"a":0}`},
		// gens distinguishes what gen cannot: these two documents decode
		// to the same float64, so `gen` would call them equal.
		{"exact-below-pow53", "a:9007199254740992", `{"a":9007199254740992}`},
		{"plus", "a:1+2", `{"a":3}`},
	}

	a := New()
	for _, r := range rows {
		t.Run(r.name, func(t *testing.T) {
			got, err := a.GenerateVars(r.src, specVars())
			if err != nil {
				t.Fatalf("generate error: %v\n src: %q", err, r.src)
			}
			text, merr := specGens(got)
			if merr != nil {
				t.Fatalf("serialise error: %v\n src: %q", merr, r.src)
			}
			if text != r.expect {
				t.Fatalf("gens mismatch\n src:  %q\n want: %s\n got:  %s", r.src, r.expect, text)
			}
		})
	}
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
