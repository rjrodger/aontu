/* Copyright (c) 2025 Richard Rodger, MIT License */

// OVERLAY PATCH (G7 phase 5, the Go side of ts/src/patch.ts): change a
// document by APPENDING to an overlay, not by rewriting the file.
//
// An overlay entry is just another conjunct, and unification is
// order-independent, so appending `services: auth: owner: "x"` to a
// second file and evaluating both is exactly the same value as writing
// it into the first — with no parsing of the target and no comment or
// layout damage. What an overlay CANNOT do is change a PINNED value:
// the lattice refuses 5 against 3 and the report says so, which `why`
// then locates.
//
// The verdict is G2's, unchanged: Vet(entry, overlay) already asks
// exactly the right question, so `set` adds a writer, not a report.

package aontu

import (
	"strings"
)

type PatchOptions struct {
	// Where each document CAME FROM, so relative `@"file"` loads
	// inside them resolve from their own directories.
	EntryPath   string
	OverlayPath string
}

type PatchReport struct {
	// Appended is the added lines alone, in order.
	Appended []string     `json:"appended"`
	Findings []VetFinding `json:"findings"`
	// Overlay is the overlay text as it would stand after the
	// assignments. The caller writes it — an engine that touched the
	// filesystem could not be used by a server.
	Overlay string `json:"overlay"`
	Verdict string `json:"verdict"`
}

// ParseAssignment splits `<path>=<value>` at the FIRST `=`: a path
// segment is a name, and the value is arbitrary Aontu source, which
// may itself contain `=`. ok is false when the text is not an
// assignment at all.
func ParseAssignment(text string) (path, value string, ok bool) {
	eq := strings.Index(text, "=")
	if eq < 1 {
		return "", "", false
	}
	path = strings.TrimSpace(text[:eq])
	value = strings.TrimSpace(text[eq+1:])
	if "" == value || 0 == len(queryPathParts(path)) {
		return "", "", false
	}
	return path, value, true
}

// overlayLine is the path-flattened conjunct one assignment becomes:
// `$.a.b = 1` is `"a": "b": 1`. Keys are QUOTED — a segment may be a
// word the grammar spells otherwise, a number, or a name with a space
// in it.
func overlayLine(path, value string) string {
	parts := queryPathParts(path)
	quoted := make([]string, len(parts))
	for i, p := range parts {
		quoted[i] = jsonString(p)
	}
	return strings.Join(quoted, ": ") + ": " + value
}

// Patch appends the assignments to the overlay and answers what the
// result holds. Mirrors patch in ts/src/patch.ts.
func Patch(
	entrySrc, overlaySrc string, assignments []string, opts *PatchOptions,
) PatchReport {
	options := PatchOptions{}
	if nil != opts {
		options = *opts
	}

	appended := []string{}
	for _, text := range assignments {
		path, value, ok := ParseAssignment(text)
		if !ok {
			msg := "Not a <path>=<value> assignment: " + text
			return PatchReport{
				Appended: []string{},
				Findings: []VetFinding{{
					Class:    "parse",
					Code:     "patch_assignment",
					Message:  msg,
					Path:     "$",
					Severity: "error",
					Sites:    []VetSite{},
				}},
				Overlay: overlaySrc,
				Verdict: VetError,
			}
		}
		appended = append(appended, overlayLine(path, value))
	}

	overlay := joinOverlay(overlaySrc, appended)

	// The file names ride as URLs as well as base paths, so a finding
	// names the entry and the overlay rather than Vet's generic
	// `schema`/`data` labels — with two documents that both belong to
	// the caller, "which file" is the whole question.
	report := Vet(entrySrc, overlay, &VetOptions{
		DataPath:   options.OverlayPath,
		DataURL:    options.OverlayPath,
		SchemaPath: options.EntryPath,
		SchemaURL:  options.EntryPath,
	})

	return PatchReport{
		Appended: appended,
		Findings: report.Findings,
		Overlay:  overlay,
		Verdict:  report.Verdict,
	}
}

// joinOverlay writes one line per assignment, after whatever the
// overlay already said. A trailing newline is kept when the file had
// one and added when it did not: appending must not join two entries
// into one line.
func joinOverlay(overlaySrc string, appended []string) string {
	if 0 == len(appended) {
		return overlaySrc
	}
	head := overlaySrc
	if "" != overlaySrc && !strings.HasSuffix(overlaySrc, "\n") {
		head = overlaySrc + "\n"
	}
	return head + strings.Join(appended, "\n") + "\n"
}
