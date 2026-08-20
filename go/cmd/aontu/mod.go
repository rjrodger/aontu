/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE MODULE TOOLING (G6 phase 3, the Go side of ts/src/cli.ts's
// runMod). Two subcommands, both LOCAL: `tidy` resolves the closure
// from what is in the stores and rewrites the lockfile, `vendor`
// materialises the locked closure into the project.
//
// `get` and `publish` are the NETWORK half of the design and are not in
// this build. They are named here rather than left to fall out as an
// unknown subcommand, because a reader of the design will type them and
// deserves to be told which half is missing rather than that the word
// is wrong.

package main

import (
	"bytes"
	"encoding/json"
	"io"
	"strings"

	aontu "github.com/rjrodger/aontu/go"
)

const modHelp = "aontu mod tidy|vendor [dir] (try --help)"

func runMod(argv []string, stdout, stderr io.Writer) int {
	var rest []string
	format := "text"

	for i := 0; i < len(argv); i++ {
		arg := argv[i]
		switch {
		case "-h" == arg, "--help" == arg:
			io.WriteString(stdout, helpText)
			return 0
		case "--format" == arg:
			i++
			if len(argv) <= i || ("text" != argv[i] && "json" != argv[i]) {
				io.WriteString(stderr, "aontu: --format needs text or json\n")
				return 2
			}
			format = argv[i]
		case strings.HasPrefix(arg, "-"):
			io.WriteString(stderr, "aontu: unknown mod option "+arg+" (try --help)\n")
			return 2
		default:
			rest = append(rest, arg)
		}
	}

	sub := ""
	if 0 < len(rest) {
		sub = rest[0]
	}
	dir := "."
	if 1 < len(rest) {
		dir = rest[1]
	}

	if "get" == sub || "publish" == sub {
		io.WriteString(stderr,
			"aontu: mod "+sub+" needs a registry client, which this build "+
				"does not ship (docs/capability-review/g6-distribution.md)\n")
		return 2
	}

	if ("tidy" != sub && "vendor" != sub) || 2 < len(rest) {
		io.WriteString(stderr, "aontu: mod needs tidy or vendor\n"+modHelp+"\n")
		return 2
	}

	cache := aontu.ModCacheDir()

	if "tidy" == sub {
		report := aontu.ModTidy(dir, cache)
		io.WriteString(stdout, modRender(sub, format, report.Verdict,
			modTidyLines(report), report.Missing, report)+"\n")
		return modExit(report.Verdict)
	}

	report := aontu.ModVendor(dir, cache)
	io.WriteString(stdout, modRender(sub, format, report.Verdict,
		report.Vendored, report.Missing, report)+"\n")
	return modExit(report.Verdict)
}

func modExit(verdict string) int {
	if "ok" == verdict {
		return 0
	}
	return 1
}

func modTidyLines(report aontu.ModTidyReport) []string {
	out := make([]string, 0, len(report.Lock))
	for _, e := range report.Lock {
		out = append(out, e.Mod+" "+e.V+" "+e.Canon)
	}
	return out
}

func modRender(sub, format, verdict string,
	done, missing []string, report any) string {
	if "json" == format {
		var buf bytes.Buffer
		enc := json.NewEncoder(&buf)
		enc.SetEscapeHTML(false)
		enc.SetIndent("", "  ")
		_ = enc.Encode(modReportJSON{
			Aontu:  subsumeProducerJSON{Verb: "mod " + sub, Version: aontu.VERSION},
			Report: report,
		})
		return strings.TrimSuffix(buf.String(), "\n")
	}

	lines := []string{"verdict: " + verdict}
	lines = append(lines, done...)
	for _, m := range missing {
		lines = append(lines, m+": not fetched (run: aontu mod get)")
	}
	return strings.Join(lines, "\n")
}

// The machine-readable form. The report's own fields are spread into
// the envelope by the encoder, which is why it is embedded rather than
// nested: `{aontu:{…}, lock:[…], missing:[…], verdict:"…"}` is the
// shape the TypeScript port prints.
type modReportJSON struct {
	Aontu  subsumeProducerJSON `json:"aontu"`
	Report any                 `json:"-"`
}

func (m modReportJSON) MarshalJSON() ([]byte, error) {
	inner, err := json.Marshal(m.Report)
	if nil != err { //coverage:ignore the reports are plain structs
		return nil, err
	}
	var fields map[string]any
	if err := json.Unmarshal(inner, &fields); nil != err { //coverage:ignore see above
		return nil, err
	}
	fields["aontu"] = m.Aontu
	return json.Marshal(fields)
}
