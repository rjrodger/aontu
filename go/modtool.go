/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// MODULE TOOLING (G6 phase 3, the Go side of ts/src/mod-tool.ts): the
// LOCAL half — `aontu mod tidy` and `aontu mod vendor`.
//
// Evaluation never touches the network, and neither does this: tidy
// resolves versions and rewrites the lockfile from what is already in
// the local stores, and vendor materialises the locked closure into the
// project. Fetching and publishing are the network half, and are not in
// this build (see the register).
//
// MINIMUM VERSION SELECTION, not a solver: each module declares the
// MINIMUM version of each dependency it needs, and the selected version
// is the maximum of those minima over the closure. Deterministic
// without backtracking — the lockfile CONFIRMS the resolution rather
// than determining it, which is why a tidy run re-runs to the same
// bytes.

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

// ModLock is one entry of the lockfile, and of a tidy report. Field
// order is LEXICOGRAPHIC, the canonical emitter's order.
type ModLock struct {
	// Canon is the canon-hash of the module as it is in the local store.
	Canon string `json:"canon"`
	// Mod is the module path and major, as an import spells it.
	Mod string `json:"mod"`
	// Oci is the registry digest, carried over from a previous
	// lockfile. Empty when nothing has ever fetched this module: the
	// OCI pin is the registry's word, and only a fetch can hear it.
	Oci string `json:"oci"`
	// V is the selected version.
	V string `json:"v"`
}

// ModTidyReport is the result of `aontu mod tidy`.
type ModTidyReport struct {
	Lock    []ModLock `json:"lock"`
	Missing []string  `json:"missing"`
	Verdict string    `json:"verdict"`
}

// ModVendorReport is the result of `aontu mod vendor`.
type ModVendorReport struct {
	Missing  []string `json:"missing"`
	Vendored []string `json:"vendored"`
	Verdict  string   `json:"verdict"`
}

// VersionCompare is numeric-dotted version order: `1.10.0` is above
// `1.9.0`, which STRING order gets wrong, and that is the whole reason
// this is not a `<` on the text. A part that is not a number compares
// as text, after every number — a pre-release tag is below no version
// and above none. Mirrors versionCompare in ts/src/mod-tool.ts.
func VersionCompare(a, b string) int {
	ap := strings.Split(a, ".")
	bp := strings.Split(b, ".")
	n := len(ap)
	if len(bp) > n {
		n = len(bp)
	}
	for i := 0; i < n; i++ {
		// A part the shorter version does not have is ZERO, so `1.2`
		// and `1.2.0` are the same version -- which is what everyone
		// means by them, and what a lockfile rewritten from either must
		// agree on.
		x, y := "0", "0"
		if i < len(ap) {
			x = ap[i]
		}
		if i < len(bp) {
			y = bp[i]
		}
		if x == y {
			continue
		}
		xn, xerr := strconv.Atoi(x)
		yn, yerr := strconv.Atoi(y)
		if nil == xerr && nil == yerr {
			if xn < yn {
				return -1
			}
			return 1
		}
		if (nil == xerr) != (nil == yerr) {
			if nil == xerr {
				return -1
			}
			return 1
		}
		if x < y {
			return -1
		}
		return 1
	}
	return 0
}

// modEval is one standalone evaluation of a source: what it means, what
// its meaning hashes to, and its canonical form.
type modEval struct {
	gen   any
	hash  string
	canon string
}

func evalMod(src, path string) modEval {
	a := NewWithBase(filepath.Dir(path))
	a.File = path
	v, _ := a.Unify(src)
	gen, _ := v.Gen(&Ctx{collect: true})
	return modEval{gen: gen, hash: CanonHash(v), canon: v.Canon()}
}

