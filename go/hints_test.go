/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"strings"
	"testing"
)

// The budget_passes message substring and class, pinned per-port: no
// shared spec row can exist while the smallest reproducer (a 10-link
// ref chain) diverges between the engines (test/spec/divergent.tsv,
// issue #26) — Go resolves chains eagerly and cannot reach the code at
// that scale, so the Go pin is on the hint table itself. The
// ts/test/unify.test.ts twin pins the TS side end-to-end.
func TestBudgetPassesHint(t *testing.T) {
	hint, ok := hints["budget_passes"]
	if !ok {
		t.Fatalf("budget_passes has no hint")
	}
	if !strings.Contains(hint, "evaluation budget") {
		t.Fatalf("budget_passes hint must contain %q, got: %s", "evaluation budget", hint)
	}
	if cls := codeClass("budget_passes"); cls != "budget" {
		t.Fatalf("budget_passes class: want budget, got %s", cls)
	}
	if cls := codeClass("path_cycle"); cls != "reference" {
		t.Fatalf("path_cycle class: want reference, got %s", cls)
	}
	// The prefix families resolve through their registered prefix, and
	// an unregistered code is an engine defect, classified internal.
	if cls := codeClass("func:upper"); cls != "conflict" {
		t.Fatalf("func:upper class: want conflict, got %s", cls)
	}
	if cls := codeClass("no-such-code"); cls != "internal" {
		t.Fatalf("unregistered code class: want internal, got %s", cls)
	}
}

// Check surfaces context-recorded errors that never land in the tree
// (the ctx-err union in CheckVars) — proven here with a unify-time
// error that IS reachable in Go; the budget_passes case itself is
// TS-only until issue #26 is decided.
func TestCheckSurfacesCtxErrors(t *testing.T) {
	a := New()
	probs := a.Check("a:$.b b:$.a")
	if len(probs) == 0 {
		t.Fatalf("expected problems for mutual cycle")
	}
	found := false
	for _, p := range probs {
		if p.Why == "path_cycle" {
			found = true
			if p.Class != "reference" {
				t.Fatalf("path_cycle Problem.Class: want reference, got %s", p.Class)
			}
		}
	}
	if !found {
		t.Fatalf("expected a path_cycle problem, got: %+v", probs)
	}
}
