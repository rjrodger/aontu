/* Copyright (c) 2025 Richard Rodger, MIT License */

package main

import (
	"strings"
	"testing"

	aontu "github.com/rjrodger/aontu/go"
)

func TestRenderJSON(t *testing.T) {
	out, err := render(aontu.New(), "a:1 b:$.a", "json")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out, `"a": 1`) || !strings.Contains(out, `"b": 1`) {
		t.Fatalf("unexpected json output:\n%s", out)
	}
}

func TestRenderCanon(t *testing.T) {
	out, err := render(aontu.New(), "a:*1|number", "canon")
	if err != nil {
		t.Fatal(err)
	}
	if out != `{"a":*1|number}` {
		t.Fatalf("canon: %q", out)
	}
}

func TestRenderError(t *testing.T) {
	_, err := render(aontu.New(), "a:1 a:2", "json")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "Cannot unify value: 2 with value: 1") {
		t.Fatalf("error: %v", err)
	}
}

func TestReplSession(t *testing.T) {
	in := strings.NewReader("a:1 b:$.a\n:canon\na:1|2\n:quit\n")
	var out strings.Builder
	repl(aontu.New(), "json", in, &out)
	s := out.String()
	if !strings.Contains(s, `"b": 1`) {
		t.Fatalf("repl json output missing:\n%s", s)
	}
	if !strings.Contains(s, `{"a":1|2}`) {
		t.Fatalf("repl canon output missing:\n%s", s)
	}
}

func TestReplEmptyAndUnknown(t *testing.T) {
	in := strings.NewReader("\n:nope\n")
	var out strings.Builder
	repl(aontu.New(), "json", in, &out)
	if !strings.Contains(out.String(), "unknown command") {
		t.Fatalf("expected unknown command notice:\n%s", out.String())
	}
}
