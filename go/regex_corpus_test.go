/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// The differential regex corpus (ADR-003) — the Go twin of
// ts/test/regex-corpus.test.ts. Read that file for the rationale; in
// brief, `re()` enforces its subset by NORMALISATION, that only works if
// the two ports rewrite identically, and this asserts it against a
// committed corpus rather than against a claim in a comment.

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

const regexCorpusPath = "../test/spec/files/regex-corpus.tsv"

type regexCorpusRow struct {
	pattern string
	verdict string
	line    int
}

func loadRegexCorpus(t *testing.T) []regexCorpusRow {
	t.Helper()
	f, err := os.Open(filepath.FromSlash(regexCorpusPath))
	if nil != err {
		t.Fatalf("cannot open %s: %v", regexCorpusPath, err)
	}
	defer f.Close()

	rows := []regexCorpusRow{}
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 1024*1024), 1024*1024)
	line := 0
	for sc.Scan() {
		line++
		raw := sc.Text()
		if "" == raw || strings.HasPrefix(raw, "#") {
			continue
		}
		// The FIRST tab separates pattern from verdict. No unescaping --
		// unlike the spec runner, this file is read verbatim, because the
		// subject under test is backslash handling.
		tab := strings.Index(raw, "\t")
		rows = append(rows, regexCorpusRow{
			pattern: raw[:tab], verdict: raw[tab+1:], line: line})
	}
	return rows
}

// TestRegexCorpusLoaded is a guard on the guard: an empty or truncated
// corpus would make every assertion below vacuous while reporting green.
func TestRegexCorpusLoaded(t *testing.T) {
	rows := loadRegexCorpus(t)
	if 300 >= len(rows) {
		t.Fatalf("corpus too small: %d", len(rows))
	}
	refused, accepted := false, false
	for _, r := range rows {
		if strings.HasPrefix(r.verdict, "!") {
			refused = true
		} else {
			accepted = true
		}
	}
	if !refused {
		t.Fatal("corpus has no refusals -- it would not exercise the subset bounds")
	}
	if !accepted {
		t.Fatal("corpus has no acceptances")
	}
}

// TestRegexCorpusVerdictParity is the cross-port check: the corpus is
// the pinned output of BOTH normalisers, so a drift in either fails on
// the exact line.
func TestRegexCorpusVerdictParity(t *testing.T) {
	for _, r := range loadRegexCorpus(t) {
		norm, why := normaliseRe(r.pattern)
		got := norm
		if "" != why {
			got = "!" + why
		}
		if got != r.verdict {
			t.Errorf("regex-corpus.tsv line %d: %q\n  got:  %q\n  want: %q",
				r.line, r.pattern, got, r.verdict)
		}
	}
}

// TestRegexCorpusAcceptedCompile checks that a normalisation never emits
// something this host refuses -- which would otherwise surface only as a
// runtime error much later.
func TestRegexCorpusAcceptedCompile(t *testing.T) {
	for _, r := range loadRegexCorpus(t) {
		if strings.HasPrefix(r.verdict, "!") {
			continue
		}
		if _, err := regexp.Compile(r.verdict); nil != err {
			t.Errorf("normalised form does not compile, line %d: %q: %v",
				r.line, r.verdict, err)
		}
	}
}

// TestRegexCorpusIdempotent catches an expansion that re-expands its own
// output, or that emits a construct the normaliser would itself refuse.
func TestRegexCorpusIdempotent(t *testing.T) {
	for _, r := range loadRegexCorpus(t) {
		if strings.HasPrefix(r.verdict, "!") {
			continue
		}
		again, why := normaliseRe(r.verdict)
		if "" != why {
			t.Errorf("normalised form refused on re-normalisation, line %d: %q -> %s",
				r.line, r.verdict, why)
			continue
		}
		if again != r.verdict {
			t.Errorf("normalisation is not idempotent, line %d: %q -> %q",
				r.line, r.verdict, again)
		}
	}
}
