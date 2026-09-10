/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu


import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const modSource = "name: string\nport: *8080 | integer\n"

func modWorld(t *testing.T, store string) (dir, main, hash, cache string) {
	t.Helper()
	dir = t.TempDir()
	cache = filepath.Join(dir, "cache")

	v, _ := New().Unify(modSource)
	hash = CanonHash(v)

	moddir := filepath.Join(dir, "aontu_meta", "vendor", "corp.example", "schemas", "service@1")
	if "cache" == store {
		moddir = filepath.Join(cache, hash)
	}
	if err := os.MkdirAll(moddir, 0o755); nil != err {
		t.Fatal(err)
	}
	write(t, filepath.Join(moddir, "mod.aon"),
		"mod: {path: \"corp.example/schemas/service\", main: \"service.aon\"}\n")
	write(t, filepath.Join(moddir, "service.aon"), modSource)

	write(t, filepath.Join(dir, "mod.aon"), "mod: {path: \"corp.example/app\"}\n")
	main = filepath.Join(dir, "main.aon")
	write(t, main,
		"svc: @\"corp.example/schemas/service@1#"+hash+"\"\nsvc: name: \"auth\"\n")

	return dir, main, hash, cache
}

func write(t *testing.T, file, src string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(file), 0o755); nil != err {
		t.Fatal(err)
	}
	if err := os.WriteFile(file, []byte(src), 0o600); nil != err {
		t.Fatal(err)
	}
}

func modGen(t *testing.T, a *Aontu, main string) (any, error) {
	t.Helper()
	return a.Generate("x: @\"" + srcPath(main) + "\"\n")
}

func TestModCacheIsContentAddressed(t *testing.T) {
	_, main, _, cache := modWorld(t, "cache")
	a := New()
	a.ModCache = cache
	if _, err := modGen(t, a, main); nil != err {
		t.Fatalf("cache resolution: %v", err)
	}
}

func TestModCacheNotConsultedUnderRoot(t *testing.T) {
	// A confined evaluation sees the project's own aontu_meta/vendor/ and
	// nothing else: the cache lives outside any root (docs/trust.md).
	dir, main, _, cache := modWorld(t, "cache")
	a := New()
	a.ModCache = cache
	a.Trust = &TrustOptions{IncludeRoot: dir}
	if _, err := modGen(t, a, main); nil == err ||
		!strings.Contains(err.Error(), "module not fetched:") {
		t.Fatalf("want module not fetched, got %v", err)
	}
}

func TestModCacheDefaults(t *testing.T) {
	// With no host-named cache the platform's own is used: XDG first,
	// then the home directory, then none at all — a host with no home
	// has no cache, which is a MISS rather than a failure.
	dir, main, _, cache := modWorld(t, "cache")

	xdg := filepath.Join(dir, "xdg")
	if err := os.MkdirAll(filepath.Join(xdg, "aontu"), 0o755); nil != err {
		t.Fatal(err)
	}
	if err := os.Rename(cache, filepath.Join(xdg, "aontu", "mod")); nil != err {
		t.Fatal(err)
	}
	t.Setenv("XDG_CACHE_HOME", xdg)
	if _, err := modGen(t, New(), main); nil != err {
		t.Fatalf("xdg cache: %v", err)
	}

	home := filepath.Join(dir, "home")
	if err := os.MkdirAll(filepath.Join(home, ".cache", "aontu"), 0o755); nil != err {
		t.Fatal(err)
	}
	if err := os.Rename(filepath.Join(xdg, "aontu", "mod"),
		filepath.Join(home, ".cache", "aontu", "mod")); nil != err {
		t.Fatal(err)
	}
	t.Setenv("XDG_CACHE_HOME", "")
	t.Setenv("HOME", home)
	if _, err := modGen(t, New(), main); nil != err {
		t.Fatalf("home cache: %v", err)
	}

	t.Setenv("HOME", "")
	if _, err := modGen(t, New(), main); nil == err ||
		!strings.Contains(err.Error(), "module not fetched:") {
		t.Fatalf("want module not fetched, got %v", err)
	}
}

