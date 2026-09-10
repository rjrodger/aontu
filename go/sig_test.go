
package aontu


import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSigDeclIsTheSharedDeclaration(t *testing.T) {
	shared, err := os.ReadFile(filepath.Join("..", "test", "spec", "signature.tsv"))
	if nil != err {
		t.Fatal(err)
	}
	norm := func(s string) string { return strings.ReplaceAll(s, "\r\n", "\n") }
	if norm(string(shared)) != norm(sigDeclText) {
		t.Fatal("go/sigdecl.txt does not match " +
			"test/spec/signature.tsv — run `make sig`")
	}
}

func TestSigEveryDeclarationLineRoundTrips(t *testing.T) {
	for _, rawline := range strings.Split(sigDeclText, "\n") {
		line := strings.TrimSpace(rawline)
		if "" == line || strings.HasPrefix(line, "#") {
			continue
		}
		sig, err := parseSigLine(line)
		if nil != err {
			t.Fatalf("parse: %v", err)
		}
		if got := renderSig(sig); got != line {
			t.Fatalf("round-trip: %q => %q", line, got)
		}
	}
}

func TestSigDeclaredNamesAreTheBuiltinNames(t *testing.T) {
	for name := range funcSig {
		if _, ok := funcArity[name]; !ok {
			t.Fatalf("declared but not a builtin: %s", name)
		}
	}
	for name := range funcArity {
		if _, ok := funcSig[name]; !ok {
			t.Fatalf("builtin but not declared: %s", name)
		}
	}
}

func TestSigMalformedDeclarationsAreErrors(t *testing.T) {
	bad := []string{
		"",
		"upper",
		"upper(s: string)",
		"upper(bogus s: string) : string",
		"upper(s: string) : string trailing",
	}
	for _, line := range bad {
		if _, err := parseSigLine(line); nil == err {
			t.Fatalf("accepted malformed declaration: %q", line)
		}
	}
	if _, err := parseSigText("upper(s: string) : string\nupper(s: string) : string\n"); nil == err {
		t.Fatal("accepted duplicate declaration")
	}
	// A malformed line propagates out of the whole-text loader too.
	if _, err := parseSigText("nope\n"); nil == err {
		t.Fatal("accepted malformed text")
	}
}

func TestSigExportedAccessors(t *testing.T) {
	// The exported render surface the LSP consumes; cross-package
	// calls do not count toward this package's ADR-002 floor, so the
	// accessors are pinned here.
	if got := FuncSignature("pack"); "pack(d: map|list, template t: any) : map" != got {
		t.Fatalf("pack signature: %q", got)
	}
	if "" != FuncSignature("notafunc") {
		t.Fatal("notafunc has no signature")
	}
	params := FuncSignatureParams("pack")
	if 2 != len(params) || "d: map|list" != params[0] || "template t: any" != params[1] {
		t.Fatalf("pack params: %v", params)
	}
	if nil != FuncSignatureParams("notafunc") {
		t.Fatal("notafunc has no params")
	}
}
