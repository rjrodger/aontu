/* Copyright (c) 2025 Richard Rodger, MIT License */

// Command covmerge unions two or more Go text coverage profiles
// (mode: set) into one, so the unit-test profile and the GOCOVERDIR
// integration-run profile of the command binaries can be reported as a
// single figure. Naive concatenation double-counts overlapping blocks;
// this keys each block and ORs the counts.
//
// It also drops blocks marked unreachable in the source, so ADR-002's
// 100 % floor measures code a test could actually run. See the
// coverage-ignore markers section below.
//
//	go run ./scripts/covmerge a.out b.out > merged.out
package main

import (
	"bufio"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: covmerge profile.out [profile.out ...]")
		os.Exit(2)
	}
	counts := map[string]int{}
	var order []string
	for _, path := range os.Args[1:] {
		f, err := os.Open(path)
		if err != nil {
			fmt.Fprintln(os.Stderr, "covmerge:", err)
			os.Exit(1)
		}
		sc := bufio.NewScanner(f)
		for sc.Scan() {
			line := sc.Text()
			if strings.HasPrefix(line, "mode:") || line == "" {
				continue
			}
			// FILE:START,END NUMSTMTS COUNT — split off the count.
			sp := strings.LastIndexByte(line, ' ')
			if sp < 0 {
				continue
			}
			key := line[:sp]
			cnt := 0
			fmt.Sscanf(line[sp+1:], "%d", &cnt)
			// Record the key on FIRST sight, not on first increase: a
			// block that is 0 in every profile never raises the max, so
			// keying the dedupe off `counts[key] < cnt` appended it once
			// per input file and emitted it twice, which `go tool cover
			// -func` then counted twice.
			if _, seen := counts[key]; !seen {
				order = append(order, key)
				counts[key] = cnt
			}
			if counts[key] < cnt {
				counts[key] = cnt
			}
		}
		f.Close()
	}

	sort.Strings(order)
	ig := newIgnorer()
	dropped, stmts := 0, 0
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()
	fmt.Fprintln(out, "mode: set")
	for _, key := range order {
		// A marker only ever excuses UNCOVERED code. A covered block is
		// always emitted, even inside a marked region: markers are
		// coarse (a whole if/else chain, say), and dropping executed
		// statements would shrink the denominator on real, tested code
		// and quietly overstate the figure.
		if counts[key] == 0 {
			if n, ok := ig.skip(key); ok {
				dropped++
				stmts += n
				continue
			}
		}
		fmt.Fprintf(out, "%s %d\n", key, counts[key])
	}
	if dropped > 0 {
		fmt.Fprintf(os.Stderr,
			"covmerge: dropped %d marked block(s), %d statement(s)\n",
			dropped, stmts)
	}
}

// --------------------------------------------------------------------
// coverage-ignore markers
// --------------------------------------------------------------------
//
// Some statements cannot be executed by any test: a defensive `return
// nil` under an exhaustive switch, the error arm of a library call that
// only fails on a programming mistake this package cannot make, a
// literal main(). ADR-002 keeps them (deleting a guard on an external
// contract is worse than excluding it) but requires each to carry a
// written justification, so they are excluded from the denominator
// rather than quietly tolerated. Two markers do it:
//
//	n, ok := new(big.Int).SetString(s, 10)
//	if !ok { //coverage:ignore the regexp already vetted the digits
//		return false
//	}
//
// marks the LINE the comment sits on. `go tool cover` opens an if-body
// block at the `{` — i.e. ON the `if` line — so a marker there drops
// the body. A reason may follow the marker and is ignored by the
// matcher, but not by review: a marker without one is a defect.
//
//	//coverage:ignore-block plugin registration cannot fail here
//	if err := j.Use(path.Path, nil); err != nil {
//		return nil, err
//	}
//
// marks the WHOLE statement that starts on the next line of code, from
// its first line to its last. Use it when the marker cannot sit on the
// line itself, or when a multi-line statement must go as a unit.
//
// A profile block is dropped when its start line falls inside a marked
// region, or when its whole line span does.
const (
	markBlock = "coverage:ignore-block"
	markLine  = "coverage:ignore"
)

type lineSpan struct{ lo, hi int }

type ignorer struct {
	modPath string // module path from the nearest go.mod
	modDir  string // directory that go.mod lives in
	cache   map[string][]lineSpan
}

