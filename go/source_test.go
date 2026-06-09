/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"os"
	"path/filepath"
	"testing"
)

// TestRelativeSourceLoadWithBase checks that NewWithBase resolves a
// relative @"file" load against the given directory, regardless of the
// process working directory.
func TestRelativeSourceLoadWithBase(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(
		filepath.Join(dir, "child.aontu"), []byte("{ x: 2 }\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	out, err := NewWithBase(dir).Generate("parent: 1\nchild: @\"./child.aontu\"\n")
	if err != nil {
		t.Fatalf("generate with base: %v", err)
	}
	m, ok := out.(map[string]any)
	if !ok {
		t.Fatalf("want map, got %T", out)
	}
	child, ok := m["child"].(map[string]any)
	if !ok || child["x"] != int64(2) {
		t.Fatalf("relative load with base: want child {x:2}, got %v", m["child"])
	}
}

// TestAbsoluteSourceLoadIgnoresBase confirms an absolute @"file" load
// resolves regardless of (even a bogus) base.
func TestAbsoluteSourceLoadIgnoresBase(t *testing.T) {
	dir := t.TempDir()
	childAbs := filepath.Join(dir, "child.aontu")
	if err := os.WriteFile(childAbs, []byte("{ x: 7 }\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	out, err := NewWithBase("/nonexistent/base").Generate("v: @\"" + childAbs + "\"\n")
	if err != nil {
		t.Fatalf("generate absolute load: %v", err)
	}
	m := out.(map[string]any)
	v, ok := m["v"].(map[string]any)
	if !ok || v["x"] != int64(7) {
		t.Fatalf("absolute load: want {x:7}, got %v", m["v"])
	}
}
