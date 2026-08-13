/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// PROPERTY-BASED DIFFERENTIAL TESTING OF THE CONSTRAINT ALGEBRA
// (docs/capability-review/g1-constraint-algebra.md, "Ongoing":
// property-based differential testing of the algebra laws --
// commutativity, idempotence, normalisation convergence -- across TS
// and Go, seeded from the atom vocabulary).
//
// The corpus is ENUMERATED, not random: the atom vocabulary is read
// from test/spec/files/constraint-atoms.txt, shared with
// ts/test/constraint-laws.test.ts, so both ports cross identical terms
// and the two lists cannot drift apart.
//
// These tests check each engine against ITSELF -- a law that breaks in
// one port breaks visibly in that port's suite. That is deliberately
// only half the guarantee: two ports could normalise the same meet
// differently and each still be internally lawful. The cross-port half
// is test/spec/constraint-product.tsv, which pins the observable for
// every cell of the same corpus and is run by both runners.
//
// The observable is canon, or the error CODE when the meet is empty --
// both order-independent, unlike error message text (whose primary site
// is deliberately later-in-source, so it is NOT expected to commute).

// lawAtoms is read from the SHARED vocabulary file so this list and the
// TypeScript twin's cannot drift apart, and so the probed cross-product
// in test/spec/constraint-product.tsv is over the same corpus.
var lawAtoms = loadLawAtoms()

func loadLawAtoms() []string {
	path := filepath.Join("..", "test", "spec", "files", "constraint-atoms.txt")
	data, err := os.ReadFile(path)
	if err != nil {
		panic("cannot read shared atom vocabulary " + path + ": " + err.Error())
	}
	var atoms []string
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(strings.TrimSuffix(line, "\r"))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		atoms = append(atoms, line)
	}
	return atoms
}

// Associativity is cubic, so it runs over a representative prefix --
// the same prefix length as the TypeScript twin.
var lawTripleAtoms = lawAtoms[:8]

// lawObs evaluates to an order-independent observable: the canonical
// form, or the error code when the meet is empty.
//
// The code comes from AontuError.Code, never from a pattern over the
// message: codes are not all `\w+` (`scalar-type` carries a hyphen), so
// matching the headline silently truncates them and would make two
// distinct codes compare equal. The TypeScript twin reads the collected
// error's `why` for the same reason.
func lawObs(src string) string {
	v, err := New().Unify(src)
	if err != nil {
		if ae, ok := err.(*AontuError); ok {
			return "ERR:" + ae.Code
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
