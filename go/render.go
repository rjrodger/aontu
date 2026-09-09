/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strings"
)

// THE RENDERER (docs/design/RENDER.0.md; the Go twin of
// ts/src/render.ts). Render evaluates a document, takes the value at
// At (the root by default), vets it against the bundled aontu:code
// vocabulary, and folds code.units into bytes; RenderValue is the fold
// alone, over Generate output. The fold is pure and total: it never
// touches the Val tree, never reads or writes a file, never sorts and
// never iterates a map -- every `range` below is over a slice -- and
// every piece of a fragment carries its own depth (`at`), so the
// renderer owns every prefix and no piece nests another.
//
// WHAT THIS PHASE RENDERS (RENDER.0.md P3): fragments -- a line, a
// blank run, a raw block, a bare string piece, a reference inline --
// and the text escape, under a profile that knows its language. The
// one bundled profile is aontu:lang/text, which every fragment-only
// unit falls back to; a declaration needs a LOWERING (P5), and until
// then is render_profile.

// RenderUnit is one rendered unit: the path the instance gave it, its
// language, and its bytes, as one string.
//
// LEXICOGRAPHIC FIELD ORDER, here and in every report struct below.
// TypeScript emits every report through one emitter that sorts keys by
// code point (ts/src/exactjson.ts); Go writes struct fields in
// DECLARATION order, so on this side the declaration IS the sort. A
// field added out of order makes the two ports' `--format json` differ
// by key order alone, which no shared-spec row can see: both runners
// parse before they compare.
type RenderUnit struct {
	Lang string `json:"lang"`
	Path string `json:"path"`
	Text string `json:"text"`
}

// RenderLoss is one entry of the loss report (RENDER.0.md D7): tier 1
// a check the target's type system cannot enforce, tier 2 a fragment,
// tier 3 an opaque escape -- a text declaration or a raw piece. Strict
// refuses tier 3 and only tier 3.
type RenderLoss struct {
	Construct string `json:"construct"`
	Path      string `json:"path"`
	Reason    string `json:"reason"`
	Tier      int    `json:"tier"`
	Unit      string `json:"unit"`
}

// RenderTrace is ONE PIECE'S PROVENANCE (RENDER.0.md D9, D11; P7). A
// dispatch stamps every piece it emits with the node it matched and the
// rule it took, and the fold reads the stamps back off the instance:
// Piece is the piece's own path there, Unit the unit it landed in, Node
// the model address the rule matched, and Rule the rule's address --
// its table's, then `#`, then its index in that table.
type RenderTrace struct {
	Node  string `json:"node"`
	Piece string `json:"piece"`
	Rule  string `json:"rule"`
	Unit  string `json:"unit"`
}

// RenderHole is a rendered declaration no rule produced.
type RenderHole struct {
	Path string `json:"path"`
	Unit string `json:"unit"`
}

// RenderCoverage is THE COVERAGE REPORT (P7; G9 §6, "coverage cuts both
// ways"). Two lists, and both are set computations over what the run
// recorded.
type RenderCoverage struct {
	// Dead model: the SHALLOWEST model paths no read reached. A path
	// whose subtree holds a read is not named; its unread children are.
	Dead []string `json:"dead"`
	// Every model path a reference resolved to, in walk order: what the
	// render READ.
	Read []string `json:"read"`
	// A silent hole: a rendered declaration no rule produced. In a
	// document with no rule table that is every declaration, which is
	// the true statement about it -- the rule layer governs none of
	// this output.
	Unruled []RenderHole `json:"unruled"`
}

// RenderReport is the verb's answer.
type RenderReport struct {
	Verdict string `json:"verdict"`
	// In units[] order. Empty on error.
	Units []RenderUnit `json:"units"`
	// Per unit and path. Empty on error.
	Lossy []RenderLoss `json:"lossy"`
	// On error only, in vet's finding shape.
	Errors []VetFinding `json:"errors,omitempty"`
	// The dispatch trace, under Trace or Coverage (P7), in document
	// order. Absent when it is empty, on error, and from RenderValue,
	// which folds an instance the recorder never watched being built.
	Trace []RenderTrace `json:"trace,omitempty"`
	// The coverage report, under Coverage (P7).
	Coverage *RenderCoverage `json:"coverage,omitempty"`
}

