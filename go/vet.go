/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// The validation verb: check a data document against a schema document
// and return a MACHINE-READABLE report. The Go port of ts/src/vet.ts
// (G2 phase 4, docs/capability-review/g2-validation-verb.md), engine
// only — the command line, its renderers and its exit codes live in
// cmd/aontu, as they do in ts/src/cli.ts.
//
// Two properties of the engine shape everything here, and both are the
// canonical implementation's, probed rather than assumed:
//
//   - A CONTRADICTION surfaces as a NilVal in the unified tree, so
//     conflict findings come from a tree walk (walk.go), plus the nils
//     that never made it into the tree.
//   - INCOMPLETENESS does not. `{name:"auth"}` against
//     `{name:string, port:integer}` unifies cleanly and leaves
//     `port:integer` standing — no nil, no error. It surfaces only when
//     something tries to GENERATE, which is why vet runs a generate
//     check in an isolated collect context and reads the
//     `incomplete`-class errors out of it. The two verdicts the report
//     distinguishes therefore come from two different mechanisms.
//
// WHAT IS IN CROSS-PORT PARITY. Everything the report carries except
// the message: verdict, truncation, and each finding's code, class,
// severity, path, sites (file, row, column, role, value) and the
// expected/actual/note the constraint algebra attaches. The message is
// the nil's HEADLINE, which the two ports already hold to byte parity
// (NilVal.Headline, val.go) — but it stays prose, and prose is not
// contractual across the ports (test/spec/divergent.tsv), so the shared
// suite's goldens exclude it.

import (
	"sort"
	"strconv"
	"strings"
)

// Verdicts. The report says which of four states the run reached, and
// the caller maps them to exit codes (cmd/aontu).
const (
	VetValid      = "valid"
	VetInvalid    = "invalid"
	VetIncomplete = "incomplete"
	VetError      = "error"
)

// Roles. A site is either in the data document or in the schema, and
// which one it is comes from PROVENANCE — the url stamped on each tree
// before they meet (walk.go) — not from the primary/secondary heuristic
// NilVal uses, which is source-order reasoning within ONE document and
// says nothing useful when one side is a schema and the other is data.
const (
	VetRoleData   = "data"
	VetRoleSchema = "schema"
)

const (
	vetMaxErrors = 20
	vetSchemaURL = "schema"
	vetDataURL   = "data"
)

// VetSite locates one side of a finding. The JSON field order is
// LEXICOGRAPHIC because the canonical emitter sorts object keys
// (exactJSON, ts/src/exactjson.ts) while Go's encoder writes struct
// fields in declaration order: the two agree only if the declaration is
// already sorted.
type VetSite struct {
	Col int `json:"col"`
	// File is a POINTER because a site may have NO file: a value
	// unification minted belongs to neither document. TypeScript spells
	// that as an undefined url, which its emitter drops, so a plain
	// string field here would write `"file": ""` where the canonical
	// report writes no key at all.
	File  *string `json:"file,omitempty"`
	Role  string  `json:"role"`
	Row   int     `json:"row"`
	Value string  `json:"value"`
}

// VetFinding is one thing that does not hold. The optional fields are
// POINTERS so an absent one is omitted and a present-but-empty one is
// written: `omitempty` on a plain string cannot tell those apart, and
// the canonical emitter drops only what is undefined.
type VetFinding struct {
	Actual   *string   `json:"actual,omitempty"`
	Class    string    `json:"class"`
	Code     string    `json:"code"`
	Expected *string   `json:"expected,omitempty"`
	Message  string    `json:"message"`
	Note     *string   `json:"note,omitempty"`
	Path     string    `json:"path"`
	Severity string    `json:"severity"`
	Sites    []VetSite `json:"sites"`
}

// VetReport is the whole answer: one verdict, and the findings behind
// it (capped, with truncation declared rather than silent).
type VetReport struct {
	Findings  []VetFinding `json:"findings"`
	Truncated bool         `json:"truncated"`
	Verdict   string       `json:"verdict"`
}

