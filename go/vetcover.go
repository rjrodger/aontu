/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE COVERAGE ACCOUNTING (G11 phase 5,
// docs/capability-review/g11-agent-onramp.md; the Go twin of the
// vetCoverage half of ts/src/vet.ts).
//
// The defect this exists for: a schema written with the wildcard every
// neighbouring tool uses -- `{"*": {...}}`, which in aontu is a key
// NAMED `*` and not a template -- constrains nothing, and vet answers
// `valid` over data that violates it. aontu is not wrong there; it was
// asked about a document declaring an entity called `*`. The defect is
// that a check that examined NOTHING and a check that PASSED are the
// same bytes and the same exit code, so an unattended caller reports
// success.
//
// Structural, over the two trees vet already holds, and deliberately
// NOT provenance-based: the question is what the SCHEMA DECLARES about
// the data, which is a property of the two documents rather than of
// the meet that ran. A meet-based reading would also count a value the
// data supplied to itself as "covered", which is the opposite of the
// thing being asked.

package aontu

import (
	"sort"
	"strconv"
	"strings"
)

// coverTemplate is the path segment a spread is spelled with: the same
// character the language spells it with, and one no map key can
// collide with, since a bare `&` cannot be a key.
const coverTemplate = "&"

// VetCoverage is what the check actually examined. Absent from the
// report unless VetOptions.Coverage asked for it, so no existing
// report changes shape and the accounting costs nothing by default --
// `render --coverage` sets both precedents.
//
// Field order is LEXICOGRAPHIC by JSON name, the canonical emitter's
// order (see the report types in vet.go): TypeScript's exactJSON sorts
// keys and Go's encoder writes declaration order, so the two agree
// only if the declaration is already sorted.
type VetCoverage struct {
	// Checked counts data LEAVES a schema declaration constrained.
	// Leaves, not paths: a leaf is where a value lives, and matching a
	// CONTAINER constrains no value. A schema that says only "there is
	// a key called entity" has checked nothing, and this is the number
	// that says so.
	Checked int `json:"checked"`
	// Declared counts the declarations the schema makes under the
	// anchor: a map key, a list index, or a template, at every depth.
	Declared int `json:"declared"`
	// Leaves counts data leaves in all, under CoverageAt when it is
	// given. Checked over this is the ratio a reader wants.
	Leaves int `json:"leaves"`
	// Unchecked names the SHALLOWEST data paths no declaration
	// constrained. Shallowest, as `render --coverage`'s dead report is:
	// a path whose subtree is wholly unconstrained is named once
	// instead of every leaf beneath it.
	Unchecked []string `json:"unchecked"`
	// Unused names the SHALLOWEST declarations no data path met.
	Unused []string `json:"unused"`
	// Vacuous reports that NO data leaf was constrained, over a
	// document that has leaves. The exact condition of the `"*"`
	// failure, and what `--strict-coverage` exits 1 on.
	Vacuous bool `json:"vacuous"`
}

// coverKid is one child of a bag, in the order the walk visits it.
type coverKid struct {
	key string
	val Val
}

// coverKids lists a bag's children: a map's keys in code-point order
// (so both ports walk one order), a list's elements by index.
func coverKids(v Val) []coverKid {
	switch b := v.(type) {
	case *MapVal:
		keys := make([]string, 0, len(b.peg))
		for k := range b.peg {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		out := make([]coverKid, 0, len(keys))
		for _, k := range keys {
			out = append(out, coverKid{key: k, val: b.peg[k]})
		}
		return out
	case *ListVal:
		out := make([]coverKid, 0, len(b.peg))
		for i, m := range b.peg {
			out = append(out, coverKid{key: strconv.Itoa(i), val: m})
		}
		return out
	}
	return nil
}

// coverSpread is the template a bag applies to every child, when it
// has one. A nil or TOP spread is not a declaration: `{"*":{...}}`
// carries no template at all, and reading one there is precisely the
// confusion this phase exists to end.
func coverSpread(v Val) Val {
	var sp Val
	switch b := v.(type) {
	case *MapVal:
		sp = b.spread
	case *ListVal:
		sp = b.spread
	}
	if nil == sp {
		return nil
	}
	if _, isTop := sp.(*TopVal); isTop {
		return nil
	}
	return sp
}

// coverDeclare collects every declaration the schema makes, as a path.
// Named keys and templates alike, at every depth.
//
// NO IDENTITY GUARD, and that is a decision rather than an omission.
// The canonical port's walkVals carries one because it walks values the
// unification MINTED -- findings, conjunct operands, disjunct trials --
// where a node really is reached twice. These two walks descend a
// SETTLED bag through peg and spread alone, and such a tree is a tree:
// a reference resolves by cloning its target, and an alias, a repeated
// spread and a recursive residual were each probed and share nothing.
// The property is already relied on repository-wide, because canon
// walks the same edges with no guard and is computed on every one of
// these values. A guard here would be a branch nothing can take, which
// ADR-002 exists to keep out. Mirrors ts/src/vet.ts.
func coverDeclare(v Val, path []string, out map[string]bool) {
	if tpl := coverSpread(v); nil != tpl {
		at := append(append([]string{}, path...), coverTemplate)
		out[subPathText(at)] = true
		coverDeclare(tpl, at, out)
	}
	for _, kid := range coverKids(v) {
		at := append(append([]string{}, path...), kid.key)
		out[subPathText(at)] = true
		coverDeclare(kid.val, at, out)
	}
}

// coverDataPath is one path in the data, and whether it is a LEAF -- a
// node with no children, which is where a value lives.
type coverDataPath struct {
	path string
	leaf bool
}

func coverWalkData(v Val, path []string, out *[]coverDataPath) {
	kids := coverKids(v)
	if 0 < len(path) {
		*out = append(*out, coverDataPath{
			path: subPathText(path), leaf: 0 == len(kids),
		})
	}
	for _, kid := range kids {
		coverWalkData(kid.val, append(append([]string{}, path...), kid.key), out)
	}
}

// coverMatch walks one data path down the schema, naming the
// declaration that constrains it -- the exact key where the schema has
// one, else the covering template. The empty string means the schema
// declares nothing there.
func coverMatch(anchor Val, segs []string) string {
	// NO NIL GUARD ON `at`, and none on an empty `segs`: `at` starts as
	// the anchor and is only ever reassigned to a non-nil child or
	// template, and coverWalkData never emits the root path, so a call
	// with no segments cannot happen. A guard that cannot fire is dead
	// code, and dead code is what ADR-002 exists to keep out -- a nil
	// reaching the switch below matches no case and falls out through
	// the coverSpread refusal anyway.
	at := anchor
	decl := ""
	for _, seg := range segs {
		var named Val
		switch b := at.(type) {
		case *MapVal:
			named = b.peg[seg]
		case *ListVal:
			if i, err := strconv.Atoi(seg); nil == err &&
				0 <= i && i < len(b.peg) {
				named = b.peg[i]
			}
		}
		if nil != named {
			if "" == decl {
				decl = seg
			} else {
				decl += "." + seg
			}
			at = named
			continue
		}
		tpl := coverSpread(at)
		if nil == tpl {
			return ""
		}
		if "" == decl {
			decl = coverTemplate
		} else {
			decl += "." + coverTemplate
		}
		at = tpl
	}
	return "$." + decl
}

// coverShallowest keeps the SHALLOWEST members of a set of paths: one
// whose ancestor is also in the set is covered by naming the ancestor,
// and naming both is noise. `render --coverage`'s dead report is built
// on the same rule.
func coverShallowest(paths []string) []string {
	held := map[string]bool{}
	for _, p := range paths {
		held[p] = true
	}
	out := []string{}
	for _, p := range paths {
		covered := false
		for at := p; strings.Contains(at, "."); {
			at = at[:strings.LastIndex(at, ".")]
			if held[at] {
				covered = true
				break
			}
		}
		if !covered {
			out = append(out, p)
		}
	}
	sort.Strings(out)
	return out
}

// vetCoverageOf is the accounting itself: what the schema declared,
// what the data holds, and which of each the other met.
func vetCoverageOf(anchor, dataVal Val, coverageAt string) VetCoverage {
	declarations := map[string]bool{}
	coverDeclare(anchor, nil, declarations)

	dataPaths := []coverDataPath{}
	coverWalkData(dataVal, nil, &dataPaths)

	// CoverageAt narrows the DATA side, which is the side a caller
	// gating one subtree is asking about. The schema side follows from
	// it: a declaration is unused only among the data actually
	// measured.
	under := strings.TrimPrefix(strings.TrimPrefix(coverageAt, "$"), ".")
	inScope := func(p string) bool {
		if "" == under {
			return true
		}
		want := "$." + under
		return p == want || strings.HasPrefix(p, want+".")
	}

	used := map[string]bool{}
	unchecked := []string{}
	checked, leaves := 0, 0
	for _, dp := range dataPaths {
		if !inScope(dp.path) {
			continue
		}
		segs := []string{}
		for _, s := range strings.Split(
			strings.TrimPrefix(strings.TrimPrefix(dp.path, "$"), "."), ".") {
			if "" != s {
				segs = append(segs, s)
			}
		}
		decl := coverMatch(anchor, segs)
		if dp.leaf {
			leaves++
		}
		if "" == decl {
			unchecked = append(unchecked, dp.path)
			continue
		}
		used[decl] = true
		if dp.leaf {
			checked++
		}
	}

	// A declaration is met when it constrained a data path, or when a
	// declaration BENEATH it was: `$.a` is used by `$.a.b` meeting
	// `$.a.b`, and reporting the parent as unused would be false.
	unused := []string{}
	for decl := range declarations {
		covered := used[decl]
		if !covered {
			for u := range used {
				if strings.HasPrefix(u, decl+".") {
					covered = true
					break
				}
			}
		}
		if !covered {
			unused = append(unused, decl)
		}
	}

	return VetCoverage{
		Checked:   checked,
		Declared:  len(declarations),
		Leaves:    leaves,
		Unchecked: coverShallowest(unchecked),
		Unused:    coverShallowest(unused),
		// VACUOUS IS ABOUT LEAVES, and a document with none cannot be
		// vacuously checked: `{}` against any schema examined nothing
		// because there was nothing to examine, which is not the
		// failure this reports.
		Vacuous: 0 == checked && 0 < leaves,
	}
}
