/* Copyright (c) 2025 Richard Rodger, MIT License */

// Coverage round 5 (ADR-002): the last blocks in package aontu that no
// source input reaches but a test can. What remains after this file is
// marked `//coverage:ignore` in the source with its justification, and
// listed in docs/test-coverage.md.

package aontu

import (
	"strconv"
	"testing"
)

// stubVal is a Val the engine never builds: it refines forever without
// ever settling, and it is neither a map nor a list. Both properties
// are needed below — the first to spend the pass budget, the second so
// the residue walk has no path to name.
type stubVal struct {
	base
	n int
}

func (s *stubVal) Canon() string             { return "stub" + strconv.Itoa(s.n) }
func (s *stubVal) Gen(ctx *Ctx) (any, error) { return nil, nil }
func (s *stubVal) superior() Val             { return top() }
func (s *stubVal) Unify(peer Val, ctx *Ctx) Val {
	s.n++
	s.setDc(s.dc + 1)
	return s
}

// The budget error names `$` when the residue walk finds no paths:
// residuePaths only descends maps and lists, so a root that is neither
// yields an empty list.
func TestBudgetResidueUnnamedPaths(t *testing.T) {
	v := &stubVal{}
	ctx := &Ctx{root: v}
	unifyRoot(v, ctx)
	if len(ctx.err) != 1 || ctx.err[0].why != "budget_passes" {
		t.Fatalf("want one budget_passes error, got %v", ctx.err)
	}
	if got := ctx.err[0].details["paths"]; got != "$" {
		t.Fatalf("paths: want $, got %q", got)
	}
}

// clonePathRec returns anything it does not recognise unchanged. The
// type switch names every Val in the package, so only a Val declared
// outside it reaches the fallthrough.
func TestClonePathRecUnknown(t *testing.T) {
	v := &stubVal{n: 7}
	if got := clonePathRec(v, []string{"x"}); got != Val(v) {
		t.Fatalf("want the value back unchanged, got %v", got)
	}
	if got := clonePathRec(nil, []string{"x"}); got != nil {
		t.Fatalf("want nil back, got %v", got)
	}
}

// isLossyIntegerLiteral strips ONE leading sign before the based-literal
// test, so a doubly-signed spelling reaches SetString with a sign still
// in the digits and must be refused rather than accepted.
func TestLossyBasedLiteralDoubleSign(t *testing.T) {
	for _, s := range []string{"+-0x11", "-+0o17", "--0b101"} {
		if isLossyIntegerLiteral(s) {
			t.Fatalf("%s: want not lossy", s)
		}
	}
}
