/* Copyright (c) 2025 Richard Rodger, MIT License */

package lsp

import (
	"encoding/json"
	"testing"
)

func TestDiagnosticsValidIsEmpty(t *testing.T) {
	for _, src := range []string{
		"a:1 b:2",
		"a:string",          // non-concrete schema is valid
		"a:{b:string, c:1}", // nested schema
		"a:1\nb:$.a",        // resolving reference
		"x:{a:1} & {b:2}",   // map merge
	} {
		if d := Diagnostics(src); len(d) != 0 {
			t.Errorf("expected no diagnostics for %q, got %d: %+v", src, len(d), d)
		}
	}
}

func TestDiagnosticsConflictPosition(t *testing.T) {
	// "a:1\na:2": the conflicting "2" is on line 1 (0-based), char 2.
	d := Diagnostics("a:1\na:2")
	if len(d) != 1 {
		t.Fatalf("expected 1 diagnostic, got %d: %+v", len(d), d)
	}
	if d[0].Severity != SeverityError {
		t.Errorf("severity = %d, want %d", d[0].Severity, SeverityError)
	}
	if d[0].Code != "scalar_value" {
		t.Errorf("code = %q, want scalar_value", d[0].Code)
	}
	if d[0].Source != "aontu" {
		t.Errorf("source = %q, want aontu", d[0].Source)
	}
	if got := d[0].Range.Start; got.Line != 1 || got.Character != 2 {
		t.Errorf("start = %+v, want {1 2}", got)
	}
}

func TestDiagnosticsUnknownFunctionPosition(t *testing.T) {
	d := Diagnostics("x:foo(1)")
	if len(d) != 1 || d[0].Code != "unknown_function" {
		t.Fatalf("expected unknown_function, got %+v", d)
	}
	if got := d[0].Range.Start; got.Line != 0 || got.Character != 2 {
		t.Errorf("start = %+v, want {0 2}", got)
	}
}

func TestDiagnosticsMultiByteColumn(t *testing.T) {
	// A multi-byte rune before the error must not shift the column off:
	// LSP characters are UTF-16 units, so "é" counts as 1.
	d := Diagnostics("a:\"é\"\nb:1 b:2")
	if len(d) != 1 {
		t.Fatalf("expected 1 diagnostic, got %d: %+v", len(d), d)
	}
	// "b:1 b:2" second "2" is at char 6 on line 1.
	if got := d[0].Range.Start; got.Line != 1 || got.Character != 6 {
		t.Errorf("start = %+v, want {1 6}", got)
	}
}

