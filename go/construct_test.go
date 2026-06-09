/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "testing"

// TestPublicConstructors exercises the exported value constructors the
// way an external caller would: building a vars map for GenerateVars.
func TestPublicConstructors(t *testing.T) {
	vars := map[string]Val{
		"foo":  NewInteger(11),
		"bar":  NewString("hello"),
		"flag": NewBoolean(true),
		"obj":  NewMap(map[string]Val{"x": NewInteger(1)}),
		"list": NewList([]Val{NewInteger(1), NewString("a")}),
		"pi":   NewNumber(3.5),
	}

	out, err := New().GenerateVars(
		"a:$foo b:$bar c:$flag d:$obj e:$list f:$pi", vars)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	m, ok := out.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", out)
	}
	if m["a"] != int64(11) {
		t.Errorf("a: want 11, got %v", m["a"])
	}
	if m["b"] != "hello" {
		t.Errorf("b: want hello, got %v", m["b"])
	}
	if m["c"] != true {
		t.Errorf("c: want true, got %v", m["c"])
	}
	if m["f"] != 3.5 {
		t.Errorf("f: want 3.5, got %v", m["f"])
	}

	obj, ok := m["d"].(map[string]any)
	if !ok || obj["x"] != int64(1) {
		t.Errorf("d: want {x:1}, got %v", m["d"])
	}

	list, ok := m["e"].([]any)
	if !ok || len(list) != 2 || list[0] != int64(1) || list[1] != "a" {
		t.Errorf("e: want [1,a], got %v", m["e"])
	}
}

// TestPublicConstructorsUnify checks a constructed variable unifies with
// a constraint and that NewScalarKind / NewNull work.
func TestPublicConstructorsUnify(t *testing.T) {
	vars := map[string]Val{
		"foo": NewInteger(11),
		"n":   NewNull(),
		"k":   NewScalarKind(KindInteger),
	}

	// $foo & number resolves to 11.
	v, err := New().UnifyVars("a:$foo & number", vars)
	if err != nil {
		t.Fatalf("unify: %v", err)
	}
	if got := v.Canon(); got != `{"a":11}` {
		t.Fatalf("canon: %s", got)
	}

	// $k (integer kind) & $foo resolves to 11.
	out, err := New().GenerateVars("a:$k & $foo n:$n", vars)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	m := out.(map[string]any)
	if m["a"] != int64(11) {
		t.Errorf("a: want 11, got %v", m["a"])
	}
	if v, ok := m["n"]; !ok || v != nil {
		t.Errorf("n: want null present, got %v (ok=%v)", v, ok)
	}
}
