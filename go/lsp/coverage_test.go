/* Copyright (c) 2025 Richard Rodger, MIT License */

// Coverage: guards and fallbacks the protocol-level tests do not reach
// (see docs/test-coverage.md).

package lsp

import (
	"fmt"
	"strings"
	"testing"
)

// Marshal-failure fallbacks in the response/notification builders.
func TestMarshalFallbacks(t *testing.T) {
	if out := newResponse(nil, func() {}); string(out.Result) != "null" {
		t.Fatalf("unmarshalable result must fall back to null: %s", out.Result)
	}
	if on := newNotification("m", func() {}); string(on.Params) != "null" {
		t.Fatalf("unmarshalable params must fall back to null: %s", on.Params)
	}
}

// Handler: the initialized notification and the malformed-parameter
// guards on every document method.
func TestHandlerParamGuards(t *testing.T) {
	h := NewHandler()
	if h.Handle(Message{Method: "initialized"}) != nil {
		t.Fatalf("initialized must be silent")
	}
	bad := []byte("{")
	if h.Handle(Message{Method: "textDocument/didOpen", Params: bad}) != nil {
		t.Fatalf("bad didOpen params must be ignored")
	}
	if h.Handle(Message{Method: "textDocument/didChange", Params: bad}) != nil {
		t.Fatalf("bad didChange params must be ignored")
	}
	if h.Handle(Message{Method: "textDocument/didClose", Params: bad}) != nil {
		t.Fatalf("bad didClose params must be ignored")
	}
	outs := h.Handle(Message{Method: "textDocument/hover", ID: []byte("1"), Params: bad})
	if len(outs) != 1 || string(outs[0].Result) != "null" {
		t.Fatalf("bad hover params must answer null")
	}
	good := []byte(`{"textDocument":{"uri":"u"},"position":{"line":0,"character":0}}`)
	outs = h.Handle(Message{Method: "textDocument/hover", ID: []byte("2"), Params: good})
	if len(outs) != 1 || string(outs[0].Result) != "null" {
		t.Fatalf("hover on an unopened document must answer null")
	}
}

// A positionless problem (budget exhaustion on a 10-link ref chain)
// flags the start of the document.
func TestDiagnosticsPositionless(t *testing.T) {
	var b strings.Builder
	for i := 0; i < 10; i++ {
		fmt.Fprintf(&b, "c%d:$.c%d ", i, i+1)
	}
	b.WriteString("c10:1")
	diags := Diagnostics(b.String())
	found := false
	for _, d := range diags {
		if d.Range.Start == (Position{0, 0}) && d.Range.End == (Position{0, 1}) {
			found = true
		}
	}
	if !found {
		t.Fatalf("positionless problem must flag the document start: %+v", diags)
	}
}

// Hover on an unparseable document is nil (Spans declines).
func TestHoverParseError(t *testing.T) {
	if Hover("a:number > 0", 0, 0, false) != nil {
		t.Fatalf("hover on an unparseable document must be nil")
	}
}

// lineIndex offset/position clamping at both ends.
func TestLineIndexClamps(t *testing.T) {
	li := newLineIndex("ab\ncd")
	if p := li.position(-5); p != (Position{0, 0}) {
		t.Fatalf("negative offset clamps to start: %+v", p)
	}
	if p := li.position(99); p != (Position{1, 2}) {
		t.Fatalf("overlong offset clamps to end: %+v", p)
	}
	if off := li.offsetAt(-1, 0); off != 0 {
		t.Fatalf("negative line clamps to 0, got %d", off)
	}
}
