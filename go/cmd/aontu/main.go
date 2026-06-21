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
	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// emit renders src to stdout (or the error to stderr) and returns the
// process exit code.
func emit(a *aontu.Aontu, src, mode string) int {
	text, err := render(a, src, mode)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	fmt.Println(text)
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
	return aontu.NewWithBase(filepath.Dir(abs))
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
	fmt.Fprintf(out, "Aontu v%s REPL — :help for commands, :quit to exit\n", aontu.Version)
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
	mode := "json"
	var file string

	for _, arg := range os.Args[1:] {
		switch arg {
		case "-c", "--canon":
			mode = "canon"
		case "-h", "--help":
			fmt.Print(helpText)
			return
		case "-v", "--version":
			fmt.Println(aontu.Version)
			return
		default:
			if strings.HasPrefix(arg, "-") {
				fmt.Fprintf(os.Stderr, "aontu: unknown option %s (try --help)\n", arg)
				os.Exit(2)
			}
			file = arg
		}
	}

	if file != "" {
		src, err := os.ReadFile(file)
		if err != nil {
			fmt.Fprintf(os.Stderr, "aontu: cannot read %s: %v\n", file, err)
			os.Exit(1)
		}
		// Resolve relative @"file" loads against the entry file's dir.
		os.Exit(emit(aontuForFile(file), string(src), mode))
	}

	a := aontu.New()

	if stdinIsPipe() {
		src, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "aontu: cannot read stdin: %v\n", err)
			os.Exit(1)
		}
		os.Exit(emit(a, string(src), mode))
	}

	repl(a, mode, os.Stdin, os.Stdout)
}