// RenderOptions are the fold's options (the twin of RenderOptions in
// ts/src/render.ts; where the document came from and the trust
// profile ride on the Aontu instance, as every Go verb's do).
type RenderOptions struct {
	// At is the value to render, a path into the document. Empty means
	// the root.
	At string
	// Profiles are caller-supplied profiles, each an evaluated profile
	// map, matched to a unit by lang before the bundled set is asked.
	Profiles []map[string]any
	// Unit renders only the unit at this path.
	Unit string
	// Strict refuses tier-3 loss: the opaque escapes.
	Strict bool
	// Trace RECORDS THE DISPATCH TRACE (P7). Off by default: an
	// instrumented run stamps every value a reference resolves and
	// every piece a rule emits, and an ordinary one pays one nil check
	// per meet.
	Trace bool
	// Coverage computes the coverage report, which needs the trace and
	// turns it on.
	Coverage bool
	// CoverageAt measures coverage under this path only, instead of the
	// document root (RENDER.0.md X-3). The narrower measure a document
	// with its model under one key wants.
	CoverageAt string
}

const renderVocabulary = `@"aontu:code"`
const renderProfileVocabulary = `@"aontu:profile"`

// The bundled profiles, by lang: aontu:lang/<lang>.
var renderBundledLangs = []string{"go", "text", "typescript"}

func renderFinding(code, class, path, message string) VetFinding {
	return VetFinding{
		Code: code, Class: class, Severity: "error", Path: path,
		Message: message, Sites: []VetSite{},
	}
}

func renderErrorReport(errs []VetFinding) RenderReport {
	return RenderReport{Verdict: "error", Units: []RenderUnit{},
		Lossy: []RenderLoss{}, Errors: errs}
}