// VetOptions are the run's knobs. A zero value is the default run: the
// whole schema as the anchor, open, strict about residue, capped at 20
// findings, with the documents labelled "schema" and "data".
type VetOptions struct {
	At      string // validate against this path of the schema
	Closed  bool   // close() the anchor for this run
	Partial bool   // residue is not a failure
	// MaxErrors caps the finding list; 0 (and anything below it) means
	// the default of 20. The canonical engine can tell an EXPLICIT zero
	// from an absent option and would report nothing for it; a Go zero
	// value cannot, and a cap of zero is not a thing to ask for -- the
	// command line refuses it too (`--max-errors 0` is a usage error in
	// both ports).
	MaxErrors int
	SchemaURL string // provenance label for schema sites
	DataURL   string // provenance label for data sites
}

// vetSources maps a stamped url to the text its offsets index into.
// Go carries a byte offset per value and computes row/column on demand
// (rowCol, val.go), so a two-document run has to know WHICH document to
// count newlines in — the one thing TypeScript gets for free by storing
// row and column on every site at parse time.
type vetSources map[string]string

// siteOf projects one operand into a report site. `secondary` is the
// only operand that can be absent — a `closed` or an incomplete finding
// has one side, a two-site conflict has both — so this is the one
// nullable input, and every Val that does arrive carries a position and
// a canon.
func siteOf(v Val, dataURL string, sources vetSources) *VetSite {
	if v == nil {
		return nil
	}
	// Named or not, and nothing in between. TypeScript's url has a third
	// state — the empty string, which its freshly minted values carry
	// while parsed ones carry undefined — but no value a report can
	// reach is in it: the two documents are stamped before they meet, so
	// an unnamed site is one unification minted, and that reports no
	// file rather than an empty one.
	var file *string
	name := v.srcurl()
	if "" != name {
		file = &name
	}
	role := VetRoleSchema
	if nil != file && dataURL == *file {
		role = VetRoleData
	}
	// An unstamped value (one minted with no source name) is counted
	// against the data text, which is the same fallback the error
	// frames make with ctx.src.
	src, ok := sources[name]
	if !ok {
		src = sources[dataURL]
	}
	// An UNSITED value reports -1:-1 rather than a coordinate it does
	// not have. The parser gives no position to a junction (neither port
	// does), so `a: 1|2` meeting `a: 3` has one operand that was never
	// anywhere in particular; rowCol's own answer for that is row 1
	// column 1, which is a place, and the wrong one. TypeScript says -1
	// because an unset site starts there (ts/src/site.ts).
	row, col := -1, -1
	if 0 <= v.pos() {
		row, col = rowCol(src, v.pos())
	}
	return &VetSite{Col: col, File: file, Role: role, Row: row, Value: v.Canon()}
}

// sitesOf lists the data site first — it is the thing to fix — then the
// schema site. The underlying NilVal fields are untouched: this is a
// report-layer projection, so the existing error.tsv assertions do not
// move.
func sitesOf(n *NilVal, dataURL string, sources vetSources) []VetSite {
	sites := []VetSite{}
	// The nil ITSELF when it has no operands: a failure raised about a
	// CONSTRUCT rather than about a failed meet -- a lossy integer
	// literal, say -- carries none, and reporting it about itself is
	// what ctx.adderr already does for the same reason.
	primary := n.primary
	if nil == primary {
		primary = n
	}
	if s := siteOf(primary, dataURL, sources); s != nil {
		sites = append(sites, *s)
	}
	if s := siteOf(n.secondary, dataURL, sources); s != nil {
		sites = append(sites, *s)
	}

	// Partitioned rather than sorted: which of the two NilVal operands
	// is primary follows source order within one document, which says
	// nothing useful across two.
	out := make([]VetSite, 0, len(sites))
	for _, s := range sites {
		if VetRoleData == s.Role {
			out = append(out, s)
		}
	}
	for _, s := range sites {
		if VetRoleData != s.Role {
			out = append(out, s)
		}
	}
	return out
}

