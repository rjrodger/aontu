/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"regexp"
	"testing"
)

// PROPERTY-BASED DIFFERENTIAL TESTING OF THE CONSTRAINT ALGEBRA
// (docs/capability-review/g1-constraint-algebra.md, "Ongoing":
// property-based differential testing of the algebra laws --
// commutativity, idempotence, normalisation convergence -- across TS
// and Go, seeded from the atom vocabulary).
//
// The corpus is ENUMERATED, not random: lawAtoms below is the same
// vocabulary, in the same order, as ATOMS in
// ts/test/constraint-laws.test.ts, so both ports check identical terms.
// Cross-port AGREEMENT on the results is the shared suite's job
// (test/spec/constraint-bound.tsv); these tests guard the laws
// themselves as the vocabulary grows.
//
// The observable is canon, or the error CODE when the meet is empty --
// both order-independent, unlike error message text (whose primary site
// is deliberately later-in-source, so it is NOT expected to commute).

var lawAtoms = []string{
	"min(0)", "min(5)", `min("a")`,
	"max(3)", "max(10)", `max("z")`,
	"above(1)", "below(2)",
	"neq(1)", "neq(1,2)", `neq("a")`,
	"integer", "number", "string",
	"5", `"m"`,
}

// Associativity is cubic, so it runs over a representative prefix --
// the same prefix length as the TypeScript twin.
var lawTripleAtoms = lawAtoms[:8]

var lawCodeRe = regexp.MustCompile(`aontu/(\w+)`)

// lawObs evaluates to an order-independent observable: the canonical
// form, or the error code when the meet is empty.
func lawObs(src string) string {
	v, err := New().Unify(src)
	if err != nil {
		if ae, ok := err.(*AontuError); ok {
			return "ERR:" + ae.Code
		}
		if m := lawCodeRe.FindStringSubmatch(err.Error()); m != nil {
			return "ERR:" + m[1]
		}
		return "ERR:unknown"
	}
	return v.Canon()
}

// TestConstraintLawCommutativity: a & b == b & a.
func TestConstraintLawCommutativity(t *testing.T) {
	for _, a := range lawAtoms {
		for _, b := range lawAtoms {
			ab := lawObs(fmt.Sprintf("x: %s & %s", a, b))
			ba := lawObs(fmt.Sprintf("x: %s & %s", b, a))
			if ab != ba {
				t.Errorf("commutativity: %s & %s\n  ab: %s\n  ba: %s", a, b, ab, ba)
			}
		}
	}
}

// TestConstraintLawIdempotence: a & a == a.
func TestConstraintLawIdempotence(t *testing.T) {
	for _, a := range lawAtoms {
		aa := lawObs(fmt.Sprintf("x: %s & %s", a, a))
		one := lawObs(fmt.Sprintf("x: %s", a))
		if aa != one {
			t.Errorf("idempotence: %s\n  a&a: %s\n  a:   %s", a, aa, one)
		}
	}
}

// TestConstraintLawAssociativity: (a & b) & c == a & (b & c).
func TestConstraintLawAssociativity(t *testing.T) {
	for _, a := range lawTripleAtoms {
		for _, b := range lawTripleAtoms {
			for _, c := range lawTripleAtoms {
				l := lawObs(fmt.Sprintf("x: (%s & %s) & %s", a, b, c))
				r := lawObs(fmt.Sprintf("x: %s & (%s & %s)", a, b, c))
				if l != r {
					t.Errorf("associativity: %s & %s & %s\n  (ab)c: %s\n  a(bc): %s", a, b, c, l, r)
				}
			}
		}
	}
}

// TestConstraintLawConvergence: re-canonning a residual is a fixpoint,
// so a constraint's canonical text is stable under round-trip -- the
// property the spec runners assert for every canon row.
func TestConstraintLawConvergence(t *testing.T) {
	for _, a := range lawAtoms {
		for _, b := range lawAtoms {
			c1 := lawObs(fmt.Sprintf("x: %s & %s", a, b))
			if len(c1) > 4 && c1[:4] == "ERR:" {
				continue
			}
			if c2 := lawObs(c1); c2 != c1 {
				t.Errorf("convergence: %s & %s\n  c1: %s\n  c2: %s", a, b, c1, c2)
			}
		}
	}
}
