/* Copyright (c) 2025 Richard Rodger, MIT License */

package main

// The Go twin of the cli-vet suite in ts/test/cli.test.ts: the same
// cases, asserting the same output. What the two ports must AGREE on
// (the report itself) is pinned by test/spec/vet.tsv; what each port
// owns (argument handling, exit codes, the text rendering) is here.

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

const vetSchemaSrc = "service: { name: string, port: integer }"

// vetFiles writes a schema and a data document to a fresh directory and
// returns their paths.
func vetFiles(t *testing.T, schema, data string) (string, string, string) {
	t.Helper()
	dir := t.TempDir()
	s := filepath.Join(dir, "schema.aon")
	d := filepath.Join(dir, "data.json")
	if err := os.WriteFile(s, []byte(schema), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(d, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	return dir, s, d
}

// vetRun drives the whole command, returning stdout, stderr and the
// exit code.
func vetRun(args ...string) (string, string, int) {
	var out, errw bytes.Buffer
	code := run(append([]string{"vet"}, args...), strings.NewReader(""), &out, &errw, false)
	return out.String(), errw.String(), code
}

func vetMatch(t *testing.T, text, pattern string) {
	t.Helper()
	if !regexp.MustCompile(pattern).MatchString(text) {
		t.Fatalf("want /%s/ in:\n%s", pattern, text)
	}
}

// The verb's whole reason for existing: an agent emits a document, the
// gate says what does not hold and WHERE, and the exit code says which
// kind of "no" it was.
func TestVetReportsConflictsWithBothSites(t *testing.T) {
	_, s, d := vetFiles(t, vetSchemaSrc, `service: { name: "auth", port: "8080" }`)
	out, _, code := vetRun(s, d)
	if 1 != code {
		t.Fatalf("code: %d", code)
	}
	vetMatch(t, out, `verdict: invalid`)
	vetMatch(t, out, `\$\.service\.port: no_scalar_unify \[conflict\]`)
	vetMatch(t, out, `data: .*data\.json:1:\d+ \("8080"\)`)
	vetMatch(t, out, `schema: .*schema\.aon:1:\d+ \(integer\)`)
}

// A parent that collapses to a nil takes its subtree with it, so the
// sibling conflict is reported on the CONTEXT rather than standing in
// the tree. Both belong in the report.
func TestVetReportsFindingsThatNeverReachedTheTree(t *testing.T) {
	_, s, d := vetFiles(t,
		"service: close({ name: string, port: integer, replicas: integer })",
		`service: { name: "auth", prot: 8080, replicas: "3" }`)
	out, _, _ := vetRun(s, d)
	vetMatch(t, out, `\$\.service\.prot: closed`)
	vetMatch(t, out, `\$\.service\.replicas: no_scalar_unify`)
}

func TestVetExitCodesAreVerdictClasses(t *testing.T) {
	_, valid, validData := vetFiles(t, vetSchemaSrc,
		`service: { name: "auth", port: 8080 }`)
	if out, _, code := vetRun(valid, validData); 0 != code ||
		"verdict: valid" != strings.TrimSpace(out) {
		t.Fatalf("valid: %d %q", code, out)
	}

	_, invalid, invalidData := vetFiles(t, vetSchemaSrc,
		`service: { name: 1, port: 8080 }`)
	if _, _, code := vetRun(invalid, invalidData); 1 != code {
		t.Fatalf("invalid: %d", code)
	}

	_, incomplete, incompleteData := vetFiles(t, vetSchemaSrc,
		`service: { name: "auth" }`)
	if _, _, code := vetRun(incomplete, incompleteData); 3 != code {
		t.Fatalf("incomplete: %d", code)
	}
	// --partial keeps reporting the residue but stops it failing.
	if _, _, code := vetRun("--partial", incomplete, incompleteData); 0 != code {
		t.Fatalf("partial: %d", code)
	}

	_, broken, brokenData := vetFiles(t, "a: 1\na: 2", "a: 1")
	if _, _, code := vetRun(broken, brokenData); 4 != code {
		t.Fatalf("broken schema: %d", code)
	}
}

func TestVetJSONFormatNamesItsProducer(t *testing.T) {
	_, s, d := vetFiles(t, vetSchemaSrc, `service: { name: "auth", port: "8080" }`)
	out, _, _ := vetRun("--format", "json", s, d)

	var report struct {
		Aontu struct {
			Verb    string `json:"verb"`
			Version string `json:"version"`
		} `json:"aontu"`
		Verdict   string `json:"verdict"`
		Truncated bool   `json:"truncated"`
		Findings  []struct {
			Code  string `json:"code"`
			Sites []struct {
				Role string `json:"role"`
			} `json:"sites"`
		} `json:"findings"`
	}
	if err := json.Unmarshal([]byte(out), &report); err != nil {
		t.Fatalf("%v: %s", err, out)
	}
	if "vet" != report.Aontu.Verb || "" == report.Aontu.Version {
		t.Fatalf("producer: %+v", report.Aontu)
	}
	if "invalid" != report.Verdict || report.Truncated {
		t.Fatalf("report: %+v", report)
	}
	if 1 != len(report.Findings) || "no_scalar_unify" != report.Findings[0].Code ||
		"data" != report.Findings[0].Sites[0].Role {
		t.Fatalf("findings: %+v", report.Findings)
	}
	// The keys are emitted in the order the canonical emitter sorts
	// them, so a consumer diffing the two ports' reports sees no noise.
	if !strings.Contains(out, "\"aontu\": {") ||
		strings.Index(out, "\"findings\"") < strings.Index(out, "\"aontu\"") ||
		strings.Index(out, "\"truncated\"") < strings.Index(out, "\"findings\"") ||
		strings.Index(out, "\"verdict\"") < strings.Index(out, "\"truncated\"") {
		t.Fatalf("keys are not in sorted order:\n%s", out)
	}
}

func TestVetAtAndClosedReachTheEngine(t *testing.T) {
	_, s, d := vetFiles(t, "services: { auth: { port: integer } }",
		"auth: { port: 8080 }")
	if _, _, code := vetRun("--at", "$.services", s, d); 0 != code {
		t.Fatalf("at: %d", code)
	}

	_, g, gd := vetFiles(t, "service: { name: string }",
		"service: { name: \"auth\" }\nextra: 1")
	if _, _, code := vetRun(g, gd); 0 != code {
		t.Fatalf("open: %d", code)
	}
	if _, _, code := vetRun("--closed", g, gd); 1 != code {
		t.Fatalf("closed: %d", code)
	}
}

func TestVetMaxErrorsTruncatesAndSaysSo(t *testing.T) {
	_, s, d := vetFiles(t, "a: integer\nb: integer\nc: integer",
		"a: \"x\"\nb: \"y\"\nc: \"z\"")
	out, _, code := vetRun("--max-errors", "2", s, d)
	if 1 != code {
		t.Fatalf("code: %d", code)
	}
	vetMatch(t, out, `findings truncated`)
}

// Several data files are several candidates for one truth, so each is
// vetted on its own and the worst verdict wins.
func TestVetTakesMoreThanOneDataFile(t *testing.T) {
	dir, s, d := vetFiles(t, vetSchemaSrc, `service: { name: "auth", port: 8080 }`)
	bad := filepath.Join(dir, "bad.json")
	if err := os.WriteFile(bad,
		[]byte(`service: { name: "auth", port: "nope" }`), 0o600); err != nil {
		t.Fatal(err)
	}
	out, _, code := vetRun(s, d, bad)
	if 1 != code {
		t.Fatalf("code: %d", code)
	}
	vetMatch(t, out, `verdict: invalid`)
	vetMatch(t, out, `bad\.json`)
}

func TestVetUsageErrorsExit2(t *testing.T) {
	_, s, d := vetFiles(t, vetSchemaSrc, `service: { name: "auth", port: 8080 }`)
	for _, args := range [][]string{
		{},
		{s},
		{"--at"},
		{"--format"},
		{"--format", "yaml", s, d},
		{"--max-errors"},
		{"--max-errors", "lots", s, d},
		{"--max-errors", "0", s, d},
		{"--nope", s, d},
	} {
		_, errText, code := vetRun(args...)
		if 2 != code {
			t.Fatalf("%v: code %d", args, code)
		}
		if !strings.HasPrefix(errText, "aontu: ") {
			t.Fatalf("%v: stderr %q", args, errText)
		}
	}
}

func TestVetUnreadableFileExits2AndNamesIt(t *testing.T) {
	dir, s, d := vetFiles(t, vetSchemaSrc, `service: { name: "auth", port: 8080 }`)
	missing := filepath.Join(dir, "no-such.json")

	_, errText, code := vetRun(s, missing)
	if 2 != code {
		t.Fatalf("data: code %d", code)
	}
	vetMatch(t, errText, `cannot read .*no-such\.json`)

	_, errText, code = vetRun(missing, d)
	if 2 != code {
		t.Fatalf("schema: code %d", code)
	}
	vetMatch(t, errText, `cannot read .*no-such\.json`)
}

func TestVetNoteAndAlternativesReachTheTextReport(t *testing.T) {
	_, s, d := vetFiles(t,
		`service: { tier: must("gold"|"silver","tier must be supported"),`+
			` port: integer & min(1024) }`,
		`service: { tier: "lead", port: 80 }`)
	out, _, _ := vetRun(s, d)
	vetMatch(t, out, `note: tier must be supported`)
	vetMatch(t, out, `expected: integer&min\(1024\)`)
	vetMatch(t, out, `actual: +80`)
}

// A value the walk never reaches has no file name to report — a
// preference's synthesised type yardstick is one — and the line renders
// with an empty file rather than a placeholder.
func TestVetSiteWithoutAFileRendersEmpty(t *testing.T) {
	_, s, d := vetFiles(t, "a: *1", "a: {}")
	out, _, _ := vetRun(s, d)
	vetMatch(t, out, `schema: :1:\d+ \(number\)`)
}

// The verb dispatches only as the FIRST argument, so a file argument is
// never shadowed by a verb name.
func TestVetDoesNotShadowAFileArgument(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "vet")
	if err := os.WriteFile(file, []byte("a: 1"), 0o600); err != nil {
		t.Fatal(err)
	}
	var out, errw bytes.Buffer
	if code := run([]string{file}, strings.NewReader(""), &out, &errw, false); 0 != code {
		t.Fatalf("code %d: %s", code, errw.String())
	}
	vetMatch(t, out.String(), `"a": 1`)
}

func TestVetVerbAppearsInHelp(t *testing.T) {
	var out, errw bytes.Buffer
	run([]string{"--help"}, strings.NewReader(""), &out, &errw, false)
	vetMatch(t, out.String(), `aontu vet \[options\]`)
	vetMatch(t, out.String(), `3  incomplete`)
}