// Render is the verb's evaluation, before the fold (RENDER.0.md D1):
// evaluate, anchor, vet the anchored value against the vocabulary as
// aontu vet would, and generate the MEET of the two -- so the
// vocabulary's defaults are in the instance the fold reads, whether or
// not the document included the vocabulary itself. An anchor below the
// root is re-sourced through its hash form, which is valid source that
// evaluates to the same value.
func (a *Aontu) Render(src string, opts *RenderOptions) RenderReport {
	options := RenderOptions{}
	if nil != opts {
		options = *opts
	}

	parsed, perr := a.parseEntry(src)
	if nil != perr {
		return renderErrorReport([]VetFinding{
			parseFinding(a.File, VetRoleData, perr)})
	}
	// THE RECORDER (P7), on for a run that was asked for a trace or a
	// coverage report and off for every other. Its presence is the one
	// switch: the read set fills as references resolve, and the two
	// riders that carry a read address and a dispatch stamp are written
	// only while it is there.
	rec := options.Trace || options.Coverage
	var reads map[string]bool
	if rec {
		reads = map[string]bool{}
	}
	root, ctx, _ := a.unifyCtxReads(parsed, nil, src, reads)
	if nil == root || root.Nil() || 0 < len(ctx.err) {
		return renderErrorReport([]VetFinding{
			failureFinding(ctx, a.File, src, root)})
	}

	node := root
	if "" != options.At {
		node = anchorAt(root, options.At)
		if nil == node {
			// The anchor names nothing: a no_path nil through the finding
			// shape every other refusal here uses.
			ctx.err = append(ctx.err,
				makeNilErrFull(ctx, "no_path", root, nil, "at", nil))
			return renderErrorReport([]VetFinding{
				failureFinding(ctx, a.File, src, root)})
		}
	}

	// THE VET AND THE MEET READ THE SETTLED VALUE, re-sourced through
	// its hash form (valid source that evaluates to the same value),
	// not the document's text: a fragment's lines are what a transform
	// COMPUTED -- an emit, a join -- and the vocabulary's alternatives
	// are tried against values, not against calls still waiting to
	// fire. A finding from that vet addresses the instance by path.
	// UNDER NO CALLER CAPABILITY, here and in the meet below: the
	// vocabulary is the engine's own and the instance is a canon, which
	// includes nothing, so the caller's include capability -- which
	// governs the DOCUMENT -- has nothing to govern here, and `none`
	// must not deny the renderer its own schema.
	value := Hcanon(node)
	report := Vet(renderVocabulary, value, nil)
	if "valid" != report.Verdict {
		return renderErrorReport(report.Findings)
	}

	// The meet, keyed: the vocabulary's root holds code, and so does the
	// instance's (a value the vet admitted is a map), and a document
	// with no code at all is the vocabulary's own empty instance.
	meetSrc := renderVocabulary
	m, _ := node.(*MapVal)
	if ns, has := m.peg["aontu"]; has {
		if nm, ok := ns.(*MapVal); ok {
			if c, has := nm.peg["Code"]; has {
				meetSrc += "\naontu: Code: " + Hcanon(c)
			}
		}
	}
	instance, gerr := New().Generate(meetSrc)
	if nil != gerr { //coverage:ignore vet passed, so the meet generates
		// The meet of a vetted instance and its vocabulary generates;
		// this arm is the Go signature's, not a reachable outcome. The
		// marker sits on the `if`, so the body is dropped wherever the
		// toolchain opens the block (scripts/covmerge).
		return renderErrorReport([]VetFinding{renderFinding(
			"render_profile", "parse", "$", gerr.Error())})
	}
	folded := RenderValue(instance, &options)

	// THE TWO REPORTS ARE JOINED TO THE FOLD BY PATH (P7), which is
	// what lets the fold stay the pure total function D6 asks for: the
	// dispatch stamps ride the VALUE, the instance the fold reads is
	// that value re-sourced through its hash form, and a piece is at
	// the same path in both. Nothing to report on error: there are no
	// units to attribute pieces to.
	if rec && "error" != folded.Verdict {
		marks := renderEmitted(node)
		folded.Trace = renderTraceOf(marks, instance, folded.Units)
		if options.Coverage {
			cov, ok := renderCoverOf(root, node, reads, &options, marks,
				instance, folded.Units)
			if !ok {
				ctx.err = append(ctx.err,
					makeNilErrFull(ctx, "no_path", root, nil, "coverageAt", nil))
				return renderErrorReport([]VetFinding{
					failureFinding(ctx, a.File, src, root)})
			}
			folded.Coverage = cov
		}
	}
	return folded
}

// ---------------------------------------------------------------------
// THE TRACE AND THE COVERAGE REPORT (RENDER.0.md D11, P7). Twins of the
// block under the same heading in ts/src/render.ts.

// renderMark is one stamped piece and where it sits.
type renderMark struct {
	path string
	mark *emitOrigin
}

// renderWalk walks a value tree in the one order both ports walk in: a
// list by index, a map by key in code-point order. fn answers whether
// to descend.
func renderWalk(root Val, fn func(v Val, path []string) bool) {
	var walk func(v Val, path []string)
	walk = func(v Val, path []string) {
		if nil == v || !fn(v, path) {
			return
		}
		switch n := v.(type) {
		case *ListVal:
			for i, el := range n.peg {
				walk(el, append(cp(path), itoa(i)))
			}
		case *MapVal:
			keys := append([]string(nil), n.keys...)
			sort.Strings(keys)
			for _, k := range keys {
				// AN ALIAS DECLARATION IS NOT A MEMBER, here for the
				// reason every fold has it (members.go): `%wire = …`
				// holds a value the document never generates, so it is
				// neither a piece to trace nor model that could be
				// called dead.
				if !n.isAliasKey(k) {
					walk(n.peg[k], append(cp(path), k))
				}
			}
		}
	}
	walk(root, []string{})
}

