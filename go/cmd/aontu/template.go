/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE TEMPLATE SURFACE (docs/design/TEMPLATE.0.md; RENDER.0.md P8),
// the Go side of runTemplate in ts/src/cli.ts: the two transforms and
// the round trip between them. `render` reads a template directly, by
// its extension; this verb is for seeing the canonical form, for
// writing one by hand and sugaring it, and for the check that keeps a
// committed template and its meaning in agreement.

package main

import (
	"encoding/json"
	"io"
	"os"
	"strconv"
	"strings"

	aontu "github.com/aontu-lang/aontu/go"
)

const templateHelp = "aontu template [--resugar] [--check] [--marker <token>] <file> (try --help)"

func runTemplate(argv []string, stdout, stderr io.Writer) int {
	var files []string
	resugar, check := false, false
	marker := ""

	for i := 0; i < len(argv); i++ {
		arg := argv[i]
		switch {
		case "-h" == arg, "--help" == arg:
			io.WriteString(stdout, helpText)
			return 0
		case "--resugar" == arg:
			resugar = true
		case "--check" == arg:
			check = true
		case "--marker" == arg:
			i++
			if len(argv) <= i {
				io.WriteString(stderr, "aontu: --marker needs a token\n")
				return 2
			}
			marker = argv[i]
		case strings.HasPrefix(arg, "-"):
			io.WriteString(stderr,
				"aontu: unknown template option "+arg+" (try --help)\n")
			return 2
		default:
			files = append(files, arg)
		}
	}

	if 1 != len(files) {
		io.WriteString(stderr, "aontu: template needs one file\n"+templateHelp+"\n")
		return 2
	}
	// THE TWO ARE DIRECTIONS, NOT MODES THAT COMPOSE: --check reads a
	// template and asks whether the round trip answers it back, and
	// --resugar reads the canonical form instead. A run cannot be both
	// at once, because the file is one thing or the other.
	if resugar && check {
		io.WriteString(stderr,
			"aontu: template takes one of --resugar or --check\n")
		return 2
	}

	src, err := os.ReadFile(files[0])
	if nil != err {
		io.WriteString(stderr,
			"aontu: cannot read "+files[0]+": "+err.Error()+"\n")
		return 2
	}

	mark := marker
	if "" == mark {
		mark = aontu.MarkerFor(files[0])
	}
	text := string(src)

	if check {
		// THE ROUND TRIP IS THE CHECK (D6): the file held to the
		// spelling the two transforms answer. What that names is a
		// marker line the transform would not have written -- one
		// without its space, or one whose aontu is indented after the
		// marker rather than before it, since the marker keeps its own
		// indentation. It does NOT name a changed body line: a
		// template's whitespace is output, so a trimmed trailing space
		// is still a valid template and it is `render --check` against
		// the committed files that catches it. The first line that
		// differs is the report, since a whole diff of a generator is
		// the file again.
		back := aontu.ResugarTemplate(aontu.DesugarTemplate(text, mark), mark)
		if back == text {
			return 0
		}
		want := strings.Split(back, "\n")
		have := strings.Split(text, "\n")
		n := 0
		for n < len(want) && n < len(have) && want[n] == have[n] {
			n++
		}
		io.WriteString(stderr,
			"aontu: "+files[0]+":"+strconv.Itoa(n+1)+
				" is not what the round trip answers\n"+
				"  have: "+templateJSON(have, n)+"\n"+
				"  want: "+templateJSON(want, n)+"\n")
		return 1
	}

	if resugar {
		io.WriteString(stdout, aontu.ResugarTemplate(text, mark))
	} else {
		io.WriteString(stdout, aontu.DesugarTemplate(text, mark))
	}
	return 0
}

// templateJSON quotes one line of a report, or the empty string where
// the two files are of different lengths and one has run out.
func templateJSON(lines []string, n int) string {
	line := ""
	if n < len(lines) {
		line = lines[n]
	}
	out, _ := json.Marshal(line)
	return string(out)
}