func findingOf(n *NilVal, dataURL string, sources vetSources) VetFinding {
	f := VetFinding{
		Class:    n.Class(),
		Code:     n.why,
		Message:  n.Headline(),
		Path:     n.Path(),
		Severity: "error",
		Sites:    sitesOf(n, dataURL, sources),
	}

	// expected/actual are the admissible-alternatives contract, and the
	// constraint algebra already produces them: G1's atoms attach the
	// normalised residual and the offending value, and `must` attaches
	// the author's message. Read them where they are rather than
	// re-deriving them here.
	if v, ok := n.details["expected"]; ok {
		f.Expected = &v
	}
	if v, ok := n.details["actual"]; ok {
		f.Actual = &v
	}
	if v, ok := n.details["message"]; ok {
		f.Note = &v
	}

	return f
}

// vetOrderPad zero-pads row and column so lexicographic order is numeric
// order.
const vetOrderPad = 9

// vetOrderKey sorts findings BY VET, not by the walk. The underlying walk
// iterates a bag's keys and the two hosts disagree about their order —
// `10:… 9:…` yields ["9","10"] in JavaScript, which hoists integer-like
// keys, against Go's insertion order (ts/src/keyorder.ts exists for
// exactly this) — so an unsorted report could never be in cross-port
// parity.
//
// The order is by data site (file, row, column), then code, then path,
// carried in ONE key string rather than a cascade of comparisons: a
// cascade needs a test per tie-breaker to stay honest; a key needs
// none, and cannot disagree with itself. NUL joins the fields because
// no field can contain one.
//
// The walk index is the last field, which makes every key unique and
// the sort total: two findings can otherwise share everything else the
// key carries, and then the answer would come from the sort algorithm
// rather than from the data. With the index appended, ties keep walk
// order in both ports by construction.
func vetOrderKey(f VetFinding, index int) string {
	site := VetSite{}
	if 0 < len(f.Sites) {
		site = f.Sites[0]
	}
	file := ""
	if nil != site.File {
		file = *site.File
	}
	pad := func(n int) string {
		s := strconv.Itoa(n)
		if len(s) < vetOrderPad {
			s = strings.Repeat("0", vetOrderPad-len(s)) + s
		}
		return s
	}
	return strings.Join([]string{
		file, pad(site.Row), pad(site.Col), f.Code, f.Path, pad(index),
	}, "\x00")
}

// anchorAt walks the evaluated schema to the anchor path. `$` and
// `$.a.b` are both accepted, as is the bare `a.b` a shell is likely to
// hand over unquoted.
func anchorAt(root Val, at string) Val {
	trimmed := strings.TrimPrefix(at, "$")
	node := root
	for _, part := range strings.Split(trimmed, ".") {
		if "" == part {
			continue
		}
		switch n := node.(type) {
		case *MapVal:
			child, ok := n.peg[part]
			if !ok {
				return nil
			}
			node = child
		case *ListVal:
			i, err := strconv.Atoi(part)
			if err != nil || i < 0 || len(n.peg) <= i {
				return nil
			}
			node = n.peg[i]
		default:
			return nil
		}
	}
	return node
}

