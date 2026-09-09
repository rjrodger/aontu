/* Copyright (c) 2025 Richard Rodger, MIT License */

// `aontu init` (G11 phase 6,
// docs/capability-review/g11-agent-onramp.md; the Go twin of runInit
// in ts/src/cli.ts).
//
// NOT SCAFFOLDING CONVENIENCE. The agent's most expensive failure is
// writing a FIRST document at all: the measurement that opened G11
// found one reaching for the wildcard its neighbours use and getting
// `verdict: valid` over data that violates it. A known-good starting
// document turns generation into editing, which is the operation a
// model is reliably good at.
//
// The trio is real, runnable and tested where it lives
// (docs/skill/init/, run by ts/test/helpdoc.test.ts), and staged into
// both ports by the same generator that stages the teaching pack, so
// the two write the same bytes.

package main

import (
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const initHelp = "aontu init [dir] (try --help)"

// initFile is one member of the trio, as helpdoc/init/index.tsv spells
// it: the name to write, the mode to write it with, and the repository
// file it was staged from. A scaffold whose script has to be chmod'ed
// before it runs is a scaffold with a step missing; a staged copy
// nothing compares with its source is a second source of truth waiting
// to drift, which is what `source` is for (init_test.go).
type initFile struct {
	name   string
	mode   fs.FileMode
	source string
	text   string
}

// initFiles reads the generated index and the staged bodies. Both are
// embedded beside the teaching pack, so a broken read is a broken
// build rather than a run-time condition.
func initFiles() []initFile {
	raw, err := helpdocFS.ReadFile("helpdoc/init/index.tsv")
	if nil != err { //coverage:ignore the file is embedded; absence fails the build
		return nil
	}
	var out []initFile
	for _, line := range strings.Split(string(raw), "\n") {
		if "" == line || strings.HasPrefix(line, "#") {
			continue
		}
		col := strings.Split(line, "\t")
		if 3 != len(col) { //coverage:ignore the generator writes three columns
			continue
		}
		mode, merr := strconv.ParseUint(col[1], 8, 32)
		if nil != merr { //coverage:ignore the generator writes an octal mode
			continue
		}
		body, berr := helpdocFS.ReadFile("helpdoc/init/" + col[0])
		if nil != berr { //coverage:ignore every indexed file is embedded beside the index
			continue
		}
		out = append(out, initFile{
			name: col[0], mode: fs.FileMode(mode), source: col[2],
			text: string(body),
		})
	}
	return out
}

func runInit(argv []string, stdout, stderr io.Writer) int {
	var dirs []string

	for _, arg := range argv {
		switch {
		case "-h" == arg, "--help" == arg:
			io.WriteString(stdout, helpText)
			return 0
		case strings.HasPrefix(arg, "-"):
			io.WriteString(stderr,
				"aontu: unknown init option "+arg+" (try --help)\n")
			return 2
		default:
			dirs = append(dirs, arg)
		}
	}

	if 1 < len(dirs) {
		io.WriteString(stderr,
			"aontu: init takes one directory\n"+initHelp+"\n")
		return 2
	}
	dir := "."
	if 1 == len(dirs) {
		dir = dirs[0]
	}

	files := initFiles()

	// REFUSES TO OVERWRITE, and checks every member BEFORE writing any
	// of them: a scaffold that wrote two files and then refused the
	// third would leave a directory in a state neither the caller nor a
	// re-run can reason about.
	var standing []string
	for _, f := range files {
		if _, err := os.Stat(filepath.Join(dir, f.name)); nil == err {
			standing = append(standing, f.name)
		}
	}
	if 0 < len(standing) {
		io.WriteString(stderr,
			"aontu: "+dir+" already holds "+strings.Join(standing, ", ")+"\n"+
				"aontu: init never overwrites; move them aside or name an"+
				" empty directory\n")
		return 2
	}

	if err := os.MkdirAll(dir, 0o755); nil != err {
		io.WriteString(stderr,
			"aontu: cannot write in "+dir+": "+err.Error()+"\n")
		return 2
	}
	for _, f := range files {
		if err := os.WriteFile(
			filepath.Join(dir, f.name), []byte(f.text), f.mode); nil != err {
			io.WriteString(stderr,
				"aontu: cannot write in "+dir+": "+err.Error()+"\n")
			return 2
		}
	}

	names := make([]string, 0, len(files))
	for _, f := range files {
		names = append(names, filepath.Join(dir, f.name))
	}
	io.WriteString(stdout, strings.Join(names, "\n")+"\n"+
		"\nA model, an instance of it, and the four questions to ask.\n"+
		"Run the checks:  sh "+filepath.Join(dir, "check.sh")+"\n"+
		"Learn the language:  aontu help language\n")
	return 0
}
