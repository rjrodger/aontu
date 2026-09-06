/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// THE TEMPLATE SURFACE (docs/design/TEMPLATE.0.md; RENDER.0.md P8),
// the Go twin of ts/src/template.ts. A generator written in the
// TARGET's own syntax: a marked line is aontu source, and every other
// line is a line of output.
//
//	//- code: units: [{ path: "hi.ts", lang: "typescript", decls: [{
//	//-   k: "frag", of: emit($.svc, { match: { n: string }, body: [
//	export const NAME = "world"
//	//- ]}) }] }]
//
// That is the whole desugaring, and it is LINE-ORIENTED: nothing here
// parses aontu, and nothing here reads the target's syntax beyond its
// comment token. A marker line contributes its text to the document;
// an unmarked line contributes one quoted string, which is a body
// element where the marker lines left a list open.
//
// A MARKER IS RECOGNISED AFTER LEADING WHITESPACE AND KEEPS ITS OWN
// INDENTATION (D2), which is what lets a template be written exactly
// where its output appears (D7).
//
// THE SUGAR IS THE FIXPOINT OF THE TWO TRANSFORMS (D6): a canonical
// line that looks like a body element is rebuilt as a target line, the
// rebuild is desugared, and the rebuild is taken ONLY if that
// reproduces the canonical line. A line no target line can carry --
// one that would itself read as a marker -- fails that test and stays
// where it is, so there is no table of escapes to get wrong.

// templateMarkers is a marker per file extension: a comment token plus
// a dash. Any other language passes its own, which is why the surface
// needs no table of languages.
var templateMarkers = map[string]string{
	"c":     "//-",
	"cc":    "//-",
	"cpp":   "//-",
	"cs":    "//-",
	"css":   "/*-",
	"go":    "//-",
	"h":     "//-",
	"hs":    "---",
	"java":  "//-",
	"js":    "//-",
	"jsx":   "//-",
	"kt":    "//-",
	"lua":   "---",
	"php":   "//-",
	"pl":    "#-",
	"py":    "#-",
	"rb":    "#-",
	"rs":    "//-",
	"scala": "//-",
	"sh":    "#-",
	"sql":   "---",
	"swift": "//-",
	"toml":  "#-",
	"ts":    "//-",
	"tsx":   "//-",
	"yaml":  "#-",
	"yml":   "#-",
}

// DefaultMarker is the marker for a file whose extension names no
// token: the C-family line comment.
const DefaultMarker = "//-"

// templateBlockClose closes the block marker form. A language with no
// line comment marks with `/*- … */`, and the closer is implied by the
// opener rather than named separately.
const templateBlockClose = "*/"

// MarkerFor is the marker for a file, by its extension, or the
// C-family default. The extension decides, exactly as it decides what
// an include is (ADR-012).
func MarkerFor(path string) string {
	slash := strings.LastIndexAny(path, "/\\")
	dot := strings.LastIndex(path, ".")
	ext := ""
	if dot > slash {
		ext = strings.ToLower(path[dot+1:])
	}
	if m, has := templateMarkers[ext]; has {
		return m
	}
	return DefaultMarker
}

func templateIsBlock(marker string) bool {
	return strings.HasPrefix(marker, "/*")
}

// INDENTATION IS SPACES AND TABS, and nothing else. A host trim is not
// the same set in the two ports -- JavaScript's trims every Unicode
// space, Go's TrimSpace trims a different list -- and a line of a
// template file that began with one of the characters they disagree
// about would be a marker line in one engine and a line of output in
// the other. Twin of indentOf in ts/src/template.ts.
func templateIndent(line string) int {
	i := 0
	for i < len(line) && (' ' == line[i] || '\t' == line[i]) {
		i++
	}
	return i
}

// templateTrim is the line without its indentation or its trailing
// spaces and tabs.
func templateTrim(line string) string {
	end := len(line)
	for 0 < end && (' ' == line[end-1] || '\t' == line[end-1]) {
		end--
	}
	return line[templateIndent(line):end]
}

// templateLine is one line of a template, read: its indentation,
// whether it is a marker, and the text it carries.
type templateLine struct {
	marker bool
	indent string
	text   string
}

