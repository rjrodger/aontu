/* Copyright (c) 2025 Richard Rodger, MIT License */

package lsp

import (
	"encoding/json"
	"strings"
	"testing"

	aontu "github.com/rjrodger/aontu/go"
)

func TestHoverScalar(t *testing.T) {
	h := Hover("port: 8080", 0, 7)
	if h == nil {
		t.Fatal("expected hover over 8080")
	}
	if !strings.Contains(h.Contents.Value, "8080") || !strings.Contains(h.Contents.Value, "integer") {
		t.Errorf("hover value = %q", h.Contents.Value)
	}
	if h.Range == nil || h.Range.Start.Character != 6 || h.Range.End.Character != 10 {
		t.Errorf("range = %+v, want start char 6 end 10", h.Range)
	}
}

func TestHoverType(t *testing.T) {
	h := Hover("a:{x:string}", 0, 5)
	if h == nil || !strings.Contains(h.Contents.Value, "string") || !strings.Contains(h.Contents.Value, "type") {
		t.Fatalf("expected type hover, got %+v", h)
	}
}

func TestHoverResolvedReference(t *testing.T) {
	// b resolves to 1; hovering the definition shows the resolved value.
	h := Hover("a:1\nb:$.a", 0, 2)
	if h == nil || !strings.Contains(h.Contents.Value, "1") {
		t.Fatalf("expected hover over resolved value, got %+v", h)
	}
}

func TestHoverMiss(t *testing.T) {
	if h := Hover("port: 8080", 5, 0); h != nil {
		t.Errorf("expected nil hover off-document, got %+v", h)
	}
}

func TestCompletionsList(t *testing.T) {
	c := Completions()
	// 22 functions + 7 kinds + 4 literals.
	if len(c) != 33 {
		t.Fatalf("expected 33 completions, got %d", len(c))
	}
	byLabel := map[string]CompletionItem{}
	for _, it := range c {
		byLabel[it.Label] = it
	}
	if byLabel["upper"].Kind != CompletionFunction {
		t.Errorf("upper kind = %d, want Function", byLabel["upper"].Kind)
	}
	if byLabel["string"].Kind != CompletionKeyword {
		t.Errorf("string kind = %d, want Keyword", byLabel["string"].Kind)
	}
	for _, want := range []string{"close", "upper", "path", "min", "max",
		"above", "below", "neq", "string", "number",
		"integer", "float", "biginteger", "bigdecimal", "true", "null", "top"} {
		if _, ok := byLabel[want]; !ok {
			t.Errorf("missing completion %q", want)
		}
	}
}

// TestHoverExactLeaves covers the tower's exact leaves on the tooling
// surface: a `0d` literal hovers as its own leaf (never as "number",
// which is the supertype), and its range covers the whole literal —
// including the fraction, which the dot token would otherwise split off.
func TestHoverExactLeaves(t *testing.T) {
	h := Hover("a:0d5", 0, 3)
	if h == nil || !strings.Contains(h.Contents.Value, "0d5") ||
		!strings.Contains(h.Contents.Value, "biginteger") {
		t.Fatalf("expected biginteger hover, got %+v", h)
	}
	h = Hover("a:0d1.5", 0, 3)
	if h == nil || !strings.Contains(h.Contents.Value, "0d1.5") ||
		!strings.Contains(h.Contents.Value, "bigdecimal") {
		t.Fatalf("expected bigdecimal hover, got %+v", h)
	}
	if h.Range == nil || h.Range.Start.Character != 2 || h.Range.End.Character != 7 {
		t.Errorf("range = %+v, want start char 2 end 7", h.Range)
	}
}

// TestHoverConstraint: a constraint residual hovers as its canon with
// the shared kind label "constraint" — never a bare "value" default
// (the TS twin is hover-constraint; identical hover-text contract).
func TestHoverConstraint(t *testing.T) {
	h := Hover("a:min(0)&max(10)", 0, 3)
	if h == nil || !strings.Contains(h.Contents.Value, "min(0)&max(10)") ||
		!strings.Contains(h.Contents.Value, "*constraint*") {
		t.Fatalf("expected constraint hover, got %+v", h)
	}
}

func TestBuiltinFuncNamesParity(t *testing.T) {
	// The completion function list must match the engine's recognised
	// functions exactly (guards against drift).
	got := aontu.BuiltinFuncNames()
	want := []string{"above", "below", "close", "copy", "deprecate", "hide", "key", "length", "lower", "max", "min", "move", "must", "neq", "open", "path", "pref", "re", "super", "type", "unique", "upper"}
	if len(got) != len(want) {
		t.Fatalf("BuiltinFuncNames = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("BuiltinFuncNames[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestHandlerHover(t *testing.T) {
	h := NewHandler()
	open, _ := json.Marshal(map[string]any{
		"textDocument": map[string]any{"uri": "file:///t.aontu", "text": "port: 8080"},
	})
	h.Handle(Message{Method: "textDocument/didOpen", Params: open})

	hov, _ := json.Marshal(map[string]any{
		"textDocument": map[string]any{"uri": "file:///t.aontu"},
		"position":     map[string]any{"line": 0, "character": 7},
	})
	outs := h.Handle(Message{ID: json.RawMessage("5"), Method: "textDocument/hover", Params: hov})
	if len(outs) != 1 {
		t.Fatalf("expected 1 response, got %d", len(outs))
	}
	var res HoverResult
	if err := json.Unmarshal(outs[0].Result, &res); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(res.Contents.Value, "8080") {
		t.Errorf("hover result = %q", res.Contents.Value)
	}
}

func TestHandlerCompletion(t *testing.T) {
	h := NewHandler()
	outs := h.Handle(Message{ID: json.RawMessage("6"), Method: "textDocument/completion"})
	if len(outs) != 1 {
		t.Fatalf("expected 1 response, got %d", len(outs))
	}
	var items []CompletionItem
	if err := json.Unmarshal(outs[0].Result, &items); err != nil {
		t.Fatal(err)
	}
	if len(items) != 33 {
		t.Errorf("expected 33 completion items, got %d", len(items))
	}
}

func TestInitializeAdvertisesHoverAndCompletion(t *testing.T) {
	h := NewHandler()
	outs := h.Handle(Message{ID: json.RawMessage("1"), Method: "initialize"})
	var res struct {
		Capabilities struct {
			HoverProvider      bool            `json:"hoverProvider"`
			CompletionProvider json.RawMessage `json:"completionProvider"`
		} `json:"capabilities"`
	}
	json.Unmarshal(outs[0].Result, &res)
	if !res.Capabilities.HoverProvider {
		t.Error("hoverProvider not advertised")
	}
	if len(res.Capabilities.CompletionProvider) == 0 {
		t.Error("completionProvider not advertised")
	}
}