// renderAddr is a path as an address: `$`, then a dot before every
// segment.
func renderAddr(path []string) string {
	out := "$"
	for _, seg := range path {
		out += "." + seg
	}
	return out
}

// renderEmitted is every piece a dispatch stamped, under the anchored
// value, in document order. The path is relative to the anchor, which
// is where the instance the fold reads is rooted too.
func renderEmitted(node Val) []renderMark {
	out := []renderMark{}
	renderWalk(node, func(v Val, path []string) bool {
		if o := v.emitOrig(); nil != o {
			out = append(out, renderMark{path: renderAddr(path), mark: o})
		}
		return true
	})
	return out
}

// renderUnitList is the instance's unit maps, or none. A failed type
// assertion answers the zero value and a nil map indexes to one, so the
// three steps need no arms of their own.
func renderUnitList(instance any) []any {
	m, _ := instance.(map[string]any)
	ns, _ := m["aontu"].(map[string]any)
	c, _ := ns["Code"].(map[string]any)
	units, _ := c["units"].([]any)
	return units
}

// renderRendered says whether the unit at this path was rendered:
// --unit names one, and a unit the run did not render has no bytes for
// a piece of it to be in.
func renderRendered(units []RenderUnit, path string) bool {
	for _, u := range units {
		if u.Path == path {
			return true
		}
	}
	return false
}

// renderPrefix is one rendered unit's path prefix and its unit path.
type renderPrefix struct {
	at   string
	path string
}

// renderTraceOf is the trace: one entry per stamped piece that a
// RENDERED unit holds. A piece is IN the unit whose path prefixes its
// own, which is the whole of the question -- no path is parsed, and a
// stamp that lies under no unit at all (a rule set held under a key of
// its own, and referred to from a unit) simply matches nothing. A unit
// the run did not render is not among the prefixes either.
func renderTraceOf(marks []renderMark, instance any,
	units []RenderUnit) []RenderTrace {
	pre := []renderPrefix{}
	for i, u := range renderUnitList(instance) {
		um, _ := u.(map[string]any)
		upath, _ := um["path"].(string)
		if renderRendered(units, upath) {
			pre = append(pre, renderPrefix{
				at: "$.aontu.Code.units." + itoa(i), path: upath})
		}
	}
	out := []RenderTrace{}
	for _, m := range marks {
		hit := ""
		for _, p := range pre {
			if m.path == p.at || strings.HasPrefix(m.path, p.at+".") {
				hit = p.path
				break
			}
		}
		if "" == hit {
			continue
		}
		out = append(out, RenderTrace{Unit: hit, Piece: m.path,
			Node: m.mark.node, Rule: m.mark.rule})
	}
	return out
}

// renderAncestors is every proper ancestor of an address, `$` included.
func renderAncestors(a string) []string {
	parts := strings.Split(a, ".")
	out := make([]string, 0, len(parts))
	for i := 1; i < len(parts); i++ {
		out = append(out, strings.Join(parts[:i], "."))
	}
	return out
}

// renderCovered says whether the value at a is covered by the set --
// the address itself in it, or an address above it. An address ABOVE it
// covers the whole subtree: a reference that read `$.schema` read
// everything under it, and a rule that emitted a unit emitted every
// declaration in it.
func renderCovered(set map[string]bool, a string) bool {
	if set[a] {
		return true
	}
	for _, up := range renderAncestors(a) {
		if set[up] {
			return true
		}
	}
	return false
}