func templateRead(line string, marker string) templateLine {
	indent := line[:templateIndent(line)]
	rest := line[len(indent):]
	if !strings.HasPrefix(rest, marker) {
		return templateLine{marker: false, indent: "", text: line}
	}
	body := rest[len(marker):]
	// The block form's closer is part of the marker, not of the aontu.
	// A block marker line that never closes is not a marker line: the
	// language's own parser would not read it as a comment either.
	if templateIsBlock(marker) {
		end := strings.LastIndex(body, templateBlockClose)
		if 0 > end {
			return templateLine{marker: false, indent: "", text: line}
		}
		body = templateTrim(body[:end])
	}
	// ONE SPACE AFTER THE MARKER IS THE MARKER'S, so `//- x: 1` carries
	// `x: 1` and the resugaring writes the space back. A marker written
	// without it carries the same aontu and is normalised on the round
	// trip, which --check reports as the drift it is.
	body = strings.TrimPrefix(body, " ")
	return templateLine{marker: true, indent: indent, text: body}
}

// templateQuote is THE CANONICAL QUOTE, CHOSEN PER LINE (D6). A
// backtick string carries `"` and `'` unescaped, which is most of what
// target code holds, so a line takes one unless it holds a backtick
// itself.
//
// A BACKSLASH IS ESCAPED IN EITHER QUOTE, and that is not what the
// design note assumed: this engine reads the escapes of a backtick
// string exactly as it reads a quoted one, and an unknown escape drops
// its backslash (`\p` is `p`). Only the delimiter differs.
func templateQuote(text string) string {
	escaped := strings.ReplaceAll(text, "\\", "\\\\")
	if strings.Contains(text, "`") {
		return `"` + strings.ReplaceAll(escaped, `"`, `\"`) + `"`
	}
	return "`" + escaped + "`"
}

// templateUnquote is the line a quoted body element carries, and false
// when the line is not one: anything but a lone string literal, and any
// escape the quoting above does not write. The fixpoint test is what
// makes being conservative here safe -- a line this refuses stays
// aontu.
func templateUnquote(text string) (string, bool) {
	t := templateTrim(text)
	if 2 > len(t) {
		return "", false
	}
	quote := t[0]
	if ('`' != quote && '"' != quote) || t[len(t)-1] != quote {
		return "", false
	}
	inner := t[1 : len(t)-1]
	var out strings.Builder
	for i := 0; i < len(inner); i++ {
		c := inner[i]
		if quote == c {
			return "", false
		}
		if '\\' != c {
			out.WriteByte(c)
			continue
		}
		i++
		if len(inner) <= i {
			return "", false
		}
		n := inner[i]
		if '\\' == n || ('"' == n && '"' == quote) {
			out.WriteByte(n)
			continue
		}
		return "", false
	}
	return out.String(), true
}

// templateSplit answers a file's lines and whether it ended with a
// newline. A trailing newline is the file's, not a line of output: a
// text file ends with one, and the round trip must not grow an empty
// output line each pass.
func templateSplit(src string) ([]string, bool) {
	lines := strings.Split(src, "\n")
	tail := 1 < len(lines) && "" == lines[len(lines)-1]
	if tail {
		lines = lines[:len(lines)-1]
	}
	return lines, tail
}

func templateJoin(lines []string, tail bool) string {
	out := strings.Join(lines, "\n")
	if tail {
		out += "\n"
	}
	return out
}

// DesugarTemplate turns a template file into the canonical aontu
// document. A marker line is its own text, at its own indentation;
// every other line is one quoted string, which lands wherever the
// marker lines left a list open.
func DesugarTemplate(src string, marker string) string {
	if "" == marker {
		marker = DefaultMarker
	}
	lines, tail := templateSplit(src)
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		read := templateRead(line, marker)
		if read.marker {
			out = append(out, read.indent+read.text)
		} else {
			out = append(out, templateQuote(read.text))
		}
	}
	return templateJoin(out, tail)
}

// ResugarTemplate turns the canonical document back into a template
// file. Every line is a marker line unless it is a body element that
// survives the fixpoint -- rebuild the target line, desugar the
// rebuild, and take it only if that answers the canonical line back.
func ResugarTemplate(src string, marker string) string {
	if "" == marker {
		marker = DefaultMarker
	}
	lines, tail := templateSplit(src)
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		// THE ELEMENT'S OWN INDENTATION IS NOT PART OF IT: the target
		// line is the string's content, and where the canonical form
		// puts the element on the page is the formatter's business.
		// Comparing the whole line instead would refuse every body
		// element of a document `aontu fmt` had indented, which is
		// every document it has seen.
		if target, ok := templateUnquote(line); ok &&
			DesugarTemplate(target, marker) == templateTrim(line) {
			out = append(out, target)
			continue
		}
		text := line[templateIndent(line):]
		open := line[:templateIndent(line)] + marker
		closer := ""
		if templateIsBlock(marker) {
			closer = " " + templateBlockClose
		}
		if "" == text {
			out = append(out, open+closer)
		} else {
			out = append(out, open+" "+text+closer)
		}
	}
	return templateJoin(out, tail)
}