func mustRaw(t *testing.T, v any) json.RawMessage {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestHandlerInitialize(t *testing.T) {
	h := NewHandler()
	outs := h.Handle(Message{JSONRPC: "2.0", ID: json.RawMessage("1"), Method: "initialize"})
	if len(outs) != 1 {
		t.Fatalf("expected 1 response, got %d", len(outs))
	}
	if string(outs[0].ID) != "1" {
		t.Errorf("response id = %s, want 1", outs[0].ID)
	}
	var res struct {
		Capabilities struct {
			TextDocumentSync int `json:"textDocumentSync"`
		} `json:"capabilities"`
		ServerInfo struct {
			Name string `json:"name"`
		} `json:"serverInfo"`
	}
	if err := json.Unmarshal(outs[0].Result, &res); err != nil {
		t.Fatal(err)
	}
	if res.Capabilities.TextDocumentSync != 1 {
		t.Errorf("textDocumentSync = %d, want 1", res.Capabilities.TextDocumentSync)
	}
	if res.ServerInfo.Name != "aontu-lsp" {
		t.Errorf("serverInfo.name = %q", res.ServerInfo.Name)
	}
}

func TestHandlerDidOpenPublishesDiagnostics(t *testing.T) {
	h := NewHandler()
	params := mustRaw(t, map[string]any{
		"textDocument": map[string]any{
			"uri":  "file:///t.aontu",
			"text": "a:1 a:2",
		},
	})
	outs := h.Handle(Message{JSONRPC: "2.0", Method: "textDocument/didOpen", Params: params})
	if len(outs) != 1 || outs[0].Method != "textDocument/publishDiagnostics" {
		t.Fatalf("expected publishDiagnostics, got %+v", outs)
	}
	var pp struct {
		URI         string       `json:"uri"`
		Diagnostics []Diagnostic `json:"diagnostics"`
	}
	if err := json.Unmarshal(outs[0].Params, &pp); err != nil {
		t.Fatal(err)
	}
	if pp.URI != "file:///t.aontu" {
		t.Errorf("uri = %q", pp.URI)
	}
	if len(pp.Diagnostics) != 1 {
		t.Errorf("expected 1 diagnostic, got %d", len(pp.Diagnostics))
	}
	if _, ok := h.Doc("file:///t.aontu"); !ok {
		t.Error("document not tracked after didOpen")
	}
}

func TestHandlerDidChangeAndClose(t *testing.T) {
	h := NewHandler()
	open := mustRaw(t, map[string]any{
		"textDocument": map[string]any{"uri": "file:///t.aontu", "text": "a:1 a:2"},
	})
	h.Handle(Message{Method: "textDocument/didOpen", Params: open})

	// Fix the conflict via didChange -> diagnostics should clear.
	change := mustRaw(t, map[string]any{
		"textDocument":   map[string]any{"uri": "file:///t.aontu"},
		"contentChanges": []map[string]any{{"text": "a:1 b:2"}},
	})
	outs := h.Handle(Message{Method: "textDocument/didChange", Params: change})
	var pp struct {
		Diagnostics []Diagnostic `json:"diagnostics"`
	}
	json.Unmarshal(outs[0].Params, &pp)
	if len(pp.Diagnostics) != 0 {
		t.Errorf("expected cleared diagnostics after fix, got %d", len(pp.Diagnostics))
	}

	// Close -> empty diagnostics and untracked.
	closeP := mustRaw(t, map[string]any{
		"textDocument": map[string]any{"uri": "file:///t.aontu"},
	})
	outs = h.Handle(Message{Method: "textDocument/didClose", Params: closeP})
	if len(outs) != 1 || outs[0].Method != "textDocument/publishDiagnostics" {
		t.Fatalf("expected publishDiagnostics on close, got %+v", outs)
	}
	if _, ok := h.Doc("file:///t.aontu"); ok {
		t.Error("document still tracked after didClose")
	}
}

func TestHandlerShutdownExit(t *testing.T) {
	h := NewHandler()
	if h.ShouldExit() {
		t.Fatal("should not exit initially")
	}
	h.Handle(Message{ID: json.RawMessage("9"), Method: "shutdown"})
	outs := h.Handle(Message{Method: "exit"})
	if len(outs) != 0 {
		t.Errorf("exit should produce no messages, got %d", len(outs))
	}
	if !h.ShouldExit() {
		t.Error("should exit after exit notification")
	}
	if h.ExitCode() != 0 {
		t.Errorf("exit code = %d, want 0 (shutdown before exit)", h.ExitCode())
	}
}

func TestHandlerExitWithoutShutdown(t *testing.T) {
	h := NewHandler()
	h.Handle(Message{Method: "exit"})
	if h.ExitCode() != 1 {
		t.Errorf("exit code = %d, want 1 (no prior shutdown)", h.ExitCode())
	}
}

func TestHandlerUnknownRequest(t *testing.T) {
	h := NewHandler()
	outs := h.Handle(Message{ID: json.RawMessage("3"), Method: "textDocument/definition"})
	if len(outs) != 1 || outs[0].Error == nil || outs[0].Error.Code != -32601 {
		t.Fatalf("expected method-not-found error, got %+v", outs)
	}
	// Unknown notification (no id) is silently ignored.
	if outs := h.Handle(Message{Method: "$/setTrace"}); len(outs) != 0 {
		t.Errorf("unknown notification should be ignored, got %+v", outs)
	}
}
