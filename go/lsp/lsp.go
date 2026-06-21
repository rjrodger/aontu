/* Copyright (c) 2025 Richard Rodger, MIT License */

// Package lsp is the Aontu Language Server library. It is deliberately
// split into two layers:
//
//   - the analysis library (this file): Diagnostics turns Aontu source
//     text into LSP diagnostics, and Handler implements the
//     transport-agnostic LSP message dispatch (document sync ->
//     publishDiagnostics). Neither touches stdin/stdout, so both are
//     unit-testable and embeddable in any host.
//   - the server (../cmd/aontu-lsp): a thin stdio JSON-RPC loop that
//     frames bytes and feeds decoded messages to a Handler.
//
// The TypeScript port mirrors this split in ts/src/lsp.ts (library) and
// ts/src/lsp-server.ts (server).
package lsp

import (
	"unicode/utf16"
	"unicode/utf8"

	aontu "github.com/rjrodger/aontu/go"
)

// Severity values (a subset of the LSP DiagnosticSeverity enum).
const (
	SeverityError       = 1
	SeverityWarning     = 2
	SeverityInformation = 3
	SeverityHint        = 4
)

// Position is a zero-based line / UTF-16 character offset, as defined by
// the LSP specification.
type Position struct {
	Line      int `json:"line"`
	Character int `json:"character"`
}

// Range is an inclusive-start, exclusive-end span of source text.
type Range struct {
	Start Position `json:"start"`
	End   Position `json:"end"`
}

// Diagnostic is a single LSP diagnostic.
type Diagnostic struct {
	Range    Range  `json:"range"`
	Severity int    `json:"severity"`
	Code     string `json:"code,omitempty"`
	Source   string `json:"source"`
	Message  string `json:"message"`
}

// Diagnostics analyses Aontu source and returns LSP diagnostics for every
// problem found. A valid document — including a non-concrete schema such
// as `a:string` — yields an empty (non-nil) slice. Variables, if any, are
// resolved from vars (may be nil).
func Diagnostics(src string) []Diagnostic {
	return DiagnosticsVars(src, nil)
}

// DiagnosticsVars is Diagnostics with $name variables resolved from vars.
func DiagnosticsVars(src string, vars map[string]aontu.Val) []Diagnostic {
	probs := aontu.New().CheckVars(src, vars)
	idx := newLineIndex(src)

	out := make([]Diagnostic, 0, len(probs))
	for _, p := range probs {
		var rng Range
		if p.Pos < 0 {
			// No known position: flag the start of the document.
			rng = Range{Position{0, 0}, Position{0, 1}}
		} else {
			start := idx.position(p.Pos)
			end := idx.position(p.Pos + p.Len)
			rng = Range{start, end}
		}
		out = append(out, Diagnostic{
			Range:    rng,
			Severity: SeverityError,
			Code:     p.Why,
			Source:   "aontu",
			Message:  p.Message,
		})
	}
	return out
}

// --- Hover ------------------------------------------------------------

// MarkupContent is LSP markdown/plaintext content.
type MarkupContent struct {
	Kind  string `json:"kind"` // "markdown" | "plaintext"
	Value string `json:"value"`
}

// HoverResult is the LSP hover response.
type HoverResult struct {
	Contents MarkupContent `json:"contents"`
	Range    *Range        `json:"range,omitempty"`
}

// Hover resolves the value at a cursor position and describes it, or
// returns nil when the position is not over a concrete value. Because it
// reads the *unified* tree, a value shows its resolved canon and kind.
func Hover(src string, line, character int) *HoverResult {
	spans := aontu.New().Spans(src)
	if spans == nil {
		return nil
	}
	idx := newLineIndex(src)
	cur := idx.offsetAt(line, character)

	best := -1
	for i, s := range spans {
		if s.Pos <= cur && cur < s.Pos+s.Len {
			// Most specific (smallest) span wins.
			if best < 0 || s.Len < spans[best].Len {
				best = i
			}
		}
	}
	if best < 0 {
		return nil
	}
	s := spans[best]
	return &HoverResult{
		Contents: MarkupContent{Kind: "markdown", Value: hoverMarkdown(s)},
		Range:    &Range{Start: idx.position(s.Pos), End: idx.position(s.Pos + s.Len)},
	}
}

func hoverMarkdown(s aontu.ValueSpan) string {
	return "```aontu\n" + s.Canon + "\n```\n\n*" + s.Kind + "*"
}

// --- Completion -------------------------------------------------------

// LSP CompletionItemKind subset.
const (
	CompletionFunction = 3
	CompletionKeyword  = 14
)

// CompletionItem is a single LSP completion suggestion.
type CompletionItem struct {
	Label  string `json:"label"`
	Kind   int    `json:"kind,omitempty"`
	Detail string `json:"detail,omitempty"`
}

// Completions returns context-free suggestions: the built-in functions,
// scalar-kind keywords and literals. Clients filter by the typed prefix.
func Completions() []CompletionItem {
	out := []CompletionItem{}
	for _, f := range aontu.BuiltinFuncNames() {
		out = append(out, CompletionItem{Label: f, Kind: CompletionFunction, Detail: "Aontu built-in function"})
	}
	for _, k := range []string{"string", "number", "integer", "boolean"} {
		out = append(out, CompletionItem{Label: k, Kind: CompletionKeyword, Detail: "scalar kind"})
	}
	for _, k := range []string{"true", "false", "null", "top"} {
		out = append(out, CompletionItem{Label: k, Kind: CompletionKeyword, Detail: "keyword"})
	}
	return out
}

// lineIndex maps a byte offset to an LSP Position. Line starts are
// precomputed so each lookup is O(log lines); the character column is the
// number of UTF-16 code units from the line start, per the LSP default
// position encoding.
type lineIndex struct {
	src        string
	lineStarts []int // byte offset of the start of each line
}

func newLineIndex(src string) *lineIndex {
	starts := []int{0}
	for i := 0; i < len(src); i++ {
		if src[i] == '\n' {
			starts = append(starts, i+1)
		}
	}
	return &lineIndex{src: src, lineStarts: starts}
}

func (li *lineIndex) position(off int) Position {
	if off < 0 {
		off = 0
	}
	if off > len(li.src) {
		off = len(li.src)
	}
	// Largest line start <= off (linear-from-end is fine; sources are
	// small and offsets are typically near the start of their line).
	line := 0
	for i := len(li.lineStarts) - 1; i >= 0; i-- {
		if li.lineStarts[i] <= off {
			line = i
			break
		}
	}
	col := utf16Len(li.src[li.lineStarts[line]:off])
	return Position{Line: line, Character: col}
}

// offsetAt converts an LSP Position (line, UTF-16 character) to a byte
// offset into the source — the inverse of position.
func (li *lineIndex) offsetAt(line, character int) int {
	if line < 0 {
		line = 0
	}
	if line >= len(li.lineStarts) {
		return len(li.src)
	}
	off := li.lineStarts[line]
	units := 0
	for off < len(li.src) && li.src[off] != '\n' && units < character {
		r, size := utf8.DecodeRuneInString(li.src[off:])
		off += size
		units += len(utf16.Encode([]rune{r}))
	}
	return off
}

// utf16Len returns the number of UTF-16 code units in s, matching how LSP
// clients count characters by default.
func utf16Len(s string) int {
	n := 0
	for _, r := range s {
		n += len(utf16.Encode([]rune{r}))
	}
	return n
}
