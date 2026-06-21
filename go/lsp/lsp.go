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

// utf16Len returns the number of UTF-16 code units in s, matching how LSP
// clients count characters by default.
func utf16Len(s string) int {
	n := 0
	for _, r := range s {
		n += len(utf16.Encode([]rune{r}))
	}
	return n
}
