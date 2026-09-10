/* Copyright (c) 2025 Richard Rodger, MIT License */

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
		n, ok := ig.skip(key)
		if ok && 0 == counts[key] {
			dropped++
			stmts += n
			continue
		}
		fmt.Fprintf(out, "%s %d\n", key, counts[key])
	}
	if dropped > 0 {
		fmt.Fprintf(os.Stderr,
			"covmerge: dropped %d marked block(s), %d statement(s)\n",
			dropped, stmts)
	}
	if stale := ig.unmatched(); 0 < len(stale) {
		fmt.Fprintf(os.Stderr,
			"covmerge: %d marker(s) matched no block -- stale, or the "+
				"toolchain moved the block boundary:\n", len(stale))
		for _, at := range stale {
			fmt.Fprintf(os.Stderr, "  %s\n", at)
		}
	}
}

const (
	markBlock = "coverage:ignore-block"
	markLine  = "coverage:ignore"
)

type pos struct{ line, col int }

func (a pos) before(b pos) bool {
	return a.line < b.line || (a.line == b.line && a.col <= b.col)
}

type span struct{ lo, hi pos }

func (s span) holds(p pos) bool {
	return s.lo.before(p) && p.before(s.hi)
}

type ignorer struct {
	modPath string // module path from the nearest go.mod
	modDir  string // directory that go.mod lives in
	cache   map[string][]span
	matched map[string]bool
	// where remembers each region's source position, for that report.
	where map[string]string
}

// newIgnorer locates the enclosing module so that profile names
// (import path + "/" + file) can be mapped back to files on disk.
func newIgnorer() *ignorer {
	ig := &ignorer{
		cache:   map[string][]span{},
		matched: map[string]bool{},
		where:   map[string]string{},
	}
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

// add records one marked region and remembers where it was written, so
// a marker that ends up naming no block can be reported by name at the
// end of the run rather than vanishing.
func (ig *ignorer) add(name string, spans *[]span, sp span, at string) {
	key := name + "#" + strconv.Itoa(len(*spans))
	*spans = append(*spans, sp)
	ig.where[key] = at
}

// unmatched lists the source positions of every marker that named no
// block, in file order.
func (ig *ignorer) unmatched() []string {
	out := []string{}
	for name, spans := range ig.cache {
		for i := range spans {
			key := name + "#" + strconv.Itoa(i)
			if !ig.matched[key] {
				out = append(out, ig.where[key])
			}
		}
	}
	sort.Strings(out)
	return out
}

func (ig *ignorer) skip(key string) (int, bool) {
	name, start, stmts, ok := parseKey(key)
	if !ok {
		return 0, false
	}
	for i, s := range ig.spans(name) {
		if s.holds(start) {
			ig.matched[name+"#"+strconv.Itoa(i)] = true
			return stmts, true
		}
	}
	return 0, false
}

func parseKey(key string) (name string, start pos, stmts int, ok bool) {
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
	posOf := func(s string) (pos, bool) {
		dot := strings.IndexByte(s, '.')
		if dot < 0 {
			return pos{}, false
		}
		line, lerr := strconv.Atoi(s[:dot])
		col, cerr := strconv.Atoi(s[dot+1:])
		if nil != lerr || nil != cerr {
			return pos{}, false
		}
		return pos{line, col}, true
	}
	var okStart bool
	if start, okStart = posOf(rng[:comma]); !okStart {
		return
	}
	return name, start, stmts, true
}

// spans parses one source file and returns its marked line regions.
// A file that cannot be found or parsed simply has no markers, so the
// merge degrades to the plain union.
func (ig *ignorer) spans(name string) []span {
	if s, hit := ig.cache[name]; hit {
		return s
	}
	var spans []span
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, ig.source(name), nil, parser.ParseComments)
	at := func(p token.Pos) pos {
		q := fset.Position(p)
		return pos{q.Line, q.Column}
	}
	if err == nil {
		reach := map[int]span{}
		note := map[int]string{}
		record := func(n ast.Node, sp span) {
			lo := at(n.Pos()).line
			if cur, seen := reach[lo]; !seen || cur.hi.before(sp.hi) {
				reach[lo] = sp
				note[lo] = fset.Position(n.Pos()).String()
			}
		}
		ast.Inspect(f, func(n ast.Node) bool {
			switch t := n.(type) {
			case *ast.IfStmt:
				record(n, span{at(n.Pos()), at(t.Body.Rbrace)})
			case *ast.ForStmt:
				record(n, span{at(n.Pos()), at(t.Body.Rbrace)})
			case *ast.RangeStmt:
				record(n, span{at(n.Pos()), at(t.Body.Rbrace)})
			case *ast.FuncDecl:
				if nil != t.Body {
					record(n, span{at(n.Pos()), at(t.Body.Rbrace)})
				}
			case *ast.SwitchStmt, *ast.TypeSwitchStmt, *ast.SelectStmt:
				p := at(n.Pos())
				record(n, span{p, pos{p.line, 1 << 30}})
			default:
				switch n.(type) {
				case ast.Stmt, ast.Decl:
					record(n, span{at(n.Pos()), at(n.End())})
				}
			}
			return true
		})
		for _, cg := range f.Comments {
			for _, c := range cg.List {
				txt := strings.TrimSpace(strings.TrimPrefix(c.Text, "//"))
				line := at(c.Pos()).line
				switch {
				case marked(txt, markBlock):
					// The statement starting on the nearest line below,
					// taken WHOLE -- else chain included. That is what
					// this marker is for: it is written above a
					// construct precisely to take it as a unit.
					best := -1
					for lo := range reach {
						if lo > line && (best < 0 || lo < best) {
							best = lo
						}
					}
					if best > 0 {
						ig.add(name, &spans, reach[best], note[best])
					}
				case marked(txt, markLine):
					// A marker that sits on no statement reaches
					// nothing, and says so at the end of the run rather
					// than silently excusing nothing.
					if sp, hit := reach[line]; hit {
						ig.add(name, &spans, sp, note[line])
					} else {
						ig.add(name, &spans, span{}, fset.Position(c.Pos()).String())
					}
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