// Vet validates dataSrc against schemaSrc.
//
// Never fails for findings: a contradiction in the data is DATA, and
// the caller gets a report. An unusable schema is a VERDICT (`error`)
// rather than an error return for the same reason — "the schema is
// broken" is a fact the agent loop needs to branch on, not an
// exceptional condition — which leaves nothing for an error return to
// carry, so there is none.
//
// A package-level function rather than a method, mirroring the
// canonical export: vet takes its two documents from the caller, not
// from the filesystem, so an Aontu's base directory has nothing to say
// about them.
func Vet(schemaSrc, dataSrc string, opts *VetOptions) VetReport {
	options := VetOptions{}
	if opts != nil {
		options = *opts
	}
	schemaURL := vetSchemaURL
	if "" != options.SchemaURL {
		schemaURL = options.SchemaURL
	}
	dataURL := vetDataURL
	if "" != options.DataURL {
		dataURL = options.DataURL
	}
	maxErrors := vetMaxErrors
	if 0 < options.MaxErrors {
		maxErrors = options.MaxErrors
	}

	broken := VetReport{Verdict: VetError, Truncated: false, Findings: []VetFinding{}}

	a := New()

	// 1. The schema alone. If it does not stand up on its own, the data
	//    is never blamed for it.
	schemaParsed, perr := a.Parse(schemaSrc)
	if perr != nil {
		return broken
	}
	schemaCtx := &Ctx{root: schemaParsed, src: schemaSrc, collect: true}
	schemaVal := unifyRoot(schemaParsed, schemaCtx)
	schemaCtx.root = schemaVal
	if 0 < len(schemaCtx.err) || schemaVal.Nil() {
		return broken
	}

	// 2. The anchor: the whole schema, or the value at `--at`.
	anchor := schemaVal
	if "" != options.At {
		anchor = anchorAt(schemaVal, options.At)
		if nil == anchor {
			return broken
		}
	}

	// 3. Both documents get their provenance stamped BEFORE they meet,
	//    so every site in the result knows which document it came from.
	dataVal, derr := a.Parse(dataSrc)
	if derr != nil {
		return broken
	}
	stampURL(anchor, schemaURL)
	stampURL(dataVal, dataURL)

	// `--closed` sets the flag close() itself sets, rather than wrapping
	// the anchor in a close() call: the anchor is an already-evaluated
	// tree, and a func value would have to resolve again to have any
	// effect. A scalar anchor has no keys to close, so the flag is only
	// meaningful on a bag.
	if options.Closed {
		switch n := anchor.(type) {
		case *MapVal:
			n.closed = true
		case *ListVal:
			n.closed = true
		}
	}

	pair := newConjunct([]Val{anchor, dataVal})
	ctx := &Ctx{root: pair, src: dataSrc, collect: true}
	unified := unifyRoot(pair, ctx)
	ctx.root = unified

	sources := vetSources{schemaURL: schemaSrc, dataURL: dataSrc}

	// 4. Contradictions: every NilVal standing in the result, PLUS the
	//    ones that never made it into the tree.
	//
	// The second half is not belt-and-braces. When a parent collapses to
	// a nil the whole subtree goes with it, so `service: close({...})`
	// meeting a typo AND a kind conflict leaves ONE nil in the tree and
	// reports the other only on the context — the verb's own motivating
	// example, reporting half of what it found. Check does the same
	// union for the same reason (check.go); dedup is by identity.
	var nils []*NilVal
	seen := map[Val]bool{}
	collectNils(unified, &nils, seen)
	for _, e := range ctx.err {
		if !seen[Val(e)] {
			seen[Val(e)] = true
			nils = append(nils, e)
		}
	}

	findings := []VetFinding{}
	for _, n := range nils {
		findings = append(findings, findingOf(n, dataURL, sources))
	}
	conflicts := len(findings)

	// 5. Incompleteness: what is left standing that cannot generate. The
	//    generate check runs in its own collect context so nothing it
	//    raises reaches the caller's error list, and so a schema that is
	//    merely unsatisfied does not look like one that is contradicted.
	//    The returned error is deliberately dropped: under collect the
	//    reasons are recorded on the context, which is the whole point
	//    of the mode.
	genCtx := &Ctx{root: unified, src: dataSrc, collect: true}
	_, _ = unified.Gen(genCtx)
	for _, e := range genCtx.err {
		if "incomplete" == e.Class() {
			findings = append(findings, findingOf(e, dataURL, sources))
		}
	}

	keys := make([]string, len(findings))
	idx := make([]int, len(findings))
	for i, f := range findings {
		keys[i] = vetOrderKey(f, i)
		idx[i] = i
	}
	sort.Slice(idx, func(a, b int) bool { return keys[idx[a]] < keys[idx[b]] })
	ordered := make([]VetFinding, len(findings))
	for i, j := range idx {
		ordered[i] = findings[j]
	}

	truncated := maxErrors < len(ordered)
	kept := ordered
	if truncated {
		kept = ordered[:maxErrors]
	}

	// 6. The verdict derives from finding CLASSES, never from codes, so
	//    a new code can never change exit behaviour.
	verdict := VetValid
	if 0 < conflicts {
		verdict = VetInvalid
	} else if conflicts < len(findings) && !options.Partial {
		verdict = VetIncomplete
	}

	return VetReport{Verdict: verdict, Truncated: truncated, Findings: kept}
}
