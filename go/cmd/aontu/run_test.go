/* Copyright (c) 2025 Richard Rodger, MIT License */

// Coverage for the command entry: run() drives everything main does
// except the final os.Exit, on in-memory pipes.

package main

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	aontu "github.com/rjrodger/aontu/go"
)

func TestRunHelpVersionAndBadOption(t *testing.T) {
	var out, errw bytes.Buffer
	if code := run([]string{"--help"}, nil, &out, &errw, true); code != 0 ||
		!strings.Contains(out.String(), "Usage: aontu") {
		t.Fatalf("help: %d %q", code, out.String())
	}
	out.Reset()
	if code := run([]string{"-v"}, nil, &out, &errw, true); code != 0 ||
		strings.TrimSpace(out.String()) != aontu.VERSION {
		t.Fatalf("version: %d %q", code, out.String())
	}
	if code := run([]string{"--bogus"}, nil, &out, &errw, true); code != 2 ||
		!strings.Contains(errw.String(), "unknown option") {
		t.Fatalf("bad option: %d %q", code, errw.String())
	}
}

func TestRunFileModes(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "m.aontu")
	if err := os.WriteFile(file, []byte("a:1 b:$.a"), 0644); err != nil {
		t.Fatal(err)
	}
	var out, errw bytes.Buffer
	if code := run([]string{file}, nil, &out, &errw, true); code != 0 ||
		!strings.Contains(out.String(), `"b": 1`) {
		t.Fatalf("file json: %d %q", code, out.String())
	}
	out.Reset()
	if code := run([]string{"-c", file}, nil, &out, &errw, true); code != 0 ||
		strings.TrimSpace(out.String()) != `{"a":1,"b":1}` {
		t.Fatalf("file canon: %d %q", code, out.String())
	}
	if code := run([]string{filepath.Join(dir, "missing.aontu")}, nil, &out, &errw, true); code != 1 ||
		!strings.Contains(errw.String(), "cannot read") {
		t.Fatalf("missing file: %d %q", code, errw.String())
	}
}

func TestRunStdinPipe(t *testing.T) {
	var out, errw bytes.Buffer
	if code := run(nil, strings.NewReader("a:2"), &out, &errw, false); code != 0 ||
		!strings.Contains(out.String(), `"a": 2`) {
		t.Fatalf("stdin pipe: %d %q", code, out.String())
	}
	// A conflicting source reports on stderr with exit 1.
	if code := run(nil, strings.NewReader("a:1 a:2"), &out, &errw, false); code != 1 ||
		errw.Len() == 0 {
		t.Fatalf("stdin conflict: %d %q", code, errw.String())
	}
	// A failing stdin reader reports the read error.
	errw.Reset()
	if code := run(nil, errReader{}, &out, &errw, false); code != 1 ||
		!strings.Contains(errw.String(), "cannot read stdin") {
		t.Fatalf("stdin error: %d %q", code, errw.String())
	}
}

func TestRunReplPath(t *testing.T) {
	var out bytes.Buffer
	code := run(nil, strings.NewReader(":quit\n"), &out, &bytes.Buffer{}, true)
	if code != 0 || !strings.Contains(out.String(), "REPL") {
		t.Fatalf("repl path: %d %q", code, out.String())
	}
}

// The REPL's :help and :json commands, an evaluation error, and a
// failing input reader.
func TestReplCommandsAndErrors(t *testing.T) {
	var out bytes.Buffer
	in := strings.NewReader(":help\n:json\na:1 a:2\n:quit\n")
	repl("canon", false, in, &out)
	s := out.String()
	for _, want := range []string{"Usage: aontu", "json output", "Cannot"} {
		if !strings.Contains(s, want) {
			t.Fatalf("repl output missing %q:\n%s", want, s)
		}
	}

	out.Reset()
	repl("json", false, errReader{}, &out)
	if !strings.Contains(out.String(), "input error") {
		t.Fatalf("scanner error must be reported: %q", out.String())
	}
}

// render: a canon-mode parse error surfaces as an error.
func TestRenderCanonError(t *testing.T) {
	if _, err := render(aontu.New(), "a:number > 0", "canon"); err == nil {
		t.Fatalf("canon parse error must surface")
	}
}

// stdinIsPipe: the live probe, and the stat-failure fallback via a
// closed file swapped in for stdin.
func TestStdinIsPipe(t *testing.T) {
	_ = stdinIsPipe()
	f, err := os.Open(os.DevNull)
	if err != nil {
		t.Fatal(err)
	}
	f.Close()
	old := os.Stdin
	os.Stdin = f
	defer func() { os.Stdin = old }()
	if stdinIsPipe() {
		t.Fatalf("stat failure must report not-a-pipe")
	}
}

type errReader struct{}

func (errReader) Read([]byte) (int, error) { return 0, errors.New("boom") }

// aontuForFile: the Abs-failure fallback (working directory removed
// out from under a relative path).
func TestAontuForFileAbsFailure(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "gone")
	if err := os.Mkdir(dir, 0755); err != nil {
		t.Fatal(err)
	}
	old, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(old)
	os.RemoveAll(dir)
	if a := aontuForFile("x.aontu"); a == nil {
		t.Fatalf("aontuForFile must always build an engine")
	}
}
