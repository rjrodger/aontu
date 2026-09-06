package aontu

import "testing"

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
		"code": map[string]any{
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
		},
	}, &RenderOptions{})
	if "lossy" != report.Verdict || "x\n\ny\n" != report.Units[0].Text {
		t.Fatalf("sparse pieces: %+v", report)
	}
}