// renderCoverOf is THE COVERAGE REPORT (P7). Dead model is measured
// over the DOCUMENT ROOT, or under CoverageAt when a document keeps its
// model under one key (X-3, decided here): the read set is absolute, so
// a narrower measure is a narrower walk, not a different origin. The
// render's own output -- `code` under the anchor -- is not model and is
// never walked into: nothing reads it, so every document would
// otherwise report it dead.
func renderCoverOf(root Val, node Val, reads map[string]bool,
	opts *RenderOptions, marks []renderMark, instance any,
	units []RenderUnit) (*RenderCoverage, bool) {
	// THE ANCHOR IS THE ONE Render ALREADY FOUND, so the namespace under it is
	// named without asking a second time: At is resolved before the
	// vet, and an anchor that named nothing never reached here.
	codeAddr := renderAddr(append(cp(node.vpath()), "aontu"))

	from := root
	base := []string{}
	if "" != opts.CoverageAt {
		found := anchorAt(root, opts.CoverageAt)
		if nil == found {
			return nil, false
		}
		from = found
		base = cp(found.vpath())
	}

	// The two questions asked of the read set, as sets: is this address
	// read (or under one that is), and does a read lie BELOW it?
	below := map[string]bool{}
	for r := range reads {
		for _, up := range renderAncestors(r) {
			below[up] = true
		}
	}

	dead := []string{}
	renderWalk(from, func(_ Val, path []string) bool {
		a := renderAddr(append(cp(base), path...))
		if a == codeAddr || renderCovered(reads, a) {
			return false
		}
		// THE ROOT OF THE MEASURE IS NEVER ITSELF DEAD MODEL, and is
		// descended into whatever the read set holds. A document that
		// is only a transform reads nothing above its own model, and
		// naming the root there would report the whole document dead
		// while its one live subtree sat inside it.
		if below[a] || 0 == len(path) {
			return true
		}
		dead = append(dead, a)
		return false
	})

	// A SILENT HOLE: a declaration of a rendered unit that no stamp
	// touches -- neither its own, nor one on the unit above it, nor one
	// on a piece inside it.
	stamped := map[string]bool{}
	inside := map[string]bool{}
	for _, m := range marks {
		stamped[m.path] = true
		for _, up := range renderAncestors(m.path) {
			inside[up] = true
		}
	}
	unruled := []RenderHole{}
	for i, u := range renderUnitList(instance) {
		um, _ := u.(map[string]any)
		upath, _ := um["path"].(string)
		if !renderRendered(units, upath) {
			continue
		}
		decls, _ := um["decls"].([]any)
		for j := range decls {
			a := "$.aontu.Code.units." + itoa(i) + ".decls." + itoa(j)
			if !renderCovered(stamped, a) && !inside[a] {
				unruled = append(unruled, RenderHole{Unit: upath, Path: a})
			}
		}
	}

	read := make([]string, 0, len(reads))
	for r := range reads {
		read = append(read, r)
	}
	sort.Strings(read)
	return &RenderCoverage{Read: read, Dead: dead, Unruled: unruled}, true
}

// RenderProfile evaluates a PROFILE DOCUMENT (RENDER.0.md D5) the way
// Render evaluates its own: under this instance's include options,
// then vetted against aontu:profile as a settled value and met with
// that vocabulary so its defaults (indent.width 2, ...) are in it. The
// answer is the profile map the fold reads -- what --profile <file>
// hands to RenderOptions.Profiles -- or the findings that refused the
// document: one that does not stand up, or one the vocabulary rejects.
// Twin of renderProfile in ts/src/render.ts.
func (a *Aontu) RenderProfile(src string) (map[string]any, []VetFinding) {
	parsed, perr := a.parseEntry(src)
	if nil != perr {
		return nil, []VetFinding{parseFinding(a.File, VetRoleData, perr)}
	}
	root, ctx, _ := a.unifyCtx(parsed, nil, src)
	if nil == root || root.Nil() || 0 < len(ctx.err) {
		return nil, []VetFinding{failureFinding(ctx, a.File, src, root)}
	}
	report := Vet(renderProfileVocabulary, Hcanon(root), nil)
	if "valid" != report.Verdict {
		return nil, report.Findings
	}
	// The meet, keyed as Render's is: the vocabulary requires profile,
	// so a value the vet admitted has one.
	m, _ := root.(*MapVal)
	nsv, _ := m.peg["aontu"].(*MapVal)
	instance, gerr := New().Generate(
		renderProfileVocabulary + "\naontu: Profile: " + Hcanon(nsv.peg["Profile"]))
	if nil != gerr { //coverage:ignore vet passed, so the meet generates
		// A vetted profile document generates; this arm is the Go
		// signature's, not a reachable outcome.
		return nil, []VetFinding{renderFinding(
			"render_profile", "parse", "$", gerr.Error())}
	}
	inst, _ := instance.(map[string]any)
	ins, _ := inst["aontu"].(map[string]any)
	profile, _ := ins["Profile"].(map[string]any)
	return profile, nil
}

