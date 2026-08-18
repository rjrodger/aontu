/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE VET VERB (G2 phase 4, the Go side of ts/src/cli.ts).
//
// Exit codes are VERDICT CLASSES, not a pass/fail bit: an agent loop
// branches on "the data contradicts the truth" (1) differently from
// "the data has not supplied everything the truth requires" (3), and
// differently again from "the schema itself is broken" (4), which is
// never the data's fault. 2 stays what it already was for this CLI --
// the caller got the invocation wrong -- which is why an unreadable
// file is a 2 rather than a 4.

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	aontu "github.com/rjrodger/aontu/go"
)

const vetHelp = "aontu vet <schema> <data> [more-data...] (try --help)"

var vetExit = map[string]int{
	aontu.VetValid:      0,
	aontu.VetInvalid:    1,
	aontu.VetIncomplete: 3,
	aontu.VetError:      4,
}

// The worst verdict wins across data files: a run that is invalid
// anywhere is invalid, and a schema that cannot stand up makes every
// file's verdict moot.
var vetRank = map[string]int{
	aontu.VetValid:      0,
	aontu.VetIncomplete: 1,
	aontu.VetInvalid:    2,
	aontu.VetError:      3,
}

type vetArgs struct {
	schema    string
	data      []string
	format    string
	at        string
	closed    bool
	partial   bool
	maxErrors int
}

// parseVetArgs reads the verb's argument tail. It returns the error
// TEXT rather than an error, so the caller owns the exit code.
func parseVetArgs(argv []string) (*vetArgs, string) {
	args := &vetArgs{format: "text"}
	var files []string

	for i := 0; i < len(argv); i++ {
		arg := argv[i]
		switch {
		case "--at" == arg:
			i++
			if len(argv) <= i {
				return nil, "aontu: --at needs a path"
			}
			args.at = argv[i]
		case "--format" == arg:
			i++
			if len(argv) <= i || ("text" != argv[i] && "json" != argv[i]) {
				return nil, "aontu: --format needs text or json"
			}
			args.format = argv[i]
		case "--max-errors" == arg:
			i++
			n := 0
			if len(argv) > i {
				n, _ = strconv.Atoi(argv[i])
			}
			if n < 1 {
				return nil, "aontu: --max-errors needs a positive whole number"
			}
			args.maxErrors = n
		case "--closed" == arg:
			args.closed = true
		case "--partial" == arg:
			args.partial = true
		case strings.HasPrefix(arg, "-"):
			return nil, "aontu: unknown vet option " + arg + " (try --help)"
		default:
			files = append(files, arg)
		}
	}

	if len(files) < 2 {
		return nil, "aontu: vet needs a schema and at least one data file\n" + vetHelp
	}

	args.schema = files[0]
	args.data = files[1:]
	return args, ""
}

// renderFinding writes one line per site, so a finding reads as "what
// is wrong, where the data says it, and where the truth says
// otherwise". The data site comes first because it is the one to edit.
func renderFinding(f aontu.VetFinding) string {
	out := []string{f.Path + ": " + f.Code + " [" + f.Class + "]"}

	if "" != f.Message {
		out = append(out, "  "+f.Message)
	}
	if nil != f.Note {
		out = append(out, "  note: "+*f.Note)
	}
	if nil != f.Expected {
		out = append(out, "  expected: "+*f.Expected)
	}
	if nil != f.Actual {
		out = append(out, "  actual:   "+*f.Actual)
	}
	for _, s := range f.Sites {
		// Every site carries the canon of the value it stands for: that
		// is what makes the two sides of a conflict readable side by
		// side. A site with no file name renders as none.
		file := ""
		if nil != s.File {
			file = *s.File
		}
		out = append(out, fmt.Sprintf("  %s: %s:%d:%d (%s)",
			s.Role, file, s.Row, s.Col, s.Value))
	}

	return strings.Join(out, "\n")
}

func renderVetText(report aontu.VetReport) string {
	head := "verdict: " + report.Verdict
	if report.Truncated {
		head += " (findings truncated)"
	}
	if 0 == len(report.Findings) {
		return head
	}
	out := []string{head, ""}
	for _, f := range report.Findings {
		out = append(out, renderFinding(f))
	}
	return strings.Join(out, "\n")
}

// vetReportJSON is the machine-readable form. `aontu` names the
// producer, so a report read from a file or a pipe says which version
// and which verb made it without the consumer having to know.
//
// The field order is LEXICOGRAPHIC: the canonical emitter sorts object
// keys (exactJSON) and Go's encoder writes declaration order, so the
// two agree only if the declaration is already sorted.
type vetReportJSON struct {
	Aontu     vetProducerJSON    `json:"aontu"`
	Findings  []aontu.VetFinding `json:"findings"`
	Truncated bool               `json:"truncated"`
	Verdict   string             `json:"verdict"`
}

type vetProducerJSON struct {
	Verb    string `json:"verb"`
	Version string `json:"version"`
}

func renderVetJSON(report aontu.VetReport) string {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	// HTML escaping OFF and two-space indent, the same settings the
	// generated-output path uses (render, main.go): the canonical
	// emitter leaves <, > and & literal, and a report quoting a
	// document's own text would otherwise differ byte for byte.
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	// Encode cannot fail here: every field is a string, a bool, an int
	// or a slice of the same.
	_ = enc.Encode(vetReportJSON{
		Aontu:     vetProducerJSON{Verb: "vet", Version: aontu.VERSION},
		Findings:  report.Findings,
		Truncated: report.Truncated,
		Verdict:   report.Verdict,
	})
	return strings.TrimSuffix(buf.String(), "\n")
}

func runVet(argv []string, stdout, stderr io.Writer) int {
	args, argErr := parseVetArgs(argv)
	if "" != argErr {
		fmt.Fprintln(stderr, argErr)
		return 2
	}

	schemaSrc, err := os.ReadFile(args.schema)
	if err != nil {
		fmt.Fprintf(stderr, "aontu: cannot read %s: %v\n", args.schema, err)
		return 2
	}
	type source struct{ file, src string }
	sources := make([]source, 0, len(args.data))
	for _, file := range args.data {
		src, err := os.ReadFile(file)
		if err != nil {
			fmt.Fprintf(stderr, "aontu: cannot read %s: %v\n", file, err)
			return 2
		}
		sources = append(sources, source{file: file, src: string(src)})
	}

	// Each data file is vetted on its own, because a parsed tree is
	// single-use (docs/reference-api.md) -- and because two data files
	// are two candidates for the same truth, not one merged candidate.
	verdict := aontu.VetValid
	truncated := false
	findings := []aontu.VetFinding{}

	for _, source := range sources {
		report := aontu.Vet(string(schemaSrc), source.src, &aontu.VetOptions{
			At:        args.at,
			Closed:    args.closed,
			Partial:   args.partial,
			MaxErrors: args.maxErrors,
			SchemaURL: args.schema,
			DataURL:   source.file,
		})

		if vetRank[verdict] < vetRank[report.Verdict] {
			verdict = report.Verdict
		}
		truncated = truncated || report.Truncated
		findings = append(findings, report.Findings...)
	}

	report := aontu.VetReport{Verdict: verdict, Truncated: truncated, Findings: findings}
	text := renderVetText(report)
	if "json" == args.format {
		text = renderVetJSON(report)
	}

	fmt.Fprintln(stdout, text)
	return vetExit[verdict]
}
