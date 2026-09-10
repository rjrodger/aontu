/* Copyright (c) 2025 Richard Rodger, MIT License */

// `aontu explain <code>` (G11 phase 3,
// docs/capability-review/g11-agent-onramp.md) -- `rustc --explain`,
// over the code registry this repository already maintains.
//
// test/spec/errcodes.tsv registers 157 codes across seven classes, and
// both ports' hint tables carry an explanation for most of them. Every
// one of those explanations was reachable only by TRIGGERING the error
// that carries it: a caller handed `[aontu/mapval_no_gen]` in a report
// had no way to ask what it meant.
//
// THE REGISTRY IS THE LIST. It is the shared contract -- 157 rows,
// asserted set-equal with codeClasses in both ports -- while the hint
// tables are smaller and not themselves in parity (131 entries in Go
// against 130 in TypeScript, the extra being decimal_syntax, which TS
// never raises). Listing from the registry keeps the two ports
// identical over a difference that is not about what either can
// report, and makes the twenty-seven registered codes carrying no
// explanation text VISIBLE, where before this verb their absence could
// only be met beside the error that raises them.

package main

import (
	"io"
	"strings"

	aontu "github.com/aontu-lang/aontu/go"
)

const explainHelp = "aontu explain <code> (try `aontu explain --list`)"

func runExplain(argv []string, stdout, stderr io.Writer) int {
	format := "text"
	list := false
	var codes []string

	for i := 0; i < len(argv); i++ {
		arg := argv[i]
		switch {
		case "-h" == arg, "--help" == arg:
			io.WriteString(stdout, helpText)
			return 0
		case "--list" == arg:
			list = true
		case "--format" == arg:
			i++
			if len(argv) <= i || ("text" != argv[i] && "json" != argv[i]) {
				io.WriteString(stderr, "aontu: --format needs text or json\n")
				return 2
			}
			format = argv[i]
		case strings.HasPrefix(arg, "-"):
			io.WriteString(stderr,
				"aontu: unknown explain option "+arg+" (try --help)\n")
			return 2
		default:
			codes = append(codes, arg)
		}
	}

	if list {
		if 0 < len(codes) {
			io.WriteString(stderr,
				"aontu: --list takes no code\n"+explainHelp+"\n")
			return 2
		}
		io.WriteString(stdout, renderExplainList(format)+"\n")
		return 0
	}

	if 1 != len(codes) {
		io.WriteString(stderr,
			"aontu: explain needs one code\n"+explainHelp+"\n")
		return 2
	}

	code := codes[0]
	class, hint, registered := aontu.ExplainCode(code)
	if !registered {
		// AN UNKNOWN CODE IS A USAGE ERROR AND NAMES NEAR MATCHES.
		// A caller reading a code out of a report has almost certainly
		// typed it correctly, so the likely cause is a code from another
		// tool or a truncated one, and the near matches say which.
		io.WriteString(stderr, "aontu: no such error code `"+code+"`\n")
		if near := nearestVerb(code, aontu.Codes()); "" != near {
			io.WriteString(stderr, "aontu: did you mean `"+near+"`?\n")
		}
		io.WriteString(stderr,
			"aontu: `aontu explain --list` lists every registered code\n")
		return 2
	}

	if "json" == format {
		io.WriteString(stdout, renderExplainJSON(code, class, hint)+"\n")
		return 0
	}
	// A REGISTERED CODE WITH NO HINT SAYS SO rather than printing an
	// empty block, which would read as an explanation that happened to
	// be blank.
	body := hint
	if "" == body {
		body = "(no explanation text is registered for this code)"
	}
	io.WriteString(stdout,
		"code:  "+code+"\nclass: "+class+"\n\n"+body+"\n")
	return 0
}

// The class of every code, so a caller can read the report vocabulary
// without triggering it. `--format json` answers the same as an array.
func renderExplainList(format string) string {
	codes := aontu.Codes()
	if "json" == format {
		rows := make([]explainRowJSON, 0, len(codes))
		for _, c := range codes {
			class, hint, _ := aontu.ExplainCode(c)
			rows = append(rows, explainRowJSON{
				Class: class, Code: c, Explained: "" != hint})
		}
		return helpJSON(explainListJSON{
			Aontu: subsumeProducerJSON{Verb: "explain", Version: aontu.VERSION},
			Codes: rows,
		})
	}
	width := 0
	for _, c := range codes {
		if width < len(c) {
			width = len(c)
		}
	}
	var b strings.Builder
	for _, c := range codes {
		class, hint, _ := aontu.ExplainCode(c)
		mark := ""
		if "" == hint {
			mark = "  (no text)"
		}
		b.WriteString(
			c + strings.Repeat(" ", width-len(c)) + "  " + class + mark + "\n")
	}
	return strings.TrimSuffix(b.String(), "\n")
}

// The machine-readable forms. Field order is LEXICOGRAPHIC, the
// canonical emitter's order (see vetReportJSON).
type explainJSON struct {
	Aontu subsumeProducerJSON `json:"aontu"`
	Class string              `json:"class"`
	Code  string              `json:"code"`
	Hint  string              `json:"hint"`
}

type explainRowJSON struct {
	Class string `json:"class"`
	Code  string `json:"code"`
	// Whether this port carries explanation text for the code. The
	// registry is in parity; the hint tables are not, so a consumer
	// that wants only explained codes can filter rather than guess.
	Explained bool `json:"explained"`
}

type explainListJSON struct {
	Aontu subsumeProducerJSON `json:"aontu"`
	Codes []explainRowJSON    `json:"codes"`
}

func renderExplainJSON(code, class, hint string) string {
	return helpJSON(explainJSON{
		Aontu: subsumeProducerJSON{Verb: "explain", Version: aontu.VERSION},
		Class: class,
		Code:  code,
		Hint:  hint,
	})
}
