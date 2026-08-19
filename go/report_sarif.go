/* Copyright (c) 2025 Richard Rodger, MIT License */

// SARIF rendering for a vet report (G2 phase 5): the Go twin of
// ts/src/report-sarif.ts.
//
// A MINIMAL SARIF 2.1.0 profile, and deliberately nothing more: one
// run, one `result` per finding, the finding's first site as the
// primary location, its remaining sites under `relatedLocations`, and
// the whole finding object embedded in `properties` so a SARIF consumer
// still holds the native contract. No fixes, no code flows, no
// baselines.
//
// The struct fields are declared in LEXICOGRAPHIC order because the
// canonical emitter sorts object keys (exactJSON) while Go's encoder
// writes declaration order — the same rule the JSON report renderer
// already follows (cmd/aontu/vet.go). The two ports are held to byte
// parity over the shared fixture pair in test/spec/files/vet-sarif/,
// with message text and producer version redacted, exactly as
// test/spec/vet.tsv carves the message out of its goldens.

package aontu

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
)

type sarifLog struct {
	Schema  string     `json:"$schema"`
	Runs    []sarifRun `json:"runs"`
	Version string     `json:"version"`
}

type sarifRun struct {
	Invocations []sarifInvocation `json:"invocations"`
	Results     []sarifResult     `json:"results"`
	Tool        sarifTool         `json:"tool"`
}

type sarifInvocation struct {
	ExecutionSuccessful bool `json:"executionSuccessful"`
}

type sarifTool struct {
	Driver sarifDriver `json:"driver"`
}

type sarifDriver struct {
	InformationURI string `json:"informationUri"`
	Name           string `json:"name"`
	Version        string `json:"version"`
}

type sarifResult struct {
	Level            string          `json:"level"`
	Locations        []sarifLocation `json:"locations"`
	Message          sarifMessage    `json:"message"`
	Properties       VetFinding      `json:"properties"`
	RelatedLocations []sarifLocation `json:"relatedLocations,omitempty"`
	RuleID           string          `json:"ruleId"`
}

type sarifMessage struct {
	Text string `json:"text"`
}

type sarifLocation struct {
	PhysicalLocation sarifPhysical `json:"physicalLocation"`
}

type sarifPhysical struct {
	ArtifactLocation sarifArtifact `json:"artifactLocation"`
	Region           *sarifRegion  `json:"region,omitempty"`
}

type sarifArtifact struct {
	URI string `json:"uri"`
}

type sarifRegion struct {
	StartColumn int `json:"startColumn"`
	StartLine   int `json:"startLine"`
}

// SARIF levels are error/warning/note; the report's severities are
// error/warning/info. Only `info` needs translating, but the map spells
// out all three so a new severity fails loudly here rather than
// silently emitting itself.
var sarifLevel = map[string]string{
	"error":   "error",
	"warning": "warning",
	"info":    "note",
}

// sarifURI percent-encodes a filesystem path as a SARIF URI reference:
// `#`, `%`, spaces and every other URI-significant byte would otherwise
// change the path's meaning to a consumer (text after `#` becomes a
// fragment). Encoded BY BYTE over UTF-8, with RFC 3986's unreserved and
// path characters kept literal — the identical loop to the canonical
// port's sarifUri (ts/src/report-sarif.ts), so the bytes agree.
func sarifURI(path string) string {
	var b strings.Builder
	for i := 0; i < len(path); i++ {
		c := path[i]
		if 'A' <= c && c <= 'Z' || 'a' <= c && c <= 'z' || '0' <= c && c <= '9' ||
			strings.IndexByte("-._~/!$&'()*+,;=:@", c) >= 0 {
			b.WriteByte(c)
		} else {
			b.WriteString(fmt.Sprintf("%%%02X", c))
		}
	}
	return b.String()
}

func sarifLocationOf(site VetSite) sarifLocation {
	physical := sarifPhysical{
		ArtifactLocation: sarifArtifact{URI: sarifURI(site.File)},
	}
	// SARIF regions are 1-based. A finding with no position — a parse
	// failure reports at -1:-1 — gets a location with no region rather
	// than an invented one.
	if 1 <= site.Row {
		physical.Region = &sarifRegion{StartColumn: site.Col, StartLine: site.Row}
	}
	return sarifLocation{PhysicalLocation: physical}
}

func sarifResultOf(finding VetFinding) sarifResult {
	// The engine orders sites data-first (the thing to fix), so the
	// first site is the primary location and the rest are related —
	// which for a two-site conflict puts the schema's declaration under
	// `relatedLocations`, exactly where a code-scanning UI shows "the
	// other side".
	result := sarifResult{
		Level:      sarifLevel[finding.Severity],
		Locations:  []sarifLocation{sarifLocationOf(finding.Sites[0])},
		Message:    sarifMessage{Text: finding.Message},
		Properties: finding,
		RuleID:     "aontu/" + finding.Code,
	}
	for _, site := range finding.Sites[1:] {
		result.RelatedLocations = append(result.RelatedLocations, sarifLocationOf(site))
	}
	return result
}

// SarifReport renders a vet report as SARIF 2.1.0 text (a minimal
// profile: one run, one result per finding, the finding embedded in
// `properties`). The version parameter fills `tool.driver.version` —
// the CLI passes VERSION; the two ports' version series are independent
// by design.
func SarifReport(report VetReport, version string) string {
	results := make([]sarifResult, 0, len(report.Findings))
	for _, finding := range report.Findings {
		results = append(results, sarifResultOf(finding))
	}

	log := sarifLog{
		Schema: "https://json.schemastore.org/sarif-2.1.0.json",
		Runs: []sarifRun{{
			// An `error` verdict means the run could not be set up (an
			// unusable schema): zero findings from a FAILED run must
			// not read like zero findings from a clean one, so the
			// failure is carried in SARIF's own invocation metadata.
			Invocations: []sarifInvocation{{
				ExecutionSuccessful: VetError != report.Verdict,
			}},
			Results: results,
			Tool: sarifTool{Driver: sarifDriver{
				InformationURI: "https://github.com/rjrodger/aontu",
				Name:           "aontu",
				Version:        version,
			}},
		}},
		Version: "2.1.0",
	}

	// HTML escaping OFF and two-space indent, the same settings every
	// other machine-readable emitter in this repository uses, so the
	// canonical port's exactJSON produces the same bytes.
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	// Encode cannot fail here: every field is a string, an int, a bool
	// or a slice/struct of the same.
	_ = enc.Encode(log)
	return strings.TrimSuffix(buf.String(), "\n")
}