// declaredDeps is the `dep` block a module file declares: import string
// -> version.
func declaredDeps(file string) map[string]string {
	data, err := os.ReadFile(file)
	if nil != err {
		return map[string]string{}
	}

	out := map[string]string{}
	gen, ok := evalMod(toValidSource(string(data)), file).gen.(map[string]any)
	if !ok {
		return out
	}
	dep, ok := gen["dep"].(map[string]any)
	if !ok {
		return out
	}
	for key, val := range dep {
		entry, ok := val.(map[string]any)
		if !ok {
			continue
		}
		if v, ok := entry["v"].(string); ok && "" != v {
			out[key] = v
		}
	}
	return out
}

// modStoreDir is the directory a module is in, in the local stores: the
// project's vendor tree first, then the cache under the hash the
// lockfile pins.
func modStoreDir(root string, ref ModuleRef, hash, cache string) string {
	stores := []string{moduleDir(filepath.Join(root, "aon_vendor"), ref)}
	if "" != cache && "" != hash {
		stores = append(stores, filepath.Join(cache, hash))
	}
	for _, d := range stores {
		if _, err := os.Stat(filepath.Join(d, "mod.aon")); nil == err {
			return d
		}
	}
	return ""
}

// readLock is the lockfile's entries, as written.
func readLock(root string) map[string]ModLock {
	data, err := os.ReadFile(filepath.Join(root, "mod-lock.aon"))
	if nil != err {
		return map[string]ModLock{}
	}

	var lock struct {
		Lock map[string]struct {
			Canon string `json:"canon"`
			Oci   string `json:"oci"`
			V     string `json:"v"`
		} `json:"lock"`
	}
	if err := json.Unmarshal([]byte(lockJSON(string(data))), &lock); nil != err {
		return map[string]ModLock{}
	}

	out := map[string]ModLock{}
	for mod, e := range lock.Lock {
		out[mod] = ModLock{Mod: mod, Canon: e.Canon, Oci: e.Oci, V: e.V}
	}
	return out
}

// lockHeader is the generated-file header. A lockfile is
// machine-written, and the file says so where an editor will see it.
const lockHeader = "# mod-lock.aon (generated by `aontu mod tidy`; do not edit)\n"

// LockText is the lockfile TEXT: canonical Aontu, one line, keys
// sorted. Built as source and canonicalised by the ENGINE rather than
// printed by hand, so "canonical form" means what the language means by
// it and cannot drift from it.
func LockText(entries []ModLock) string {
	parts := make([]string, 0, len(entries))
	for _, e := range entries {
		parts = append(parts,
			quote(e.Mod)+":{"+
				"\"canon\":"+quote(e.Canon)+","+
				"\"oci\":"+quote(e.Oci)+","+
				"\"v\":"+quote(e.V)+"}")
	}
	return evalMod("{\"lock\":{"+strings.Join(parts, ",")+"}}", "mod-lock.aon").canon
}

func quote(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}

