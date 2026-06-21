/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "testing"

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