// The bundled profiles, each evaluated once: the meet of
// aontu:lang/<lang> with the vocabulary, so its defaults are in it.
var renderBundled = map[string]map[string]any{}

func bundledProfile(lang string) map[string]any {
	known := false
	for _, l := range renderBundledLangs {
		if l == lang {
			known = true
		}
	}
	if !known {
		return nil
	}
	if nil == renderBundled[lang] {
		gen, _ := New().Generate(`@"aontu:lang/` + lang + `"`)
		m, _ := gen.(map[string]any)
		ns, _ := m["aontu"].(map[string]any)
		renderBundled[lang], _ = ns["Profile"].(map[string]any)
	}
	return renderBundled[lang]
}

// profileFor is PROFILE SELECTION, per unit (RENDER.0.md D5): a
// caller-supplied profile whose lang is the unit's; else the bundled
// profile of that lang; else aontu:lang/text, if and only if every
// declaration in the unit is a fragment or a text escape; else nil,
// which the caller reports as render_profile.
func profileFor(lang string, given []map[string]any, fragOnly bool) map[string]any {
	for _, p := range given {
		if l, _ := p["lang"].(string); l == lang {
			return p
		}
	}
	if own := bundledProfile(lang); nil != own {
		return own
	}
	if fragOnly {
		return bundledProfile("text")
	}
	return nil
}

// mergeProfile is an inline profile merged over its base, map by map,
// the inline value winning at a leaf; keys in code-point order, so the
// merge is the same in both ports.
func mergeProfile(base, over map[string]any) map[string]any {
	out := map[string]any{}
	bkeys := sortedKeys(base)
	for _, k := range bkeys {
		out[k] = base[k]
	}
	okeys := sortedKeys(over)
	for _, k := range okeys {
		bm, bok := base[k].(map[string]any)
		om, ook := over[k].(map[string]any)
		if bok && ook {
			out[k] = mergeProfile(bm, om)
		} else {
			out[k] = over[k]
		}
	}
	return out
}

func sortedKeys(m map[string]any) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

// THE FOLD (RENDER.0.md D6). pad(at) is indent.unit repeated
// indent.width × at times; a line is pad + text + LF, and an empty text
// emits no pad; a blank is its terminators alone; a raw block's lines
// each get the pad unless reindent is false, which emits them at column
// 0 verbatim -- and common leading indentation is never stripped. A
// reference inline is its name, verbatim (a declaration-capable profile
// puts it through its identifier rules, P5). Nothing is trimmed (D3).
// A profile with no indent -- a caller-supplied map the vocabulary
// never filled -- takes the vocabulary's own default, two spaces.
func renderPad(profile map[string]any, at int) string {
	indent, _ := profile["indent"].(map[string]any)
	unit, ok := indent["unit"].(string)
	if !ok {
		unit = " "
	}
	return strings.Repeat(unit, renderInt(indent, "width", 2)*at)
}

func renderLine(profile map[string]any, at int, text string) string {
	if "" == text {
		return "\n"
	}
	return renderPad(profile, at) + text + "\n"
}

// renderInline: a reference inline is its name, through the profile's
// identifier rules under a lowering, verbatim under text.
func renderInline(piece any, ctx *lowerCtx) string {
	if s, ok := piece.(string); ok {
		return s
	}
	m, _ := piece.(map[string]any)
	name, _ := m["name"].(string)
	if nil != ctx {
		return lowerIdent(name, "record", ctx, "", false)
	}
	return name
}