// ModTidy resolves the closure by MVS and rewrites the lockfile.
func ModTidy(root, cache string) ModTidyReport {
	previous := readLock(root)
	selected := map[string]string{}
	missing := map[string]bool{}

	// The closure, breadth-first from the project's own declarations. A
	// module already selected at a version at least as high contributes
	// nothing new, which is what makes this terminate without a cycle
	// check: the selected version only ever rises.
	frontier := declaredDeps(filepath.Join(root, "mod.aon"))
	for 0 < len(frontier) {
		next := map[string]string{}

		mods := make([]string, 0, len(frontier))
		for mod := range frontier {
			mods = append(mods, mod)
		}
		sort.Strings(mods)

		for _, mod := range mods {
			want := frontier[mod]
			if have, ok := selected[mod]; ok && 0 <= VersionCompare(have, want) {
				continue
			}
			selected[mod] = want

			ref, ok := parseModuleRef(mod)
			if !ok {
				// A dependency key that is not a module path names
				// nothing this resolver can find, which is the same
				// answer as a module that is not there.
				missing[mod] = true
				continue
			}

			dir := modStoreDir(root, ref, previous[mod].Canon, cache)
			if "" == dir {
				missing[mod] = true
				continue
			}

			for key, v := range declaredDeps(filepath.Join(dir, "mod.aon")) {
				if bid, ok := next[key]; !ok || 0 > VersionCompare(bid, v) {
					next[key] = v
				}
			}
		}

		frontier = next
	}

	mods := make([]string, 0, len(selected))
	for mod := range selected {
		mods = append(mods, mod)
	}
	sort.Strings(mods)

	lock := []ModLock{}
	for _, mod := range mods {
		if missing[mod] {
			continue
		}
		ref, _ := parseModuleRef(mod)
		dir := modStoreDir(root, ref, previous[mod].Canon, cache)
		main := filepath.Join(dir, moduleMain(filepath.Join(dir, "mod.aon"), 0))
		hash := ""
		if data, err := os.ReadFile(main); nil == err {
			// RECOMPUTED, never carried over: the pin is what the module
			// in this store MEANS, and a tidy that copied the old hash
			// forward would pin what it used to mean.
			hash = evalMod(toValidSource(string(data)), main).hash
		}
		lock = append(lock, ModLock{
			Mod:   mod,
			V:     selected[mod],
			Canon: hash,
			// Carried over: the OCI digest is the registry's word about
			// the bytes it served, and nothing local can hear it.
			Oci: previous[mod].Oci,
		})
	}

	miss := make([]string, 0, len(missing))
	for mod := range missing {
		miss = append(miss, mod)
	}
	sort.Strings(miss)

	if 0 == len(miss) {
		_ = os.WriteFile(filepath.Join(root, "mod-lock.aon"),
			[]byte(lockHeader+LockText(lock)+"\n"), 0o600)
	}

	verdict := "ok"
	if 0 < len(miss) {
		verdict = "missing"
	}
	return ModTidyReport{Verdict: verdict, Lock: lock, Missing: miss}
}

// ModVendor materialises the locked closure into `aon_vendor/`.
func ModVendor(root, cache string) ModVendorReport {
	locked := readLock(root)

	mods := make([]string, 0, len(locked))
	for mod := range locked {
		mods = append(mods, mod)
	}
	sort.Strings(mods)

	vendored := []string{}
	missing := []string{}

	for _, mod := range mods {
		ref, ok := parseModuleRef(mod)
		if !ok {
			missing = append(missing, mod)
			continue
		}
		from := modStoreDir(root, ref, locked[mod].Canon, cache)
		if "" == from {
			missing = append(missing, mod)
			continue
		}
		to := moduleDir(filepath.Join(root, "aon_vendor"), ref)
		if from != to {
			if err := copyTree(from, to); nil != err { //coverage:ignore a readable store copies
				missing = append(missing, mod)
				continue
			}
		}
		vendored = append(vendored, mod)
	}

	verdict := "ok"
	if 0 < len(missing) {
		verdict = "missing"
	}
	return ModVendorReport{Verdict: verdict, Vendored: vendored, Missing: missing}
}

// copyTree copies a whole module directory. Modules are source trees —
// that is what an OCI layer holds — so this walks rather than reading
// one file.
func copyTree(from, to string) error {
	if err := os.MkdirAll(to, 0o755); nil != err { //coverage:ignore a writable project makes dirs
		return err
	}
	entries, err := os.ReadDir(from)
	if nil != err { //coverage:ignore the caller stat'd this directory
		return err
	}
	for _, e := range entries {
		src := filepath.Join(from, e.Name())
		dst := filepath.Join(to, e.Name())
		if e.IsDir() {
			if err := copyTree(src, dst); nil != err { //coverage:ignore see above
				return err
			}
			continue
		}
		if err := copyFile(src, dst); nil != err { //coverage:ignore see above
			return err
		}
	}
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if nil != err { //coverage:ignore the directory listing named this file
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if nil != err { //coverage:ignore a writable project creates files
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}
