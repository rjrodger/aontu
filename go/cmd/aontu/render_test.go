/* Copyright (c) 2025 Richard Rodger, MIT License */

package main

// The Go twin of the cli-render cases in ts/test/cli.test.ts. What the
// two ports must AGREE on -- the bytes, the loss report, the refusals
// -- is pinned by test/spec/render.tsv; what each port owns (argument
// handling, exit codes, which stream each half goes to, the write
// confinement) is here.

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const renderTwoUnits = `code: units: [
  { path: "a.txt", lang: "text", decls: [{ k: "frag", of: ["x", { k: "line", at: 1, of: ["y"] }] }] }
  { path: "sub/b.txt", lang: "text", decls: [{ k: "frag", of: ["z"] }] }
]
`

func renderRun(args ...string) (string, string, int) {
	var out, errw bytes.Buffer
	code := run(append([]string{"render"}, args...),
		strings.NewReader(""), &out, &errw, false)
	return out.String(), errw.String(), code
}

// renderDir writes the named files below a fresh directory and answers
// it; a name may carry a slash.
func renderDir(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	for name, text := range files {
		full := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(text), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func renderCode(t *testing.T, want int, args ...string) (string, string) {
	t.Helper()
	out, errw, code := renderRun(args...)
	if want != code {
		t.Fatalf("%s: want %d, got %d\nstdout: %s\nstderr: %s",
			strings.Join(args, " "), want, code, out, errw)
	}
	return out, errw
}

func TestRenderSummary(t *testing.T) {
	// THE SUMMARY: one line per unit -- path, language, size -- since
	// several units have no one text to print; the loss report on the
	// other stream, one line per entry.
	dir := renderDir(t, map[string]string{"doc.aon": renderTwoUnits})
	out, errw := renderCode(t, 0, filepath.Join(dir, "doc.aon"))
	if "a.txt\ttext\t6 bytes\nsub/b.txt\ttext\t2 bytes\n" != out {
		t.Fatalf("summary: %q", out)
	}
	vetMatch(t, errw, `^lossy: a\.txt \$\.code\.units\.0\.decls\.0 tier 2 frag: a fragment says nothing about text syntax\n`)
	vetMatch(t, errw, `lossy: sub/b\.txt \$\.code\.units\.1\.decls\.0 tier 2 frag: `)

	// The verb's own trust flags reach it, and `none` governs the
	// document alone: the renderer's own vocabulary is not an include
	// the document wrote.
	renderCode(t, 0, "--trust", "none", filepath.Join(dir, "doc.aon"))
}

func TestRenderStdout(t *testing.T) {
	dir := renderDir(t, map[string]string{"doc.aon": renderTwoUnits})
	file := filepath.Join(dir, "doc.aon")
	// Two units have no one text to print: --unit names it.
	out, errw := renderCode(t, 2, "--stdout", file)
	vetMatch(t, errw, `--stdout needs exactly one unit, and the instance has 2`)
	if "" != out {
		t.Fatalf("stdout: %q", out)
	}
	out, _ = renderCode(t, 0, "--stdout", "--unit", "a.txt", file)
	if "x\n  y\n" != out {
		t.Fatalf("one unit: %q", out)
	}
	// A unit filter that names nothing is the document's error.
	_, errw = renderCode(t, 4, "--stdout", "--unit", "nope", file)
	vetMatch(t, errw, `render_unit`)
}

func TestRenderAt(t *testing.T) {
	dir := renderDir(t, map[string]string{
		"doc.aon": "gen: { " + renderTwoUnits + " }\nother: 1\n",
	})
	file := filepath.Join(dir, "doc.aon")
	out, _ := renderCode(t, 0, "--at", "$.gen", "--stdout", "--unit", "a.txt", file)
	if "x\n  y\n" != out {
		t.Fatalf("at: %q", out)
	}
	// The anchor names nothing: 4.
	_, errw := renderCode(t, 4, "--at", "$.nope", file)
	vetMatch(t, errw, `no_path`)
}

func TestRenderOutAndCheck(t *testing.T) {
	dir := renderDir(t, map[string]string{"doc.aon": renderTwoUnits})
	file := filepath.Join(dir, "doc.aon")
	out := filepath.Join(dir, "out")

	// --out writes every unit below the directory, creating what the
	// paths need, and says so on stderr.
	so, errw := renderCode(t, 0, "--out", out, file)
	if "" != so {
		t.Fatalf("stdout: %q", so)
	}
	vetMatch(t, errw, `^wrote a\.txt\nwrote sub/b\.txt\n`)
	if a, _ := os.ReadFile(filepath.Join(out, "a.txt")); "x\n  y\n" != string(a) {
		t.Fatalf("a.txt: %q", a)
	}
	if b, _ := os.ReadFile(filepath.Join(out, "sub", "b.txt")); "z\n" != string(b) {
		t.Fatalf("sub/b.txt: %q", b)
	}

	// --check agrees with what --out wrote, and lists drift by path.
	renderCode(t, 0, "--check", out, file)
	if err := os.WriteFile(filepath.Join(out, "a.txt"), []byte("changed\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(filepath.Join(out, "sub", "b.txt")); err != nil {
		t.Fatal(err)
	}
	_, errw = renderCode(t, 1, "--check", out, file)
	vetMatch(t, errw, `a\.txt differs from the rendered unit`)
	vetMatch(t, errw, `sub/b\.txt is missing from `)

	// A unit that cannot be written is I/O: here its path is a
	// directory.
	if err := os.Remove(filepath.Join(out, "a.txt")); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(out, "a.txt"), 0o755); err != nil {
		t.Fatal(err)
	}
	_, errw = renderCode(t, 2, "--out", out, file)
	vetMatch(t, errw, `cannot write a\.txt`)

	// ... and so is a directory that cannot be made: `sub` is a file.
	if err := os.RemoveAll(filepath.Join(out, "sub")); err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(filepath.Join(out, "a.txt")); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(out, "sub"), []byte("x"), 0o600); err != nil {
		t.Fatal(err)
	}
	_, errw = renderCode(t, 2, "--out", out, file)
	vetMatch(t, errw, `cannot write sub/b\.txt`)
}

func TestRenderOutIsConfined(t *testing.T) {
	// A symlink inside the output directory that points outside it is
	// an escape: the include resolver's own rule, applied to writes.
	dir := renderDir(t, map[string]string{
		"doc.aon": `code: units: [{ path: "link/x.txt", lang: "text", decls: [] }]` + "\n",
	})
	out := filepath.Join(dir, "out")
	elsewhere := filepath.Join(dir, "elsewhere")
	for _, d := range []string{out, elsewhere} {
		if err := os.Mkdir(d, 0o755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Symlink(elsewhere, filepath.Join(out, "link")); err != nil {
		t.Skipf("symlink unavailable on this platform: %v", err)
	}
	_, errw := renderCode(t, 2, "--out", out, filepath.Join(dir, "doc.aon"))
	vetMatch(t, errw, `link/x\.txt escapes `)
	if _, err := os.Stat(filepath.Join(elsewhere, "x.txt")); nil == err {
		t.Fatal("the unit was written through the symlink")
	}
}

func TestRenderFormatJSON(t *testing.T) {
	dir := renderDir(t, map[string]string{
		"doc.aon": renderTwoUnits,
		"bad.aon": "x: 1 & \"a\"\n",
	})
	out, errw := renderCode(t, 0, "--format", "json", filepath.Join(dir, "doc.aon"))
	if "" != errw {
		t.Fatalf("stderr: %q", errw)
	}
	var report map[string]any
	if err := json.Unmarshal([]byte(out), &report); err != nil {
		t.Fatalf("stdout is not JSON: %v\n%s", err, out)
	}
	producer, _ := report["aontu"].(map[string]any)
	if "render" != producer["verb"] {
		t.Fatalf("verb: %v", producer)
	}
	if "lossy" != report["verdict"] {
		t.Fatalf("verdict: %v", report["verdict"])
	}
	units, _ := report["units"].([]any)
	if 2 != len(units) {
		t.Fatalf("units: %v", units)
	}
	first, _ := units[0].(map[string]any)
	if "x\n  y\n" != first["text"] {
		t.Fatalf("text: %q", first["text"])
	}
	if _, has := report["errors"]; has {
		t.Fatalf("errors on a lossy report: %v", report["errors"])
	}
	// An error report carries its findings, and exits as the text form
	// does.
	out, _ = renderCode(t, 4, "--format", "json", filepath.Join(dir, "bad.aon"))
	if err := json.Unmarshal([]byte(out), &report); err != nil {
		t.Fatalf("stdout is not JSON: %v\n%s", err, out)
	}
	errors, _ := report["errors"].([]any)
	finding, _ := errors[0].(map[string]any)
	if "scalar_kind" != finding["code"] {
		t.Fatalf("errors: %v", report["errors"])
	}
}

func TestRenderExitCodesFollowTheReport(t *testing.T) {
	dir := renderDir(t, map[string]string{
		"bad.aon":   "x: 1 & \"a\"\n",
		"abs.aon":   `code: units: [{ path: "/etc/x", lang: "text", decls: [] }]` + "\n",
		"text.aon":  `code: units: [{ path: "a.txt", lang: "text", decls: [{ k: "text", lang: "text", text: "v\n" }] }]` + "\n",
		"shape.aon": "code: units: 1\n",
	})
	// The document does not stand up: 4, findings on stderr.
	out, errw := renderCode(t, 4, filepath.Join(dir, "bad.aon"))
	vetMatch(t, errw, `scalar_kind`)
	if "" != out {
		t.Fatalf("stdout: %q", out)
	}
	// A refused unit path is usage: 2.
	_, errw = renderCode(t, 2, filepath.Join(dir, "abs.aon"))
	vetMatch(t, errw, `render_path`)
	// An opaque escape renders, lossy, and is listed; --strict refuses
	// it: 1.
	_, errw = renderCode(t, 0, filepath.Join(dir, "text.aon"))
	vetMatch(t, errw, `^lossy: a\.txt \$\.code\.units\.0\.decls\.0 tier 3 text: `)
	_, errw = renderCode(t, 1, "--strict", filepath.Join(dir, "text.aon"))
	vetMatch(t, errw, `render_strict`)
	// An instance the vocabulary refuses is the document's: 4.
	_, errw = renderCode(t, 4, filepath.Join(dir, "shape.aon"))
	vetMatch(t, errw, `\$\.code\.units: list`)
}

func TestRenderProfiles(t *testing.T) {
	dir := renderDir(t, map[string]string{
		"doc.aon":    renderTwoUnits,
		"four.aon":   `profile: { lang: "text", indent: { unit: " ", width: 4 } }` + "\n",
		"two.aon":    `profile: { lang: "text", indent: { unit: " ", width: 2 } }` + "\n",
		"bad.aon":    "profile: { lang: 1 }\n",
		"broken.aon": "x: 1 & \"a\"\n",
		"nil.aon":    "nil\n",
	})
	file := filepath.Join(dir, "doc.aon")
	// A supplied profile of the unit's language is the one the fold
	// uses, its defaults filled by the vocabulary.
	out, _ := renderCode(t, 0, "--profile", filepath.Join(dir, "four.aon"),
		"--stdout", "--unit", "a.txt", file)
	if "x\n    y\n" != out {
		t.Fatalf("four: %q", out)
	}
	// A profile the vocabulary refuses is reported as the document it
	// is: 4, with the finding addressed by path.
	_, errw := renderCode(t, 4, "--profile", filepath.Join(dir, "bad.aon"), file)
	vetMatch(t, errw, `\$\.profile\.lang`)
	// ... and so is one that does not stand up, or is nil outright.
	_, errw = renderCode(t, 4, "--profile", filepath.Join(dir, "broken.aon"), file)
	vetMatch(t, errw, `scalar_kind`)
	_, errw = renderCode(t, 4, "--profile", filepath.Join(dir, "nil.aon"), file)
	vetMatch(t, errw, `literal_nil`)
	// Two profiles claiming one language: the fold could not choose.
	_, errw = renderCode(t, 2, "--profile", filepath.Join(dir, "four.aon"),
		"--profile", filepath.Join(dir, "two.aon"), file)
	vetMatch(t, errw, `two profiles claim text`)
	// An unreadable profile file is I/O.
	_, errw = renderCode(t, 2, "--profile", filepath.Join(dir, "missing.aon"), file)
	vetMatch(t, errw, `cannot read`)
}

func TestRenderUsageErrorsExit2(t *testing.T) {
	dir := renderDir(t, map[string]string{"doc.aon": renderTwoUnits})
	file := filepath.Join(dir, "doc.aon")
	for _, args := range [][]string{
		{}, {file, file}, {"--bogus", file}, {"--format", "yaml", file},
		{"--format"}, {"--at"}, {"--unit"}, {"--profile"}, {"--out"}, {"--check"},
		{"--stdout", "--out", filepath.Join(dir, "o"), file},
		{filepath.Join(dir, "missing.aon")},
		{"--trust", "nonsense", file},
		// P7: --coverage-at needs a path, --coverage is a mode of its
		// own, and a narrower measure needs something to narrow.
		{"--coverage-at"},
		{"--coverage", "--stdout", file},
		{"--coverage-at", "$.a", file},
	} {
		renderCode(t, 2, args...)
	}
	out, _ := renderCode(t, 0, "--help")
	if !strings.Contains(out, "aontu render") {
		t.Fatalf("help: %q", out)
	}
}

// P7: THE COVERAGE REPORT is its own output mode. It writes no files,
// names the model paths no output consumed and the declarations no
// rule produced, and counts both at the end. --coverage-at measures a
// narrower model, and one that names nothing is the document's own
// no_path refusal (exit 4), as --at already is. The shared rows pin the
// report itself (test/spec/render.tsv); the lines and the flags are
// this port's.
func TestRenderCoverage(t *testing.T) {
	const doc = `services: { a: { pin: "p1" } }
spare: { x: 1 }
code: units: [
  { path: "a.txt", lang: "text", decls: [{ k: "frag", of:
    emit($.services, { match: { pin: string }, body: [.pin] }) }] }
  { path: "b.txt", lang: "text", decls: [{ k: "frag", of: ["b"] }] }
]
`
	dir := renderDir(t, map[string]string{"doc.aon": doc})
	file := filepath.Join(dir, "doc.aon")

	out, _ := renderCode(t, 0, "--coverage", file)
	for _, want := range []string{
		"dead: $.spare\n",
		"unruled: b.txt $.code.units.1.decls.0\n",
		"coverage: 1 path(s) read, 1 no output consumed, " +
			"1 declaration(s) no rule produced\n",
	} {
		if !strings.Contains(out, want) {
			t.Fatalf("coverage report: %q lacks %q", out, want)
		}
	}
	// The unit the rule set wrote is not a hole, and the render's own
	// output is not model.
	for _, unwanted := range []string{"unruled: a.txt", "dead: $.code"} {
		if strings.Contains(out, unwanted) {
			t.Fatalf("coverage report: %q holds %q", out, unwanted)
		}
	}
	// Nothing is written under this mode.
	if _, err := os.Stat(filepath.Join(dir, "a.txt")); nil == err {
		t.Fatal("--coverage wrote a unit")
	}

	// A narrower measure: $.spare is outside it, so nothing is dead.
	out, _ = renderCode(t, 0, "--coverage", "--coverage-at", "$.services", file)
	if strings.Contains(out, "dead:") {
		t.Fatalf("--coverage-at $.services: %q", out)
	}

	// An anchor that names nothing is the document's own refusal.
	renderCode(t, 4, "--coverage", "--coverage-at", "$.nope", file)

	// The JSON report carries the trace and the coverage object.
	out, _ = renderCode(t, 0, "--coverage", "--format", "json", file)
	var report struct {
		Trace []struct {
			Unit, Piece, Node, Rule string
		} `json:"trace"`
		Coverage struct {
			Read, Dead []string
			Unruled    []struct{ Unit, Path string }
		} `json:"coverage"`
	}
	if err := json.Unmarshal([]byte(out), &report); nil != err {
		t.Fatalf("json: %v\n%s", err, out)
	}
	if 1 != len(report.Trace) {
		t.Fatalf("trace: %+v", report.Trace)
	}
	if "a.txt" != report.Trace[0].Unit ||
		"$.services.a" != report.Trace[0].Node ||
		"#0" != report.Trace[0].Rule {
		t.Fatalf("trace entry: %+v", report.Trace[0])
	}
	if 1 != len(report.Coverage.Dead) || "$.spare" != report.Coverage.Dead[0] {
		t.Fatalf("coverage: %+v", report.Coverage)
	}
}
