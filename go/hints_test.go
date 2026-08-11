/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
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

// The plain-ref cycle chase has NO hop cap: a cycle of any length is
// proven at the first repetition (the seen set grows every hop and the
// tree is finite). Regression for the removed 99-hop cutoff. The TS
// twin is long-ref-cycle-is-proven in ts/test/unify.test.ts.
func TestLongRefCycleIsProven(t *testing.T) {
	var keys []string
	for i := 0; i < 120; i++ {
		keys = append(keys, fmt.Sprintf("k%03d", i))
	}
	var parts []string
	for i, k := range keys {
		parts = append(parts, fmt.Sprintf("%s:$.%s", k, keys[(i+1)%len(keys)]))
	}
	_, err := New().Generate(strings.Join(parts, " "))
	if err == nil {
		t.Fatalf("expected path_cycle error, generate succeeded")
	}
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "path_cycle" {
		t.Fatalf("expected code path_cycle, got %T %v", err, err)
	}
}

// TestFullMessageTwin asserts the FULL thrown-message literal -- marker,
// headline, verbatim hint, and both ANSI-coloured source frames --
// byte-for-byte. The TS twin with the SAME literal is
// full-message-twin in ts/test/error.test.ts, so a change to either
// port's rendering fails that side loudly. This is the completion pin
// of issue #29: thrown error text is in cross-port parity. (Spec rows
// still assert only probed substrings -- the twins are the byte-level
// guard.)
func TestFullMessageTwin(t *testing.T) {
	_, err := New().Generate("a:1 a:2")
	if err == nil {
		t.Fatalf("expected error")
	}
	want := "[aontu/scalar_value]: Cannot unify values at path $.a\n\nLiteral scalar values of the same kind can only unify if they are\nexactly equal.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  a & a   -> a    # Does unify (equal Strings);\n  1 & 2   -> nil  # Does not unify (unequal Integers);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).\n\n Cannot unify value: 2 with value: 1\n  \u001b[34m--> <no-file>:1:7\n\u001b[34m  1 | \u001b[0ma:1 a:2\n            \u001b[34m^ value was: 2\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n\n Cannot unify value: 1 with value: 2\n  \u001b[34m--> <no-file>:1:3\n\u001b[34m  1 | \u001b[0ma:1 a:2\n        \u001b[34m^ value was: 1\u001b[0m\n\u001b[34m  2 | \u001b[0m\n\u001b[34m  3 | \u001b[0m\n"
	if got := err.Error(); got != want {
		t.Fatalf("full message mismatch\n want: %q\n got:  %q", want, got)
	}
}
