/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// MODULE TOOLING (G6 phase 3, modtool.go). The two local commands are
// FILE OPERATIONS, which the shared suite has no mode for, so their
// behaviour is proved per port: this file against the package API, and
// go/cmd/aontu/mod_test.go against the command. The twin is
// ts/test/mod.test.ts's `mod-tool` block, and the two commands were
// diffed byte-for-byte over the same worlds.

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// modtoolProject is a project declaring dep, plus whatever else the
// caller puts in its directory.
func modtoolProject(t *testing.T, dep string, extra func(dir string)) string {
	t.Helper()
	dir := t.TempDir()
	write(t, filepath.Join(dir, "mod.aon"),
		"mod: {path: \"corp.example/app\"}\ndep: {"+dep+"}\n")
	if nil != extra {
		extra(dir)
	}
	return dir
}

func modtoolVendor(t *testing.T, dir, path string, files map[string]string) {
	t.Helper()
	p := filepath.Join(append([]string{dir, "aon_vendor"},
		strings.Split(path, "/")...)...)
	if err := os.MkdirAll(p, 0o755); nil != err {
		t.Fatal(err)
	}
	for name, src := range files {
		write(t, filepath.Join(p, name), src)
	}
}

func lockLine(t *testing.T, root string) string {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(root, "mod-lock.aon"))
	if nil != err {
		t.Fatal(err)
	}
	lines := strings.Split(string(data), "\n")
	if 2 > len(lines) {
		t.Fatalf("no canonical line: %q", string(data))
	}
	return lines[1]
}

