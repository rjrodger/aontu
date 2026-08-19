/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// The trust profile (G5 phase 3, docs/trust.md): the Go twin of
// ts/test/trust.test.ts's engine half — include capabilities, the
// include manifest, and the deterministic budgets. The shared contract
// rows are test/spec/include-trust.tsv (both runners); the CLI and LSP
// halves live beside their packages (cmd/aontu, lsp).

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// trustWorld builds a little world to confine: root/{in.aon, nest.aon,
// sub/deep.aon}, with secret.aon OUTSIDE the root and a symlink inside
// pointing at it.
func trustWorld(t *testing.T) (dir, root string) {
	t.Helper()
	dir = t.TempDir()
	root = filepath.Join(dir, "root")
	if err := os.MkdirAll(filepath.Join(root, "sub"), 0o700); err != nil {
		t.Fatal(err)
	}
	files := map[string]string{
		filepath.Join(root, "in.aon"):          "f: 11",
		filepath.Join(root, "nest.aon"):        "@\"in.aon\"\ng: 22",
		filepath.Join(root, "sub", "deep.aon"): "h: 33",
		filepath.Join(dir, "secret.aon"):       `secret: "outside"`,
	}
	for path, src := range files {
		if err := os.WriteFile(path, []byte(src), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Symlink(filepath.Join(dir, "secret.aon"),
		filepath.Join(root, "link.aon")); err != nil {
		t.Fatal(err)
	}
	return dir, root
}

func trustCode(t *testing.T, trust *TrustOptions, src string) string {
	t.Helper()
	a := New()
	a.Trust = trust
	_, err := a.Generate(src)
	if err == nil {
		return ""
	}
	ae, ok := err.(*AontuError)
	if !ok {
		t.Fatalf("expected *AontuError, got %T: %v", err, err)
	}
	return ae.Code
}

func TestTrustNoneDeniesEveryInclude(t *testing.T) {
	_, root := trustWorld(t)
	code := trustCode(t, &TrustOptions{IncludeNone: true},
		`a:@"`+root+`/in.aon"`)
	if "include_denied" != code {
		t.Fatalf("code: %q", code)
	}
}

func TestTrustMemIsTheWholeWorld(t *testing.T) {
	mem := map[string]string{"/virtual/x.aon": "m: 33"}
	a := New()
	a.Trust = &TrustOptions{IncludeMem: mem}
	out, err := a.Generate(`a:@"/virtual/x.aon"`)
	if err != nil {
		t.Fatal(err)
	}
	if m := out.(map[string]any)["a"].(map[string]any); int64(33) != m["m"] {
		t.Fatalf("mem load: %v", out)
	}

	// A miss in the declared set is NOT-FOUND, not denial: the allowed
	// mechanism ran and missed.
	b := New()
	b.Trust = &TrustOptions{IncludeMem: mem}
	if _, err := b.Generate(`a:@"/nope.aon"`); err == nil ||
		!strings.Contains(err.Error(), "not found") {
		t.Fatalf("mem miss: %v", err)
	}
}

func TestTrustRootConfinesBelowTheRoot(t *testing.T) {
	_, root := trustWorld(t)

	a := New()
	a.Trust = &TrustOptions{IncludeRoot: root}
	out, err := a.Generate(`a:@"` + root + `/sub/deep.aon"`)
	if err != nil {
		t.Fatal(err)
	}
	if m := out.(map[string]any)["a"].(map[string]any); int64(33) != m["h"] {
		t.Fatalf("in-root load: %v", out)
	}

	code := trustCode(t, &TrustOptions{IncludeRoot: root},
		`a:@"`+root+`/../secret.aon"`)
	if "include_denied" != code {
		t.Fatalf("escape code: %q", code)
	}
}

// Confinement is realpath-then-prefix-check: a symlink INSIDE the root
// pointing outside it is an escape, not a loophole.
func TestTrustRootDeniesASymlinkEscape(t *testing.T) {
	_, root := trustWorld(t)
	code := trustCode(t, &TrustOptions{IncludeRoot: root},
		`a:@"`+root+`/link.aon"`)
	if "include_denied" != code {
		t.Fatalf("symlink code: %q", code)
	}
}

func TestTrustRootMissIsNotFoundNotDenied(t *testing.T) {
	_, root := trustWorld(t)
	a := New()
	a.Trust = &TrustOptions{IncludeRoot: root}
	if _, err := a.Generate(`a:@"` + root + `/nope.aon"`); err == nil ||
		!strings.Contains(err.Error(), "not found") {
		t.Fatalf("root miss: %v", err)
	}
}

// The include MANIFEST (docs/trust.md): the resolved closure as sorted,
// deduplicated { path, capability } — hermeticity clause 1's "file set"
// made observable.
func TestTrustDepsListsTheSortedDedupedClosure(t *testing.T) {
	_, root := trustWorld(t)
	a := New()
	a.Trust = &TrustOptions{IncludeRoot: root}
	if _, err := a.Parse(
		`a:@"` + root + `/nest.aon" b:@"` + root + `/in.aon" c:@"` + root + `/in.aon"`,
	); err != nil {
		t.Fatal(err)
	}
	want := []IncludeDep{
		{Path: filepath.Join(root, "in.aon"), Capability: "file"},
		{Path: filepath.Join(root, "nest.aon"), Capability: "file"},
	}
	if len(want) != len(a.IncludeDeps) {
		t.Fatalf("deps: %v", a.IncludeDeps)
	}
	for i, dep := range want {
		if dep != a.IncludeDeps[i] {
			t.Fatalf("deps[%d]: want %v got %v", i, dep, a.IncludeDeps[i])
		}
	}
}

func TestTrustDepsIsEmptyWithoutIncludes(t *testing.T) {
	a := New()
	if _, err := a.Parse("x: 1"); err != nil {
		t.Fatal(err)
	}
	if 0 != len(a.IncludeDeps) {
		t.Fatalf("deps: %v", a.IncludeDeps)
	}
}

func TestTrustDepsNamesTheMemCapability(t *testing.T) {
	a := New()
	a.Trust = &TrustOptions{IncludeMem: map[string]string{"/v/x.aon": "m: 1"}}
	if _, err := a.Parse(`a:@"/v/x.aon"`); err != nil {
		t.Fatal(err)
	}
	want := IncludeDep{Path: "/v/x.aon", Capability: "mem"}
	if 1 != len(a.IncludeDeps) || want != a.IncludeDeps[0] {
		t.Fatalf("deps: %v", a.IncludeDeps)
	}
}

// The budgets are integer counts of engine events, deterministic by
// construction; zero means the shared spec constants
// (test/spec/budget.tsv). A chain needing more passes than the budget
// exhausts LOUDLY — budget_passes, never silent truncation — including
// at Passes:1, where the still-refining snapshot must be taken at the
// final pass's entry (there is no earlier pass).
func TestTrustPassesBudgetExhaustsLoudly(t *testing.T) {
	chain := "a1:$.a2 a2:$.a3 a3:$.a4 a4:1"
	code := trustCode(t,
		&TrustOptions{Budget: TrustBudget{Passes: 1}}, chain)
	if "budget_passes" != code {
		t.Fatalf("code: %q", code)
	}
	// The same document under the default budget resolves.
	if "" != trustCode(t, nil, chain) {
		t.Fatal("default budget should resolve the chain")
	}
}

func TestTrustDepthBudgetTripsUnifyCycle(t *testing.T) {
	code := trustCode(t,
		&TrustOptions{Budget: TrustBudget{Depth: 3}}, "a:{b:{c:{d:{e:1}}}}")
	if "unify_cycle" != code {
		t.Fatalf("code: %q", code)
	}
}

// The staged-flip warning window (G5 phase 6): the 'system' posture
// still resolves, but an escape past TrustWarnRoot calls TrustWarn —
// once per resolution, however many times it repeats.
func TestTrustWarnOnEscape(t *testing.T) {
	dir, root := trustWorld(t)
	var warned []string
	a := NewWithBase(root)
	a.TrustWarn = func(kind, path string) { warned = append(warned, kind+" "+path) }
	a.TrustWarnRoot = root
	if _, err := a.Generate(
		`a:@"` + dir + `/secret.aon" b:@"in.aon"`); err != nil {
		t.Fatal(err)
	}
	if 1 != len(warned) || !strings.HasPrefix(warned[0], "escape ") {
		t.Fatalf("warned: %v", warned)
	}
}

// A root that does not exist still confines: realpath falls back to
// the lexical form, and everything real is outside a nonexistent
// directory.
func TestTrustNonexistentRootStillConfines(t *testing.T) {
	_, root := trustWorld(t)
	code := trustCode(t,
		&TrustOptions{IncludeRoot: filepath.Join(root, "no-such-root")},
		`a:@"`+root+`/in.aon"`)
	if "include_denied" != code {
		t.Fatalf("code: %q", code)
	}
}

// The sink accessors are nil-safe by contract (the resolver can run in
// a parse that carries no trust sink at all): the guards are exercised
// directly, the recordNotFound precedent (coverage3_test.go).
func TestTrustSinkNilGuards(t *testing.T) {
	if nil != trustSinkOf(nil) {
		t.Fatal("nil ctx must yield nil sink")
	}
	recordDenied(nil, "p", "none")       // must not panic
	recordDep(nil, "p", "file")          // must not panic
	recordDep(&trustSink{}, "p", "file") // nil deps slice: must not panic
}
