/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu


import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

type ModuleRef struct {
	Path string
	Major int
	// Hash is the inline canon-hash pin, if the import froze one.
	Hash string
}

var moduleRe = regexp.MustCompile(
	`^([a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+(?:/[A-Za-z0-9._-]+)*)@(\d+)(?:#(aon1-[A-Za-z0-9_-]+))?$`)

// parseModuleRef answers the module an import string names, or false.
func parseModuleRef(spec string) (ModuleRef, bool) {
	m := moduleRe.FindStringSubmatch(spec)
	if nil == m {
		return ModuleRef{}, false
	}
	major, err := strconv.Atoi(m[2])
	if nil != err { //coverage:ignore the pattern matched \d+
		return ModuleRef{}, false
	}
	return ModuleRef{Path: m[1], Major: major, Hash: m[3]}, true
}

const (
	moduleMaxPath  = 512
	moduleMaxElems = 32
)

// Windows refuses these as file names whatever the extension, so a
// module path containing one cannot be materialised there at all. The
// check is on the element up to its first dot, which is where Windows
// stops looking too.
var reservedElems = map[string]bool{
	"con": true, "prn": true, "aux": true, "nul": true,
	"com1": true, "com2": true, "com3": true, "com4": true, "com5": true,
	"com6": true, "com7": true, "com8": true, "com9": true,
	"lpt1": true, "lpt2": true, "lpt3": true, "lpt4": true, "lpt5": true,
	"lpt6": true, "lpt7": true, "lpt8": true, "lpt9": true,
}

func validateModulePath(path string) string {
	if moduleMaxPath < len(path) {
		return "longer than " + strconv.Itoa(moduleMaxPath) + " characters"
	}

	elems := strings.Split(path, "/")
	if moduleMaxElems < len(elems) {
		return "more than " + strconv.Itoa(moduleMaxElems) + " elements"
	}

	for _, elem := range elems {
		if "" == elem {
			return "an element is empty"
		}
		if strings.HasPrefix(elem, ".") || strings.HasSuffix(elem, ".") {
			return `an element begins or ends with "."`
		}
		if reservedElems[strings.ToLower(strings.Split(elem, ".")[0])] {
			return "an element is a reserved device name"
		}
	}

	return ""
}