func TestModCacheDirRule(t *testing.T) {
	env := func(vars map[string]string) func(string) string {
		return func(key string) string { return vars[key] }
	}
	for _, c := range []struct {
		name, goos string
		vars       map[string]string
		want       string
	}{
		// The explicit override wins on every platform.
		{"xdg on posix", "linux",
			map[string]string{"XDG_CACHE_HOME": "/x", "HOME": "/h"},
			filepath.Join("/x", "aontu", "mod")},
		{"xdg on windows", "windows",
			map[string]string{"XDG_CACHE_HOME": "/x", "LOCALAPPDATA": "C:/L"},
			filepath.Join("/x", "aontu", "mod")},

		{"windows honours HOME over LOCALAPPDATA", "windows",
			map[string]string{"LOCALAPPDATA": "C:/L", "HOME": "/h"},
			filepath.Join("/h", ".cache", "aontu", "mod")},
		{"posix ignores LOCALAPPDATA", "linux",
			map[string]string{"LOCALAPPDATA": "C:/L", "HOME": "/h"},
			filepath.Join("/h", ".cache", "aontu", "mod")},

		// And LOCALAPPDATA is the platform default BENEATH both, which
		// is the whole addition: Windows sets neither of the two above
		// by default.
		{"windows falls back to LOCALAPPDATA", "windows",
			map[string]string{"LOCALAPPDATA": "C:/L"},
			filepath.Join("C:/L", "aontu", "mod")},
		{"posix has no such fallback", "linux",
			map[string]string{"LOCALAPPDATA": "C:/L"},
			""},

		// Nowhere to put one is a MISS, not a failure.
		{"nowhere", "windows", map[string]string{}, ""},
	} {
		if got := modCacheDirFor(c.goos, env(c.vars)); c.want != got {
			t.Fatalf("%s: want %q, got %q", c.name, c.want, got)
		}
	}

	// And the exported entry point is that rule on THIS host, not a
	// second spelling of it.
	t.Setenv("XDG_CACHE_HOME", "/x")
	if want := filepath.Join("/x", "aontu", "mod"); want != ModCacheDir() {
		t.Fatalf("ModCacheDir: %q", ModCacheDir())
	}
}

func TestModVendorOutsideRootIsDenied(t *testing.T) {
	// Confinement is about what may be READ (docs/trust.md), and a
	// project root found by walking UP can sit above the confinement
	// root — so the vendor store it names is outside, and reading it
	// would be the escape the root exists to refuse.
	dir, main, _, _ := modWorld(t, "vendor")
	sub := filepath.Join(dir, "sub")
	if err := os.MkdirAll(sub, 0o755); nil != err {
		t.Fatal(err)
	}
	data, err := os.ReadFile(main)
	if nil != err {
		t.Fatal(err)
	}
	inner := filepath.Join(sub, "main.aon")
	write(t, inner, string(data))

	a := New()
	a.Trust = &TrustOptions{IncludeRoot: sub}
	if _, err := modGen(t, a, inner); nil == err ||
		!strings.Contains(err.Error(), "include denied:") {
		t.Fatalf("want include denied, got %v", err)
	}
}

func TestModDepthIsBounded(t *testing.T) {
	_, main, _, _ := modWorld(t, "vendor")
	a := New()
	a.modDepth = moduleMaxDepth
	if _, err := modGen(t, a, main); nil == err ||
		!strings.Contains(err.Error(), "module depth:") {
		t.Fatalf("want module depth, got %v", err)
	}
}

func TestModuleMainShapes(t *testing.T) {
	dir := t.TempDir()
	for _, src := range []string{
		"1\n",
		"other: 1\n",
		"mod: 1\n",
		"mod: {main: 1}\n",
		"mod: {main: string}\n", // ... nor is a kind
		"mod: {main: \"\"}\n",   // ... and an empty name is no name
	} {
		file := filepath.Join(dir, "mod.aon")
		write(t, file, src)
		if got := moduleMain(file, 0); "main.aon" != got {
			t.Fatalf("want the default entry for %q, got %q", src, got)
		}
	}

	write(t, filepath.Join(dir, "mod.aon"), "mod: {main: \"other.aon\"}\n")
	if got := moduleMain(filepath.Join(dir, "mod.aon"), 0); "other.aon" != got {
		t.Fatalf("want the declared entry, got %q", got)
	}
}

func TestValidateModulePathEmptyElement(t *testing.T) {
	if got := validateModulePath("corp.example//x"); "an element is empty" != got {
		t.Fatalf("empty element: %q", got)
	}
	if got := validateModulePath(""); "an element is empty" != got {
		t.Fatalf("empty path: %q", got)
	}

	// And the rules the shared rows DO drive, asserted here as the
	// function contract rather than as engine behaviour.
	if got := validateModulePath("corp.example/x"); "" != got {
		t.Fatalf("valid path refused: %q", got)
	}
	if got := validateModulePath("corp.example/../x"); `an element begins or ends with "."` != got {
		t.Fatalf("traversal: %q", got)
	}
	if got := validateModulePath("corp.example/nul"); "an element is a reserved device name" != got {
		t.Fatalf("reserved: %q", got)
	}
}
