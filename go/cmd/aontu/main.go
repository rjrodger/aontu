/* Copyright (c) 2025 Richard Rodger, MIT License */

// Command aontu is the command-line interface for the Aontu unifier.
//
//	aontu [options] [file]
//
// With a file argument, the file is evaluated and the result printed.
// With no file on an interactive terminal, a REPL is started. With no
// file and piped input, the source is read from stdin.
package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	aontu "github.com/rjrodger/aontu/go"
)

const helpText = `Usage: aontu [options] [file]

Evaluate an Aontu source file and print the result as JSON.
With no file on an interactive terminal, start a REPL.
With no file and piped input, read the source from stdin.

Options:
  -c, --canon     Print the canonical form instead of generated JSON
  -h, --help      Show this help and exit
  -v, --version   Print the version and exit

REPL commands:
  :help           Show REPL help
  :canon          Switch to canonical-form output
  :json           Switch to JSON output
  :quit, :exit    Exit the REPL (or press Ctrl-D)
`

// render evaluates src and returns the rendered output for the given
// mode ("json" or "canon"). A non-nil error is a unification/parse
// failure.
func render(a *aontu.Aontu, src, mode string) (string, error) {
	if mode == "canon" {
		v, err := a.Unify(src)
		if err != nil {
			return "", err
		}
		return v.Canon(), nil
	}
	out, err := a.Generate(src)
	if err != nil {
		return "", err
	}
	// An Encoder with HTML escaping OFF, not json.MarshalIndent: Marshal
	// rewrites <, > and & as their \u00xx escapes, which the
	// canonical TypeScript CLI (exactJSON, and JSON.stringify before it)
	// does not — so `x:"<b>&</b>"` printed different bytes in the two
	// CLIs. The shared suite's gens mode already turned this escaping off
	// for exactly this reason (specGens in spec_test.go); the CLI must
	// make the same choice or the parity probe in AGENTS.md, which
	// compares the two command lines, reads a divergence on any document
	// containing those three characters.
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err := enc.Encode(out); err != nil {
		return "", err
	}
	// Encode always appends a newline; emit adds its own.
	return strings.TrimSuffix(buf.String(), "\n"), nil
}

// emit renders src to out (or the error to errw) and returns the
// process exit code.
func emit(a *aontu.Aontu, src, mode string, out, errw io.Writer) int {
	text, err := render(a, src, mode)
	if err != nil {
		fmt.Fprintln(errw, err)
		return 1
	}
	fmt.Fprintln(out, text)
	return 0
}

// aontuForFile builds an Aontu whose relative @"file" loads resolve
// against the directory containing file, so `aontu /path/to/main.aontu`
// works regardless of the current working directory (matching the
// TypeScript CLI, which passes the resolved entry path).
func aontuForFile(file string) *aontu.Aontu {
	abs, err := filepath.Abs(file)
	if err != nil {
		abs = file
	}
	a := aontu.NewWithBase(filepath.Dir(abs))
	// Error frames name the entry file as typed, the way the TS CLI's
	// resolved entry path renders relative to the working directory.
	a.File = file
	return a
}

// stdinIsPipe reports whether stdin is piped/redirected (not a terminal).
func stdinIsPipe() bool {
	info, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return (info.Mode() & os.ModeCharDevice) == 0
}

// repl reads source lines from in, evaluating each and writing results
// to out, until EOF or a :quit/:exit command.
func repl(a *aontu.Aontu, mode string, in io.Reader, out io.Writer) {
	fmt.Fprintf(out, "Aontu v%s REPL — :help for commands, :quit to exit\n", aontu.VERSION)
	sc := bufio.NewScanner(in)
	// Raise the line cap well above bufio's 64KB default so a long
	// pasted source line is not silently truncated.
	sc.Buffer(make([]byte, 0, 64*1024), 16*1024*1024)
	fmt.Fprint(out, "aontu> ")
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" {
			fmt.Fprint(out, "aontu> ")
			continue
		}
		if strings.HasPrefix(line, ":") {
			switch line {
			case ":help":
				fmt.Fprint(out, helpText)
			case ":canon":
				mode = "canon"
				fmt.Fprintln(out, "canon output")
			case ":json":
				mode = "json"
				fmt.Fprintln(out, "json output")
			case ":quit", ":exit":
				fmt.Fprintln(out)
				return
			default:
				fmt.Fprintf(out, "unknown command: %s (try :help)\n", line)
			}
			fmt.Fprint(out, "aontu> ")
			continue
		}
		text, err := render(a, line, mode)
		if err != nil {
			fmt.Fprintln(out, err)
		} else {
			fmt.Fprintln(out, text)
		}
		fmt.Fprint(out, "aontu> ")
	}
	if err := sc.Err(); err != nil {
		fmt.Fprintln(out, "aontu: input error:", err)
	}
	fmt.Fprintln(out)
}

func main() {
	os.Exit(run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr, !stdinIsPipe()))
}

// run is main with its arguments, streams and terminal-ness injected,
// returning the process exit code. Separated from main so tests can
// drive the whole command with in-memory pipes.
func run(args []string, stdin io.Reader, stdout, stderr io.Writer, tty bool) int {
	mode := "json"
	var file string

	for _, arg := range args {
		switch arg {
		case "-c", "--canon":
			mode = "canon"
		case "-h", "--help":
			fmt.Fprint(stdout, helpText)
			return 0
		case "-v", "--version":
			fmt.Fprintln(stdout, aontu.VERSION)
			return 0
		default:
			if strings.HasPrefix(arg, "-") {
				fmt.Fprintf(stderr, "aontu: unknown option %s (try --help)\n", arg)
				return 2
			}
			file = arg
		}
	}

	if file != "" {
		src, err := os.ReadFile(file)
		if err != nil {
			fmt.Fprintf(stderr, "aontu: cannot read %s: %v\n", file, err)
			return 1
		}
		// Resolve relative @"file" loads against the entry file's dir.
		return emit(aontuForFile(file), string(src), mode, stdout, stderr)
	}

	a := aontu.New()

	if !tty {
		src, err := io.ReadAll(stdin)
		if err != nil {
			fmt.Fprintf(stderr, "aontu: cannot read stdin: %v\n", err)
			return 1
		}
		return emit(a, string(src), mode, stdout, stderr)
	}

	repl(a, mode, stdin, stdout)
	return 0
}
