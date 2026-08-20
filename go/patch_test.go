/* Copyright (c) 2025 Richard Rodger, MIT License */

// The patch API around the shared rows (G7 phase 5). The report itself
// is pinned by test/spec/patch.tsv; what is left here is the options,
// which cross-package CLI runs do not count toward this package's
// coverage.

package aontu

import (
	"strings"
	"testing"
)

// With EntryPath and OverlayPath given, a finding names those files
// rather than Vet's generic schema/data labels: with two documents
// that both belong to the caller, "which file" is the whole question.
func TestPatchLabelsFindingsWithTheirFiles(t *testing.T) {
	r := Patch("port: 3", "", []string{"$.port=5"}, &PatchOptions{
		EntryPath:   "sys.aon",
		OverlayPath: "ov.aon",
	})
	if VetInvalid != r.Verdict || 0 == len(r.Findings) {
		t.Fatalf("want invalid with findings: %+v", r)
	}
	files := []string{}
	for _, s := range r.Findings[0].Sites {
		files = append(files, s.File)
	}
	joined := strings.Join(files, ",")
	if !strings.Contains(joined, "sys.aon") || !strings.Contains(joined, "ov.aon") {
		t.Fatalf("finding does not name its files: %s", joined)
	}
}
