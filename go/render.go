/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strings"
)


type RenderUnit struct {
	Lang string `json:"lang"`
	Path string `json:"path"`
	Text string `json:"text"`
}

type RenderLoss struct {
	Construct string `json:"construct"`
	Path      string `json:"path"`
	Reason    string `json:"reason"`
	Tier      int    `json:"tier"`
	Unit      string `json:"unit"`
}

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

type RenderCoverage struct {
	// Dead model: the SHALLOWEST model paths no read reached. A path
	// whose subtree holds a read is not named; its unread children are.
	Dead []string `json:"dead"`
	// Every model path a reference resolved to, in walk order: what the
	// render READ.
	Read []string `json:"read"`
	Unruled []RenderHole `json:"unruled"`
}

// RenderReport is the verb's answer.
type RenderReport struct {
	Verdict string `json:"verdict"`
	Units []RenderUnit `json:"units"`
	// Per unit and path. Empty on error.
	Lossy []RenderLoss `json:"lossy"`
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
	Strict bool
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
var renderBundledLangs = []string{"go", "markdown", "text", "typescript"}

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
		return renderErrorReport([]VetFinding{renderFinding(
			"render_profile", "parse", "$", gerr.Error())})
	}
	folded := RenderValue(instance, &options)

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