func TestModVersionCompareBothDirections(t *testing.T) {
	// Numeric order, not string order: `1.10.0` is above `1.9.0`. Both
	// directions of every rule, because MVS reads the comparison from
	// whichever side the frontier happens to hold, and a comparison
	// that answered only one way round would still pass a one-sided
	// test.
	cases := []struct {
		a, b string
		want int
	}{
		{"1.10.0", "1.9.0", 1},
		{"1.9.0", "1.10.0", -1},
		{"1.2.0", "1.2.0", 0},
		// A part the shorter version does not have is ZERO.
		{"1.2", "1.2.0", 0},
		{"1.2.0", "1.2", 0},
		// A part that is not a number sorts as text, AFTER every
		// number: a pre-release tag is below no version and above none.
		{"1.2.0", "1.2.rc", -1},
		{"1.2.rc", "1.2.0", 1},
		{"1.2.rc", "1.2.beta", 1},
		{"1.2.beta", "1.2.rc", -1},
	}
	for _, c := range cases {
		if got := VersionCompare(c.a, c.b); c.want != got {
			t.Fatalf("VersionCompare(%q,%q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestModTidyWritesTheLockfile(t *testing.T) {
	dir := modtoolProject(t, "\"corp.example/schemas/service@1\": {v: \"1.4.2\"}",
		func(d string) {
			modtoolVendor(t, d, "corp.example/schemas/service@1", map[string]string{
				"mod.aon": "mod: {path: \"corp.example/schemas/service\", " +
					"main: \"service.aon\"}\n",
				"service.aon": modSource,
			})
		})

	r := ModTidy(dir, "")
	if "ok" != r.Verdict || 1 != len(r.Lock) {
		t.Fatalf("verdict %q lock %v", r.Verdict, r.Lock)
	}

	// A HEADER the file's own reader skips, then ONE canonical line —
	// sorted keys, no spaces — which is also the JSON the resolver
	// reads a pin back from.
	v, _ := New().Unify(modSource)
	want := "{\"lock\":{\"corp.example/schemas/service@1\":{\"canon\":\"" +
		CanonHash(v) + "\",\"oci\":\"\",\"v\":\"1.4.2\"}}}"
	if got := lockLine(t, dir); want != got {
		t.Fatalf("lock line\n got %s\nwant %s", got, want)
	}
}

func TestModTidyWithNoModuleFileLocksNothing(t *testing.T) {
	// A directory that declares nothing depends on nothing. The
	// lockfile is still written, and says so: an empty closure is a
	// resolved closure.
	dir := t.TempDir()
	r := ModTidy(dir, "")
	if "ok" != r.Verdict || 0 != len(r.Lock) {
		t.Fatalf("verdict %q lock %v", r.Verdict, r.Lock)
	}
	if got := lockLine(t, dir); "{\"lock\":{}}" != got {
		t.Fatalf("lock line %q", got)
	}
}

func TestModTidyMissingModule(t *testing.T) {
	// Two ways a declaration names nothing a store can hold: a module
	// path with nothing behind it, and a key the router would not call
	// a module at all. Both are reported the same way — there is no
	// third answer to give — and NO lockfile is written, because a
	// partial lock claims a closure that was never resolved.
	for _, dep := range []string{"corp.example/absent@1", "not-a-module"} {
		dir := modtoolProject(t, "\""+dep+"\": {v: \"1.0.0\"}", nil)
		r := ModTidy(dir, "")
		if "missing" != r.Verdict || 1 != len(r.Missing) || dep != r.Missing[0] {
			t.Fatalf("%s: verdict %q missing %v", dep, r.Verdict, r.Missing)
		}
		if _, err := os.Stat(filepath.Join(dir, "mod-lock.aon")); nil == err {
			t.Fatalf("%s: lockfile written", dep)
		}
	}
}

func TestModTidySelectsMaxOfMinima(t *testing.T) {
	// The two ways MVS discards a bid. WITHIN a round: `s` and `t` both
	// ask for geo, and the higher ask wins. ACROSS rounds: the project
	// itself asks for geo at 2.0.0, so the 1.x asks arriving in the next
	// round are already below what is selected and change nothing.
	// Selected versions only rise, which is why this terminates without
	// a cycle check.
	dir := modtoolProject(t,
		"\"corp.example/s@1\": {v: \"1.0.0\"}, \"corp.example/t@1\": {v: \"1.0.0\"}, "+
			"\"corp.example/geo@1\": {v: \"2.0.0\"}",
		func(d string) {
			modtoolVendor(t, d, "corp.example/s@1", map[string]string{
				"mod.aon": "mod: {path: \"corp.example/s\"}\n" +
					"dep: {\"corp.example/geo@1\": {v: \"1.5.0\"}}\n",
				"main.aon": modSource,
			})
			modtoolVendor(t, d, "corp.example/t@1", map[string]string{
				"mod.aon": "mod: {path: \"corp.example/t\"}\n" +
					"dep: {\"corp.example/geo@1\": {v: \"1.1.0\"}}\n",
				"main.aon": modSource,
			})
			modtoolVendor(t, d, "corp.example/geo@1", map[string]string{
				"mod.aon":  "mod: {path: \"corp.example/geo\"}\n",
				"main.aon": "region: string\n",
			})
		})

	r := ModTidy(dir, "")
	if "ok" != r.Verdict {
		t.Fatalf("verdict %q missing %v", r.Verdict, r.Missing)
	}
	found := false
	for _, e := range r.Lock {
		if "corp.example/geo@1" == e.Mod {
			found = true
			if "2.0.0" != e.V {
				t.Fatalf("geo at %q, want 2.0.0", e.V)
			}
		}
	}
	if !found {
		t.Fatalf("geo not locked: %v", r.Lock)
	}
}

func TestModTidyRecomputesCanonAndCarriesOci(t *testing.T) {
	// The two pins have different owners. `canon` is what the module in
	// the store MEANS, so it is recomputed — a tidy that carried the old
	// one forward would pin what the module used to mean. `oci` is the
	// registry's word about the bytes it served, which nothing local can
	// hear, so it survives untouched.
	dir := modtoolProject(t, "\"corp.example/schemas/service@1\": {v: \"1.4.2\"}",
		func(d string) {
			modtoolVendor(t, d, "corp.example/schemas/service@1", map[string]string{
				"mod.aon": "mod: {path: \"corp.example/schemas/service\", " +
					"main: \"service.aon\"}\n",
				"service.aon": modSource,
			})
			write(t, filepath.Join(d, "mod-lock.aon"), lockHeader+
				"{\"lock\":{\"corp.example/schemas/service@1\":{\"canon\":\"aon1-stale\","+
				"\"oci\":\"sha256:6b86\",\"v\":\"1.0.0\"}}}\n")
		})

	r := ModTidy(dir, "")
	v, _ := New().Unify(modSource)
	if CanonHash(v) != r.Lock[0].Canon {
		t.Fatalf("canon %q", r.Lock[0].Canon)
	}
	if "sha256:6b86" != r.Lock[0].Oci {
		t.Fatalf("oci %q", r.Lock[0].Oci)
	}
}

func TestModTidyPinsNothingWithoutAnEntryFile(t *testing.T) {
	// A module file naming an entry that is not there has no meaning to
	// hash. The empty pin is the honest answer: the module resolved, and
	// nothing about it was verifiable.
	dir := modtoolProject(t, "\"corp.example/s@1\": {v: \"1.0.0\"}", func(d string) {
		modtoolVendor(t, d, "corp.example/s@1", map[string]string{
			"mod.aon": "mod: {path: \"corp.example/s\", main: \"gone.aon\"}\n",
		})
	})
	r := ModTidy(dir, "")
	if "ok" != r.Verdict || "" != r.Lock[0].Canon {
		t.Fatalf("verdict %q canon %q", r.Verdict, r.Lock[0].Canon)
	}
}

func TestModDeclaredDepsIgnoresWhatIsNotADepBlock(t *testing.T) {
	// Every shape a `dep` block can fail to be. A module file is
	// ordinary Aontu, so it can say anything; what it does not say is
	// not a dependency, and reading it is not an error to report.
	for _, src := range []string{
		"1\n",                             // not a map at all
		"mod: {path: \"a.b/c\"}\n",        // no dep block
		"dep: 1\n",                        // dep is not a map
		"dep: {\"a.b/c@1\": 1}\n",         // an entry that is not a map
		"dep: {\"a.b/c@1\": {}}\n",        // an entry declaring no version
		"dep: {\"a.b/c@1\": {v: \"\"}}\n", // an empty version
	} {
		dir := t.TempDir()
		file := filepath.Join(dir, "mod.aon")
		write(t, file, src)
		if deps := declaredDeps(file); 0 != len(deps) {
			t.Fatalf("%q gave %v", src, deps)
		}
	}
	// And a file that is not there at all.
	if deps := declaredDeps(filepath.Join(t.TempDir(), "gone.aon")); 0 != len(deps) {
		t.Fatalf("missing file gave %v", deps)
	}
}

func TestModReadLockAnswersNothingForWhatItCannotRead(t *testing.T) {
	// A lockfile is GENERATED, so a file that is not what the generator
	// writes is not a file to guess at: it pins nothing, and a tidy will
	// replace it.
	for _, text := range []string{
		"this is not the canonical line\n",
		"{\"other\":{}}\n",
	} {
		dir := t.TempDir()
		write(t, filepath.Join(dir, "mod-lock.aon"), text)
		if lock := readLock(dir); 0 != len(lock) {
			t.Fatalf("%q gave %v", text, lock)
		}
	}
	if lock := readLock(t.TempDir()); 0 != len(lock) {
		t.Fatalf("no lockfile gave %v", lock)
	}
}

func TestModVendorMaterialisesTheWholeTree(t *testing.T) {
	// From the CACHE, keyed by the hash the lockfile pins: that is what
	// content-addressed means, and it is why `vendor` needs a lockfile
	// while `tidy` needs a store. A module is a TREE, not an entry file
	// — that is what an OCI layer holds — so nested directories come
	// across too.
	dir := t.TempDir()
	cache := filepath.Join(dir, "cache")
	v, _ := New().Unify(modSource)
	hash := CanonHash(v)

	store := filepath.Join(cache, hash)
	if err := os.MkdirAll(filepath.Join(store, "part"), 0o755); nil != err {
		t.Fatal(err)
	}
	write(t, filepath.Join(store, "mod.aon"),
		"mod: {path: \"corp.example/schemas/service\", main: \"service.aon\"}\n")
	write(t, filepath.Join(store, "service.aon"), modSource)
	write(t, filepath.Join(store, "part", "extra.aon"), "extra: true\n")

	write(t, filepath.Join(dir, "mod-lock.aon"), lockHeader+
		"{\"lock\":{\"corp.example/schemas/service@1\":{\"canon\":\""+hash+
		"\",\"oci\":\"\",\"v\":\"1.4.2\"}}}\n")

	r := ModVendor(dir, cache)
	if "ok" != r.Verdict || 1 != len(r.Vendored) {
		t.Fatalf("verdict %q vendored %v missing %v", r.Verdict, r.Vendored, r.Missing)
	}

	to := filepath.Join(dir, "aon_vendor", "corp.example", "schemas", "service@1")
	for name, want := range map[string]string{
		"service.aon": modSource,
		"part" + string(os.PathSeparator) + "extra.aon": "extra: true\n",
	} {
		data, err := os.ReadFile(filepath.Join(to, name))
		if nil != err || want != string(data) {
			t.Fatalf("%s: %v %q", name, err, string(data))
		}
	}

	// Vendoring again finds the module in the vendor tree, which is
	// where it already is: a store that is its own destination is left
	// alone rather than copied onto itself.
	if r2 := ModVendor(dir, cache); "ok" != r2.Verdict {
		t.Fatalf("second vendor: %q", r2.Verdict)
	}
}

func TestModVendorReportsWhatNoStoreHas(t *testing.T) {
	// Two failures with the same answer: a key that does not route as a
	// module path, and one that routes to nothing any store holds.
	dir := t.TempDir()
	write(t, filepath.Join(dir, "mod-lock.aon"),
		"{\"lock\":{\"corp.example/absent@1\":{\"canon\":\"aon1-x\",\"oci\":\"\",\"v\":\"1\"},"+
			"\"not-a-module\":{\"canon\":\"y\",\"oci\":\"\",\"v\":\"1\"}}}\n")
	r := ModVendor(dir, "")
	if "missing" != r.Verdict || 2 != len(r.Missing) {
		t.Fatalf("verdict %q missing %v", r.Verdict, r.Missing)
	}
	if "corp.example/absent@1" != r.Missing[0] || "not-a-module" != r.Missing[1] {
		t.Fatalf("missing %v", r.Missing)
	}
}
