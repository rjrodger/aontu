/* Copyright (c) 2025 Richard Rodger, MIT License */

package main

// The Go twin of the explain cases in ts/test/helpdoc.test.ts (G11
// phase 3). The CONTRACT under test is that the verb projects the
// shared registry: every code test/spec/errcodes.tsv registers
// resolves, and nothing outside it does.

import (
	"bufio"
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func explainRun(args ...string) (string, string, int) {
	var out, errw bytes.Buffer
	code := run(append([]string{"explain"}, args...),
		strings.NewReader(""), &out, &errw, false)
	return out.String(), errw.String(), code
}

// registryCodes reads test/spec/errcodes.tsv -- the shared contract
// this verb projects -- rather than the engine table, so the test can
// fail when the two disagree instead of agreeing with itself.
func registryCodes(t *testing.T) []string {
	t.Helper()
	f, err := os.Open(filepath.Join(
		"..", "..", "..", "test", "spec", "errcodes.tsv"))
	if nil != err {
		t.Fatalf("cannot read the code registry: %v", err)
	}
	defer f.Close()
	var out []string
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := sc.Text()
		if "" == strings.TrimSpace(line) || strings.HasPrefix(line, "#") {
			continue
		}
		out = append(out, strings.Split(line, "\t")[0])
	}
	return out
}

// EVERY REGISTERED CODE RESOLVES. This is the property that makes the
// verb usable from a report: a caller reading `[aontu/x]` out of a
// finding can always ask what it means.
func TestExplainAnswersForEveryRegisteredCode(t *testing.T) {
	codes := registryCodes(t)
	if 100 > len(codes) {
		t.Fatalf("the registry looks unread: %d codes", len(codes))
	}
	for _, code := range codes {
		out, errw, exit := explainRun(code)
		if 0 != exit {
			t.Errorf("%s: want 0, got %d: %s", code, exit, errw)
			continue
		}
		if !strings.Contains(out, "code:  "+code) {
			t.Errorf("%s: the report does not name the code: %s", code, out)
		}
		if !strings.Contains(out, "class: ") {
			t.Errorf("%s: the report carries no class: %s", code, out)
		}
	}
}

// The list is the REGISTRY, not the hint table: the registry is in
// cross-port parity and the hint tables are not, so listing from the
// hint table would make the two ports differ over something that is
// not about what either can report.
func TestExplainListIsTheRegistry(t *testing.T) {
	out, _, code := explainRun("--list")
	if 0 != code {
		t.Fatalf("want 0, got %d", code)
	}
	listed := map[string]bool{}
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		listed[strings.Fields(line)[0]] = true
	}
	registered := registryCodes(t)
	for _, code := range registered {
		if !listed[code] {
			t.Errorf("--list omits the registered code %s", code)
		}
	}
	if len(registered) != len(listed) {
		t.Errorf("--list has %d codes, the registry %d",
			len(listed), len(registered))
	}
}

// A registered code carrying no explanation text in this port SAYS SO
// rather than printing an empty block. Before this verb the gap was
// invisible, because a hint is only ever met beside the error that
// raises it.
func TestExplainMarksTheCodesWithNoText(t *testing.T) {
	out, _, code := explainRun("--list")
	if 0 != code {
		t.Fatalf("want 0, got %d", code)
	}
	if !strings.Contains(out, "(no text)") {
		t.Error("no code is marked as carrying no text; has the table" +
			" become complete? then this test should assert that instead")
	}
	// And the single-code form matches the mark.
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if !strings.Contains(line, "(no text)") {
			continue
		}
		name := strings.Fields(line)[0]
		body, _, exit := explainRun(name)
		if 0 != exit ||
			!strings.Contains(body, "no explanation text is registered") {
			t.Errorf("%s is marked (no text) but explains as: %s", name, body)
		}
		break
	}
}

func TestExplainJSON(t *testing.T) {
	out, _, code := explainRun("--format", "json", "no_scalar_unify")
	if 0 != code {
		t.Fatalf("want 0, got %d", code)
	}
	var report struct {
		Class string `json:"class"`
		Code  string `json:"code"`
		Hint  string `json:"hint"`
	}
	if err := json.Unmarshal([]byte(out), &report); nil != err {
		t.Fatalf("not JSON: %v\n%s", err, out)
	}
	if "no_scalar_unify" != report.Code || "conflict" != report.Class ||
		"" == report.Hint {
		t.Errorf("bad report: %+v", report)
	}
}