func escapeElem(elem string) string {
	var b strings.Builder
	for _, r := range elem {
		if 'A' <= r && r <= 'Z' {
			b.WriteByte('!')
			b.WriteRune(r + ('a' - 'A'))
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

func moduleDir(store string, ref ModuleRef) string {
	parts := []string{store}
	for _, elem := range strings.Split(ref.Path, "/") {
		parts = append(parts, escapeElem(elem))
	}
	return filepath.Join(parts...) + "@" + strconv.Itoa(ref.Major)
}

func projectRoots(from string) []string {
	roots := []string{}
	dir := from
	for {
		if _, err := os.Stat(filepath.Join(dir, "mod.aon")); nil == err {
			roots = append(roots, dir)
		}
		up := filepath.Dir(dir)
		if up == dir {
			if 0 == len(roots) {
				return []string{from}
			}
			return roots
		}
		dir = up
	}
}

func lockJSON(text string) string {
	out := []string{}
	for _, line := range strings.Split(text, "\n") {
		if strings.HasPrefix(strings.TrimLeft(line, " \t"), "#") {
			continue
		}
		out = append(out, line)
	}
	return strings.Join(out, "\n")
}

func lockHash(root string, ref ModuleRef) string {
	data, err := os.ReadFile(filepath.Join(root, "aontu_meta", "mod-lock.aon"))
	if nil != err {
		return ""
	}

	var lock struct {
		Lock map[string]struct {
			Canon string `json:"canon"`
		} `json:"lock"`
	}
	if err := json.Unmarshal([]byte(lockJSON(string(data))), &lock); nil != err {
		return ""
	}

	return lock.Lock[ref.Path+"@"+strconv.Itoa(ref.Major)].Canon
}

const moduleMaxDepth = 16

// moduleResult is a resolved module, or the refusal that stands in its
// place. Both refusals are reported as parse-stage errors, exactly as a
// denied include is: a bare-member module import must not vanish in the
// merge and leave a plausible, silently-partial document.
type moduleResult struct {
	Full string
	Src  string
	Code string
	Msg  string
}

// resolveModule resolves one module import against the local stores.
func resolveModule(ref ModuleRef, fromDir string, cache string, depth int) moduleResult {
	name := ref.Path + "@" + strconv.Itoa(ref.Major)

	if bad := validateModulePath(ref.Path); "" != bad {
		return moduleResult{
			Code: "module_path",
			Msg:  "module path: " + name + " (" + bad + ")",
		}
	}

	if moduleMaxDepth <= depth {
		return moduleResult{
			Code: "module_depth",
			Msg: "module depth: " + name +
				" (verification nested past " + strconv.Itoa(moduleMaxDepth) + ")",
		}
	}

	// EVERY enclosing project, innermost first (see projectRoots): a
	// vendored module is a project inside a project, and its nested
	// imports have to reach the tree the consumer vendored them into.
	roots := projectRoots(fromDir)
	expect := ref.Hash
	if "" == expect {
		// The PIN comes from the first lockfile that names this import.
		// A vendored module usually ships none, so that is the
		// consumer's -- which is right: the consumer's lock is what its
		// build is pinned to.
		for _, r := range roots {
			if h := lockHash(r, ref); "" != h {
				expect = h
				break
			}
		}
	}

	stores := []string{}
	for _, r := range roots {
		stores = append(stores, moduleDir(filepath.Join(r, "aontu_meta", "vendor"), ref))
	}
	if "" != cache && "" != expect {
		// Content-addressed: the cache is keyed by the hash, so a cache
		// hit is already the right MEANING before anything is read.
		stores = append(stores, filepath.Join(cache, expect))
	}

	dir := ""
	for _, d := range stores {
		if _, err := os.Stat(filepath.Join(d, "mod.aon")); nil == err {
			dir = d
			break
		}
	}
	if "" == dir {
		return moduleResult{
			Code: "module_missing",
			Msg:  "module not fetched: " + name + " (run: aontu mod get)",
		}
	}

	full := filepath.Join(dir, moduleMain(filepath.Join(dir, "mod.aon"), depth))
	data, err := os.ReadFile(full)
	if nil != err {
		return moduleResult{
			Code: "module_missing",
			Msg:  "module not fetched: " + name + " (run: aontu mod get)",
		}
	}
	src := toValidSource(string(data))

	if "" != expect {
		// VERIFICATION IS ALWAYS LOCAL. The registry's annotation is
		// advisory; what decides is the hash of the module as it is on
		// this machine, recomputed now.
		got := moduleHash(src, full, depth)
		if got != expect {
			return moduleResult{
				Code: "module_integrity",
				Msg: "module integrity: " + name +
					" expected " + expect + " got " + got,
			}
		}
	}

	return moduleResult{Full: full, Src: src}
}

// moduleMain is the `mod.main` a module file declares, or the default
// entry name. The module file is ORDINARY AONTU, read by the language
// itself — the toolchain dogfooding its own evaluator rather than
// pattern-matching its own syntax with a regexp.
func moduleMain(file string, depth int) string {
	const defaultMain = "main.aon"

	data, err := os.ReadFile(file)
	if nil != err { //coverage:ignore the caller stat'd this file
		return defaultMain
	}

	a := NewWithBase(filepath.Dir(file))
	a.modDepth = depth + 1
	a.File = file
	v, _ := a.Unify(toValidSource(string(data)))
	m, ok := v.(*MapVal)
	if !ok {
		return defaultMain
	}
	mod, ok := m.peg["mod"].(*MapVal)
	if !ok {
		return defaultMain
	}
	sv, ok := mod.peg["main"].(*ScalarVal)
	if !ok || KindString != sv.kind {
		return defaultMain
	}
	main, _ := sv.peg.(string)
	if "" == main {
		return defaultMain
	}
	return main
}

func moduleHash(src string, path string, depth int) string {
	a := NewWithBase(filepath.Dir(path))
	a.modDepth = depth + 1
	a.File = path
	v, _ := a.Unify(src)
	if nil == v { //coverage:ignore Unify always answers a Val
		return ""
	}
	return CanonHash(v)
}