// newIgnorer locates the enclosing module so that profile names
// (import path + "/" + file) can be mapped back to files on disk.
func newIgnorer() *ignorer {
	ig := &ignorer{cache: map[string][]lineSpan{}}
	dir, err := os.Getwd()
	if err != nil {
		return ig
	}
	for {
		if b, err := os.ReadFile(filepath.Join(dir, "go.mod")); err == nil {
			for _, ln := range strings.Split(string(b), "\n") {
				if ln = strings.TrimSpace(ln); strings.HasPrefix(ln, "module ") {
					ig.modPath = strings.Trim(strings.TrimSpace(ln[len("module "):]), "\"")
					ig.modDir = dir
					break
				}
			}
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return ig
}

// skip reports whether a profile key ("FILE:sl.sc,el.ec NUMSTMTS")
// names a marked block, and how many statements it carries.
func (ig *ignorer) skip(key string) (int, bool) {
	name, start, end, stmts, ok := parseKey(key)
	if !ok {
		return 0, false
	}
	for _, s := range ig.spans(name) {
		if (s.lo <= start && start <= s.hi) ||
			(s.lo <= start && end <= s.hi) {
			return stmts, true
		}
	}
	return 0, false
}

// parseKey splits "path/to/file.go:12.34,56.7 2" into its parts.
func parseKey(key string) (name string, start, end, stmts int, ok bool) {
	sp := strings.LastIndexByte(key, ' ')
	if sp < 0 {
		return
	}
	stmts, err := strconv.Atoi(key[sp+1:])
	if err != nil {
		return
	}
	colon := strings.LastIndexByte(key[:sp], ':')
	if colon < 0 {
		return
	}
	name = key[:colon]
	rng := key[colon+1 : sp]
	comma := strings.IndexByte(rng, ',')
	if comma < 0 {
		return
	}
	lineOf := func(s string) (int, bool) {
		if dot := strings.IndexByte(s, '.'); dot >= 0 {
			s = s[:dot]
		}
		n, err := strconv.Atoi(s)
		return n, err == nil
	}
	var ok1, ok2 bool
	if start, ok1 = lineOf(rng[:comma]); !ok1 {
		return
	}
	if end, ok2 = lineOf(rng[comma+1:]); !ok2 {
		return
	}
	return name, start, end, stmts, true
}

// spans parses one source file and returns its marked line regions.
// A file that cannot be found or parsed simply has no markers, so the
// merge degrades to the plain union.
func (ig *ignorer) spans(name string) []lineSpan {
	if s, hit := ig.cache[name]; hit {
		return s
	}
	var spans []lineSpan
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, ig.source(name), nil, parser.ParseComments)
	if err == nil {
		// Widest statement or declaration beginning on each line, so a
		// block marker above `if ... {` covers the whole if.
		starts := map[int]lineSpan{}
		ast.Inspect(f, func(n ast.Node) bool {
			switch n.(type) {
			case ast.Stmt, ast.Decl:
				lo := fset.Position(n.Pos()).Line
				hi := fset.Position(n.End()).Line
				if cur, seen := starts[lo]; !seen || hi > cur.hi {
					starts[lo] = lineSpan{lo, hi}
				}
			}
			return true
		})
		for _, cg := range f.Comments {
			for _, c := range cg.List {
				txt := strings.TrimSpace(strings.TrimPrefix(c.Text, "//"))
				line := fset.Position(c.Pos()).Line
				switch {
				case marked(txt, markBlock):
					// The statement starting on the nearest line below.
					best := lineSpan{-1, -1}
					for lo, s := range starts {
						if lo > line && (best.lo < 0 || lo < best.lo) {
							best = s
						}
					}
					if best.lo > 0 {
						spans = append(spans, best)
					}
				case marked(txt, markLine):
					spans = append(spans, lineSpan{line, line})
				}
			}
		}
	}
	ig.cache[name] = spans
	return spans
}

// marked reports whether a comment body opens with the given marker,
// optionally followed by a free-text reason.
func marked(txt, mark string) bool {
	if !strings.HasPrefix(txt, mark) {
		return false
	}
	rest := txt[len(mark):]
	return rest == "" || rest[0] == ' ' || rest[0] == '\t' || rest[0] == ':'
}

// source maps a coverage-profile file name to a path on disk. Profile
// names are "<import path>/<file>"; inside the module that is
// "<module dir>/<file relative to it>". Anything else is passed through
// as a path.
func (ig *ignorer) source(name string) string {
	if ig.modPath != "" && strings.HasPrefix(name, ig.modPath+"/") {
		rel := strings.TrimPrefix(name, ig.modPath+"/")
		return filepath.Join(ig.modDir, filepath.FromSlash(rel))
	}
	return filepath.FromSlash(name)
}
