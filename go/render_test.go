package aontu

import (
	"os"
	"strings"
	"testing"
)

// The fold alone (docs/design/RENDER.0.md D9): the arms a spec row
// cannot reach, because Render hands the fold an instance the
// vocabulary has shaped -- every default filled, every unit a map. A
// caller of RenderValue may hand it less, and the fold answers for
// what it is given. Twin of ts/test/render.test.ts.
func TestRenderValueNothingToRender(t *testing.T) {
	for _, inst := range []any{map[string]any{}, nil} {
		report := RenderValue(inst, nil)
		if "ok" != report.Verdict || 0 != len(report.Units) || 0 != len(report.Lossy) {
			t.Fatalf("empty instance: %+v", report)
		}
	}
}

func TestRenderValueSparsePieces(t *testing.T) {
	report := RenderValue(map[string]any{
		"aontu": map[string]any{"Code": map[string]any{
			"units": []any{map[string]any{
				"path": "a.txt", "lang": "text",
				"decls": []any{map[string]any{
					"k": "frag", "of": []any{
						map[string]any{"k": "line", "of": []any{"x"}},
						map[string]any{"k": "blank"},
						map[string]any{"k": "raw", "text": "y\n"},
					},
				}},
			}},
		}},
	}, &RenderOptions{})
	if "lossy" != report.Verdict || "x\n\ny\n" != report.Units[0].Text {
		t.Fatalf("sparse pieces: %+v", report)
	}
}

// THE RENDERER NEVER WRITES (RENDER.0.md D8; docs/trust.md): the
// library answers bytes, and only the verb's --out places them. The os
// package in this file would be the first step of a regression, so the
// source is read for it. Twin of the scan in ts/test/render.test.ts.
func TestRenderSourceHasNoFilesystemAccess(t *testing.T) {
	src, err := os.ReadFile("render.go")
	if nil != err {
		t.Fatal(err)
	}
	for _, mark := range []string{`"os"`, `"io"`, "os.WriteFile", "os.MkdirAll", "os/exec"} {
		if strings.Contains(string(src), mark) {
			t.Fatalf("render.go reaches the filesystem: %s", mark)
		}
	}
}

func TestRenderProfile(t *testing.T) {
	profile, findings := New().RenderProfile(`aontu: render: Lang: lang: "text"`)
	if nil != findings {
		t.Fatalf("findings on a valid profile: %+v", findings)
	}
	if "text" != profile["lang"] {
		t.Fatalf("lang: %v", profile["lang"])
	}
	indent, _ := profile["indent"].(map[string]any)
	if " " != indent["unit"] || int64(2) != indent["width"] {
		t.Fatalf("defaults not filled: %v", profile["indent"])
	}
	if _, has := profile["lowering"]; has {
		t.Fatalf("an optional key with no default appeared: %v", profile)
	}

	for _, c := range []struct{ src, code, path string }{
		{"a: ]", "syntax", "$"},
		{"x: 1 & \"a\"", "scalar_kind", "$.x"},
		{"nil", "literal_nil", "$"},
		{"aontu: render: Lang: lang: 1", "constraint", "$.aontu.render.Lang.lang"},
		{"x: 1", "mapval_required", "$.aontu.render.Lang.lang"},
	} {
		profile, findings := New().RenderProfile(c.src)
		if nil != profile || 1 > len(findings) {
			t.Fatalf("%q: want a refusal, got %v %+v", c.src, profile, findings)
		}
		if c.code != findings[0].Code || c.path != findings[0].Path {
			t.Fatalf("%q: want %s at %s, got %s at %s", c.src, c.code, c.path,
				findings[0].Code, findings[0].Path)
		}
	}
}
