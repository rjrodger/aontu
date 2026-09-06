/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

import (
	"reflect"
	"sort"
	"strings"
	"testing"
)

// THE REPORT KEY ORDER IS PART OF THE PARITY CONTRACT (ADR-001).
//
// TypeScript emits every report through one emitter, and that emitter
// SORTS: ts/src/exactjson.ts walks `Object.keys(v).sort(cmpCodePoint)`,
// so its bytes come out in lexicographic key order whatever order the
// report object was built in. Go's encoding/json sorts MAP keys but
// writes STRUCT fields in DECLARATION order -- so on this side the
// declaration IS the sort, and a field appended to the end of a struct
// silently makes `--format json` differ between the ports by key order
// alone.
//
// THE SHARED SPEC CANNOT SEE THIS. Both runners round-trip a report
// through a sorted form before comparing: ts/test/spec.test.ts compares
// exactJSON to exactJSON, and go/spec_test.go's specAsMap re-encodes
// through map[string]any, whose keys the encoder sorts. A row would
// pass with the fields in any order. This test is the missing pin, and
// it is static: no fixture, no golden, and it covers every future field
// as well as today's.
func TestReportJSONTagsAreLexicographic(t *testing.T) {
	// The RECORDS a report carries, which reach the CLI's bytes as
	// they are declared. The report ENVELOPES -- RenderReport,
	// ViewReport, ViewSetReport, ReachReport -- are deliberately absent
	// and are NOT sorted: every verb re-wraps its envelope in a sorted
	// object before printing (proved by diffing `--format json` between
	// the ports for render, view and reaches, which agree apart from
	// the version string), so their field order is invisible from the
	// command line. It is still visible to a Go LIBRARY caller, which
	// is a real if smaller surface; sorting them is a separate change
	// and needs its own reasoning.
	types := []any{
		RenderUnit{}, RenderLoss{}, RenderTrace{}, RenderHole{},
		RenderCoverage{},
		WhyConjunct{}, WhySite{},
		VetFinding{}, VetSite{}, ViewLoss{},
	}

	for _, v := range types {
		rt := reflect.TypeOf(v)
		var tags []string
		for i := 0; i < rt.NumField(); i++ {
			tag := rt.Field(i).Tag.Get("json")
			if "" == tag || "-" == tag {
				continue
			}
			tags = append(tags, strings.Split(tag, ",")[0])
		}
		want := append([]string(nil), tags...)
		sort.Strings(want)
		if !reflect.DeepEqual(tags, want) {
			t.Errorf("%s: json tags are not lexicographic\n got:  %v\n want: %v",
				rt.Name(), tags, want)
		}
	}
}