// renderInt reads a small integer field: generated as int64 by this
// engine, as float64 by JSON, and absent when the caller of RenderValue
// left the vocabulary's default to the fold.
func renderInt(m map[string]any, key string, dflt int) int {
	switch n := m[key].(type) {
	case int64:
		return int(n)
	case float64:
		return int(n)
	}
	return dflt
}

func renderPiece(piece any, profile map[string]any, unit, path string,
	lossy *[]RenderLoss, ctx *lowerCtx) string {
	if s, ok := piece.(string); ok {
		return renderLine(profile, 0, s)
	}
	m, _ := piece.(map[string]any)
	kind, _ := m["k"].(string)
	switch kind {
	case "line":
		of, _ := m["of"].([]any)
		var b strings.Builder
		for _, p := range of {
			b.WriteString(renderInline(p, ctx))
		}
		return renderLine(profile, renderInt(m, "at", 0), b.String())
	case "blank":
		return strings.Repeat("\n", renderInt(m, "n", 1))
	}
	*lossy = append(*lossy, RenderLoss{
		Unit: unit, Path: path, Tier: 3, Construct: "raw",
		Reason: "verbatim text: the renderer re-indents it and checks nothing else",
	})
	at := renderInt(m, "at", 0)
	reindent := true
	if r, ok := m["reindent"].(bool); ok {
		reindent = r
	}
	text, _ := m["text"].(string)
	lines := strings.Split(text, "\n")
	if "" == lines[len(lines)-1] {
		lines = lines[:len(lines)-1]
	}
	var b strings.Builder
	for _, l := range lines {
		if reindent {
			b.WriteString(renderLine(profile, at, l))
		} else {
			b.WriteString(l + "\n")
		}
	}
	return b.String()
}

