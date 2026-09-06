/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

// The Go twin of the cli-template cases in ts/test/cli.test.ts. The two
// TRANSFORMS are pinned by test/spec/template.tsv, which both runners
// execute; what each port owns -- argument handling, exit codes, which
// stream carries what, and the entry a render reads as a template -- is
// here.

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// A generator in the target's own syntax: two marked lines carrying
// aontu, and one line of output between them.
const templateGen = "//- of: [\nexport const N = 1\n//- ]\n"

const templateCanon = "of: [\n`export const N = 1`\n]\n"

func templateRun(args ...string) (string, string, int) {
	var out, errw bytes.Buffer
	code := run(append([]string{"template"}, args...),
		strings.NewReader(""), &out, &errw, false)
	return out.String(), errw.String(), code
}

func templateDir(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	for name, text := range files {
		if err := os.WriteFile(
			filepath.Join(dir, name), []byte(text), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func TestTemplatePrintsTheCanonicalFormAndResugarsIt(t *testing.T) {
	dir := templateDir(t, map[string]string{
		"gen.ts": templateGen, "canon.aon": templateCanon})

	// THE DEFAULT DIRECTION is desugar: the aontu the marked lines
	// mean, with every other line quoted as one string.
	out, errw, code := templateRun(filepath.Join(dir, "gen.ts"))
	if 0 != code || templateCanon != out || "" != errw {
		t.Fatalf("desugar: code %d out %q err %q", code, out, errw)
	}

	// --resugar is the other one, and the file it reads is aontu.
	out, _, code = templateRun("--resugar", filepath.Join(dir, "canon.aon"))
	if 0 != code || templateGen != out {
		t.Fatalf("resugar: code %d out %q", code, out)
	}

	// The marker comes from the extension, and --marker names one the
	// table does not know.
	hash := templateDir(t, map[string]string{
		"gen.rb": "#- of: [\nputs 1\n#- ]\n"})
	out, _, code = templateRun(filepath.Join(hash, "gen.rb"))
	if 0 != code || "of: [\n`puts 1`\n]\n" != out {
		t.Fatalf("hash marker: code %d out %q", code, out)
	}
	odd := templateDir(t, map[string]string{
		"gen.zz": ";;- of: [\nx\n;;- ]\n"})
	out, _, code = templateRun("--marker", ";;-", filepath.Join(odd, "gen.zz"))
	if 0 != code || "of: [\n`x`\n]\n" != out {
		t.Fatalf("--marker: code %d out %q", code, out)
	}

	// A FILE WITH NO EXTENSION takes the default marker rather than no
	// marker at all: a generator named `Makefile` or `Dockerfile` is an
	// ordinary case, and the table is a convenience over a default
	// rather than the thing that decides a file is a template.
	bare := templateDir(t, map[string]string{"gen": templateGen})
	out, _, code = templateRun(filepath.Join(bare, "gen"))
	if 0 != code || templateCanon != out {
		t.Fatalf("no extension: code %d out %q", code, out)
	}
}

func TestTemplateCheckIsTheRoundTrip(t *testing.T) {
	dir := templateDir(t, map[string]string{"gen.ts": templateGen})
	out, errw, code := templateRun("--check", filepath.Join(dir, "gen.ts"))
	if 0 != code || "" != out || "" != errw {
		t.Fatalf("clean: code %d out %q err %q", code, out, errw)
	}

	// A MARKER LINE THE TRANSFORM WOULD NOT HAVE WRITTEN is what this
	// catches: the marker keeps its OWN indentation, so aontu indented
	// after it is moved before it. The report names the first line that
	// differs rather than diffing the whole generator.
	bad := templateDir(t, map[string]string{
		"gen.ts": "//- of: [\n//-   {\n//- ]\n"})
	_, errw, code = templateRun("--check", filepath.Join(bad, "gen.ts"))
	if 1 != code ||
		!strings.Contains(errw, "gen.ts:2 is not what the round trip answers") ||
		!strings.Contains(errw, `have: "//-   {"`) ||
		!strings.Contains(errw, `want: "  //- {"`) {
		t.Fatalf("drift: code %d err %q", code, errw)
	}
}

func TestTemplateUsageErrorsExit2(t *testing.T) {
	dir := templateDir(t, map[string]string{"gen.ts": templateGen})
	file := filepath.Join(dir, "gen.ts")

	// The two directions are not modes that compose.
	for _, tc := range []struct {
		args []string
		want string
	}{
		{[]string{"--resugar", "--check", file}, "one of --resugar or --check"},
		{[]string{}, "template needs one file"},
		{[]string{file, file}, "template needs one file"},
		{[]string{"--marker"}, "--marker needs a token"},
		{[]string{"--bogus", file}, "unknown template option --bogus"},
		{[]string{filepath.Join(dir, "missing.ts")}, "cannot read"},
	} {
		out, errw, code := templateRun(tc.args...)
		if 2 != code || "" != out || !strings.Contains(errw, tc.want) {
			t.Fatalf("%v: code %d out %q err %q", tc.args, code, out, errw)
		}
	}

	out, _, code := templateRun("--help")
	if 0 != code || !strings.Contains(out, "aontu template") {
		t.Fatalf("--help: code %d out %q", code, out)
	}
}

func TestRenderReadsATemplateEntryByItsExtension(t *testing.T) {
	// The entry's extension decides, so a generator in the target's own
	// syntax is an entry rather than a preprocessing step.
	dir := templateDir(t, map[string]string{
		"gen.ts": "//- code: units: [{ path: \"a.txt\", lang: \"text\", decls: [{\n" +
			"//- k: \"frag\", of: [\n" +
			"hello\n" +
			"//- ]}] }]\n",
		"gen.zz": ";;- code: units: [{ path: \"a.txt\", lang: \"text\", decls: [{\n" +
			";;- k: \"frag\", of: [\n" +
			"hello\n" +
			";;- ]}] }]\n",
	})

	out, _, code := renderRun("--stdout", filepath.Join(dir, "gen.ts"))
	if 0 != code || "hello\n" != out {
		t.Fatalf("template entry: code %d out %q", code, out)
	}

	// --marker reaches render too, for a language the table has not met.
	out, _, code = renderRun(
		"--stdout", "--marker", ";;-", filepath.Join(dir, "gen.zz"))
	if 0 != code || "hello\n" != out {
		t.Fatalf("--marker entry: code %d out %q", code, out)
	}

	_, errw, code := renderRun("--marker")
	if 2 != code || !strings.Contains(errw, "--marker needs a token") {
		t.Fatalf("--marker alone: code %d err %q", code, errw)
	}
}

func TestFmtFormatsAontuSourceOnly(t *testing.T) {
	// A `#-` TEMPLATE PARSES AS AONTU, because `#` opens a comment -- so
	// `fmt` would read one, throw every output line away and rewrite the
	// file with exit 0. The rule is by name, not by what parses.
	dir := templateDir(t, map[string]string{
		"gen.rb": "#- of: [\nputs 1\n#- ]\n"})
	file := filepath.Join(dir, "gen.rb")
	out, errw, code := fmtRun("", file)
	if 2 != code || "" != out ||
		!strings.Contains(errw, "is not aontu source (.aon, .aontu)") ||
		!strings.Contains(errw, "aontu template") {
		t.Fatalf("refusal: code %d out %q err %q", code, out, errw)
	}
	// The file is untouched, which is the whole point.
	if raw, _ := os.ReadFile(file); "#- of: [\nputs 1\n#- ]\n" != string(raw) {
		t.Fatalf("the refusal wrote the file: %q", raw)
	}

	// `.aontu` is aontu source, and is formatted.
	ok := templateDir(t, map[string]string{"d.aontu": "a:{b:1}\n"})
	out, _, code = fmtRun("", filepath.Join(ok, "d.aontu"))
	if 0 != code || "a: b: 1\n" != out {
		t.Fatalf("aontu source: code %d out %q", code, out)
	}
}
