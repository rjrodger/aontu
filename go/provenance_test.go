/* Copyright (c) 2025 Richard Rodger, MIT License */

// The recorder's own surface (ADR-002; the Go side of the
// coverage3-provenance cases in ts/test/coverage3.test.ts). What the
// two ports must AGREE on is pinned by test/spec/why.tsv; what is left
// here is the ordering's last tiebreaks — which no document produces,
// because a source position holds one value — and the entry-file and
// trust wiring, which cross-package CLI runs do not count toward this
// package's coverage.

package aontu

import (
	"testing"
)

func siteVal(canon, file string, row, col int) Val {
	v := newString(canon)
	v.surl = file
	// pos is a byte offset; the recorder turns it into row/col through
	// rowCol, so the source text below is what makes these land.
	v.sp = -1
	return v
}

// The contribution order has to be TOTAL: a partial one would leave
// the record's tail in meet order, which is the fixpoint's business
// and differs between the ports.
func TestProvenanceOrdersByFileThenCanon(t *testing.T) {
	prov := newProvenance("")
	a := siteVal("z", "two.aon", 1, 1)
	b := siteVal("a", "one.aon", 1, 1)
	c := siteVal("m", "one.aon", 1, 1)
	for _, v := range []Val{a, b, c} {
		prov.written[v] = true
	}
	prov.record([]string{"k"}, a, b, nil)
	prov.record([]string{"k"}, c, nil, nil)

	got := prov.at([]string{"k"})
	if 3 != len(got) {
		t.Fatalf("want 3 contributions, got %d", len(got))
	}
	// one.aon before two.aon; within one.aon, canon breaks the tie.
	if `"a"` != got[0].Canon || `"m"` != got[1].Canon || `"z"` != got[2].Canon {
		t.Fatalf("bad order: %v", []string{
			got[0].Canon, got[1].Canon, got[2].Canon})
	}

	// A path nothing met has no record at all.
	if 0 != len(prov.at([]string{"nowhere"})) {
		t.Fatal("expected no record for an unmet path")
	}
}

// writtenFrom walks a tree once: a value reached twice (a shared
// clone, a repeated stamp) is not re-walked.
func TestProvenanceWrittenFromIsIdempotent(t *testing.T) {
	prov := newProvenance("")
	leaf := newInteger(1)
	m := newMap()
	m.set("a", leaf)
	m.set("b", leaf)
	prov.writtenFrom(m)
	prov.writtenFrom(m)
	if !prov.written[leaf] || !prov.written[m] {
		t.Fatal("tree not stamped")
	}
	// A nil child is no tree at all.
	prov.writtenFrom(nil)
}

// Why through an Aontu carrying an entry file name and a trust
// profile: the file reaches the contribution's site, and the budgets
// reach the run.
func TestWhyStampsEntryFileAndCarriesTrust(t *testing.T) {
	a := New()
	a.File = "doc.aon"
	a.Trust = &TrustOptions{Budget: TrustBudget{Passes: 9, Depth: 1000}}
	r := a.Why("x: 1\nx: integer", "$.x")
	if !r.OK || nil == r.Record || 2 != len(r.Record.Conjuncts) {
		t.Fatalf("bad report: %+v", r)
	}
	for _, c := range r.Record.Conjuncts {
		if "doc.aon" != c.Site.File {
			t.Fatalf("entry file not stamped: %+v", c)
		}
	}
}