func TestExplainListJSONFlagsWhatIsExplained(t *testing.T) {
	out, _, code := explainRun("--list", "--format", "json")
	if 0 != code {
		t.Fatalf("want 0, got %d", code)
	}
	var report struct {
		Codes []struct {
			Class     string `json:"class"`
			Code      string `json:"code"`
			Explained bool   `json:"explained"`
		} `json:"codes"`
	}
	if err := json.Unmarshal([]byte(out), &report); nil != err {
		t.Fatalf("not JSON: %v", err)
	}
	if len(registryCodes(t)) != len(report.Codes) {
		t.Errorf("want the registry, got %d rows", len(report.Codes))
	}
	explained, bare := 0, 0
	for _, row := range report.Codes {
		if row.Explained {
			explained++
		} else {
			bare++
		}
	}
	if 0 == explained || 0 == bare {
		t.Errorf("want both kinds, got %d explained and %d bare",
			explained, bare)
	}
}

// A DYNAMIC CODE IS REGISTERED THROUGH ITS PREFIX and carries the
// prefix's hint: the suffix names the operator, the explanation is
// the prefix's.
func TestExplainResolvesADynamicCode(t *testing.T) {
	for _, code := range []string{"func:upper", "op[+]", "var[x", "ref[y"} {
		out, errw, exit := explainRun(code)
		if 0 != exit {
			t.Errorf("%s: want 0, got %d: %s", code, exit, errw)
		}
		if !strings.Contains(out, "code:  "+code) {
			t.Errorf("%s: not named in the report", code)
		}
	}
}

func TestExplainUnknownCodeSuggestsANearMatch(t *testing.T) {
	out, errw, code := explainRun("no_scalar_unif")
	if 2 != code {
		t.Fatalf("want 2, got %d", code)
	}
	if "" != out {
		t.Errorf("a refusal wrote to stdout: %q", out)
	}
	for _, want := range []string{
		"no such error code", "did you mean `no_scalar_unify`", "--list",
	} {
		if !strings.Contains(errw, want) {
			t.Errorf("the refusal omits %q: %s", want, errw)
		}
	}
}

// The other arm of the suggestion: a code nothing is near gets the
// refusal with no "did you mean", because naming an unrelated code
// with confidence is worse than naming none.
func TestExplainUnknownCodeWithNoNearMatchSuggestsNothing(t *testing.T) {
	out, errw, code := explainRun("zzzzzzzzzzzzzzzzzzzz")
	if 2 != code {
		t.Fatalf("want 2, got %d", code)
	}
	if "" != out {
		t.Errorf("a refusal wrote to stdout: %q", out)
	}
	if !strings.Contains(errw, "no such error code") {
		t.Errorf("no refusal: %s", errw)
	}
	if strings.Contains(errw, "did you mean") {
		t.Errorf("suggested something unrelated: %s", errw)
	}
}

func TestExplainUsageRefusals(t *testing.T) {
	for _, tc := range []struct {
		name, want string
		args       []string
	}{
		{"no code", "needs one code", nil},
		{"two codes", "needs one code", []string{"a", "b"}},
		{"list with code", "takes no code", []string{"--list", "x"}},
		{"bad format", "text or json", []string{"--format", "xml"}},
		{"unknown option", "unknown explain option", []string{"--bogus"}},
	} {
		_, errw, code := explainRun(tc.args...)
		if 2 != code {
			t.Errorf("%s: want 2, got %d", tc.name, code)
		}
		if !strings.Contains(errw, tc.want) {
			t.Errorf("%s: want %q in %q", tc.name, tc.want, errw)
		}
	}
}

func TestExplainVerbTakesTheToolHelp(t *testing.T) {
	out, _, code := explainRun("--help")
	if 0 != code || !strings.Contains(out, "Usage: aontu") {
		t.Errorf("want the tool help, got %d", code)
	}
}