// RenderValue is the fold alone, over Generate output: the instance is
// {code: {units: [...]}} as the vocabulary shapes it, with its defaults
// filled -- which is what Render hands over, and what a caller of this
// function is responsible for.
func RenderValue(instance any, opts *RenderOptions) RenderReport {
	options := RenderOptions{}
	if nil != opts {
		options = *opts
	}
	errs := []VetFinding{}
	lossy := []RenderLoss{}
	units := []RenderUnit{}

	root, _ := instance.(map[string]any)
	ns, _ := root["aontu"].(map[string]any)
	code, _ := ns["Code"].(map[string]any)
	list, _ := code["units"].([]any)

	seen := []string{}
	selected := 0
	for i, u := range list {
		unit, _ := u.(map[string]any)
		upath := "$.aontu.Code.units." + itoa(i)
		path, _ := unit["path"].(string)
		lang, _ := unit["lang"].(string)

		// A UNIT PATH IS RELATIVE, DESCENDS, AND IS ITS OWN (RENDER.0.md
		// D8): an absolute path, a `..` segment or a repeat of another
		// unit's path is refused before anything is written.
		if strings.HasPrefix(path, "/") {
			errs = append(errs, renderFinding("render_path", "parse", upath+".path",
				"the unit path "+path+" is absolute."))
			continue
		}
		if renderClimbs(path) {
			errs = append(errs, renderFinding("render_path", "parse", upath+".path",
				"the unit path "+path+" climbs out of the output directory."))
			continue
		}
		if renderSeen(seen, path) {
			errs = append(errs, renderFinding("render_path", "parse", upath+".path",
				"the unit path "+path+" repeats another unit's."))
			continue
		}
		seen = append(seen, path)

		if "" != options.Unit && options.Unit != path {
			continue
		}
		selected++

		decls, _ := unit["decls"].([]any)
		fragOnly := true
		for _, d := range decls {
			dm, _ := d.(map[string]any)
			k, _ := dm["k"].(string)
			if "frag" != k && "text" != k {
				fragOnly = false
			}
		}
		base := profileFor(lang, options.Profiles, fragOnly)
		if nil == base {
			errs = append(errs, renderFinding("render_profile", "parse", upath+".lang",
				"no profile renders "+lang+": a declaration needs a lowering, and "+
					"only fragments and text escapes render under aontu:lang/text."))
			continue
		}
		profile := base
		if inline, ok := unit["profile"].(map[string]any); ok {
			profile = mergeProfile(base, inline)
		}
		plang, _ := profile["lang"].(string)

		// THE LOWERING (D5, P5), when the profile names one: the unit's
		// header -- banner, package clause, imports -- and each
		// declaration as pieces the fold takes, a blank line between two
		// lowered declarations. A fragment or a text escape owns its own
		// blanks.
		var ctx *lowerCtx
		if family, ok := profile["lowering"].(string); ok {
			ctx = &lowerCtx{profile: profile, family: family, unit: path, lossy: &lossy}
		}

		var text strings.Builder
		if nil != ctx {
			header := lowerHeader(unit, lowerMap(code, "source"), ctx)
			for _, piece := range header {
				text.WriteString(renderPiece(piece, profile, path, upath, &lossy, ctx))
			}
			if 0 < len(header) && 0 < len(decls) {
				text.WriteString("\n")
			}
		}
		lowered := false
		for j, d := range decls {
			decl, _ := d.(map[string]any)
			dpath := upath + ".decls." + itoa(j)
			k, _ := decl["k"].(string)
			switch k {
			case "frag":
				lowered = false
				lossy = append(lossy, RenderLoss{
					Unit: path, Path: dpath, Tier: 2, Construct: "frag",
					Reason: "a fragment says nothing about " + lang + " syntax",
				})
				of, _ := decl["of"].([]any)
				for n, piece := range of {
					text.WriteString(renderPiece(piece, profile, path,
						dpath+".of."+itoa(n), &lossy, ctx))
				}
			case "text":
				lowered = false
				dlang, _ := decl["lang"].(string)
				if dlang != lang {
					errs = append(errs, renderFinding("render_lang", "conflict", dpath+".lang",
						"the text escape is "+dlang+" in a "+lang+" unit."))
					continue
				}
				lossy = append(lossy, RenderLoss{
					Unit: path, Path: dpath, Tier: 3, Construct: "text",
					Reason: "verbatim " + lang + ": the renderer checks nothing in it",
				})
				dtext, _ := decl["text"].(string)
				text.WriteString(dtext)
			default:
				if nil == ctx {
					errs = append(errs, renderFinding("render_profile", "parse", dpath+".k",
						"a "+k+" declaration has no lowering under the "+plang+" profile."))
					continue
				}
				if lowered {
					text.WriteString("\n")
				}
				for _, piece := range lowerDecl(decl, dpath, ctx) {
					text.WriteString(renderPiece(piece, profile, path, dpath, &lossy, ctx))
				}
				lowered = true
			}
		}

		units = append(units, RenderUnit{Path: path, Lang: lang, Text: text.String()})
	}

	if "" != options.Unit && 0 == selected {
		errs = append(errs, renderFinding("render_unit", "reference", "$.aontu.Code.units",
			"no unit has the path "+options.Unit+"."))
	}

	if options.Strict {
		for _, loss := range lossy {
			if 3 == loss.Tier {
				errs = append(errs, renderFinding("render_strict", "conflict", loss.Path,
					"the "+loss.Construct+" in "+loss.Unit+
						" is an opaque escape, refused under strict."))
			}
		}
	}

	if 0 < len(errs) {
		return renderErrorReport(errs)
	}
	verdict := "ok"
	if 0 < len(lossy) {
		verdict = "lossy"
	}
	return RenderReport{Verdict: verdict, Units: units, Lossy: lossy}
}

func renderClimbs(path string) bool {
	for _, seg := range strings.Split(path, "/") {
		if ".." == seg {
			return true
		}
	}
	return false
}

func renderSeen(seen []string, path string) bool {
	for _, s := range seen {
		if s == path {
			return true
		}
	}
	return false
}
