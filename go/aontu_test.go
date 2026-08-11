/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"regexp"
	"testing"
)

func TestBasicCanon(t *testing.T) {
	v, err := New().Unify("a:1")
	if err != nil {
		t.Fatal(err)
	}
	if got := v.Canon(); got != `{"a":1}` {
		t.Fatalf("canon = %s", got)
	}
}

func TestParseCanon(t *testing.T) {
	v, err := New().Parse("a:number")
	if err != nil {
		t.Fatal(err)
	}
	if got := v.Canon(); got != `{"a":number}` {
		t.Fatalf("canon = %s", got)
	}
}

func TestGenerate(t *testing.T) {
	out, err := New().Generate("a:2")
	if err != nil {
		t.Fatal(err)
	}
	m, ok := out.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %#v", out)
	}
	if m["a"].(int64) != 2 {
		t.Fatalf("a = %#v", m["a"])
	}
}

func TestConflictErrors(t *testing.T) {
	_, err := New().Generate("a:1 a:2")
	if err == nil {
		t.Fatal("expected conflict error")
	}
}

func TestEmpty(t *testing.T) {
	out, err := New().Generate("")
	if err != nil {
		t.Fatal(err)
	}
	m, ok := out.(map[string]any)
	if !ok || len(m) != 0 {
		t.Fatalf("expected empty map, got %#v", out)
	}
}

// A source key in the reserved sentinel namespace must be rejected with a
// clean error (not a crash, and not silent corruption of the map). The TS
// implementation stores this state under a Symbol and is immune, so this
// is a Go-only guard and lives here rather than in the shared spec.
func TestReservedKeyPrefixRejected(t *testing.T) {
	for _, src := range []string{
		"\x00aontu_order:1",
		"\x00aontu_spread:1",
		"\x00aontu_optional:1",
		"a:1 \x00aontu_order:2",
	} {
		if _, err := New().Generate(src); err == nil {
			t.Fatalf("expected error for reserved key in %q, got none", src)
		}
	}
	// A normal key is unaffected.
	if out, err := New().Generate("normal:1"); err != nil {
		t.Fatalf("normal key errored: %v (out=%v)", err, out)
	}
}

// TestVersionFormat guards the VERSION constant, which `make publish-go
// V=x.y.z` rewrites. That rewrite used a BSD-only in-place sed form that
// no-opped silently on GNU sed, so a malformed or stale constant could ship.
// Mirrors ts/test/version.test.ts.
func TestVersionFormat(t *testing.T) {
	if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(VERSION) {
		t.Fatalf("VERSION is not a plain semver triple: %q", VERSION)
	}
}

// TestParseCanonNestedJunctions pins PARSE-level canon of nested
// junctions: a junction child that is itself a junction with more than
// one term is parenthesised (the TS JunctionVal.canon rule), so the
// text reparses to the same structure — `(1|2)&3` must not print as
// the differently-parsing `1|2&3`. No spec mode observes parse-level
// canon (the shared suite is unify-level), so this table is pinned by
// per-port twins: the TS twin with the SAME rows is
// parse-canon-nested-junctions in ts/test/lang.test.ts. Closes the
// issue #30 divergence.
func TestParseCanonNestedJunctions(t *testing.T) {
	rows := []struct{ src, canon string }{
		{"a:(1|2)&3", `{"a":(1|2)&3}`},
		{"a:1|2&3", `{"a":1|(2&3)}`},
		{"a:1&2|3", `{"a":(1&2)|3}`},
		{"a:(1&2)|3", `{"a":(1&2)|3}`},
		{"a:1|2|3", `{"a":(1|2)|3}`},
		{"a:1&2&3", `{"a":(1&2)&3}`},
		{"a:(1|2)&(3|4)", `{"a":(1|2)&(3|4)}`},
		{"a:1&(2|3)&4", `{"a":(1&(2|3))&4}`},
	}
	for _, r := range rows {
		v, err := New().Parse(r.src)
		if err != nil {
			t.Fatalf("parse %q: %v", r.src, err)
		}
		if got := v.Canon(); got != r.canon {
			t.Fatalf("parse canon mismatch\n src:  %q\n want: %s\n got:  %s", r.src, r.canon, got)
		}
	}
}
