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
