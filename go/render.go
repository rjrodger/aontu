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
type RenderUnit struct {
	Path string `json:"path"`
	Lang string `json:"lang"`
	Text string `json:"text"`
}

// RenderLoss is one entry of the loss report (RENDER.0.md D7): tier 1
// a check the target's type system cannot enforce, tier 2 a fragment,
// tier 3 an opaque escape -- a text declaration or a raw piece. Strict
// refuses tier 3 and only tier 3.
type RenderLoss struct {
	Unit      string `json:"unit"`
	Path      string `json:"path"`
	Tier      int    `json:"tier"`
	Construct string `json:"construct"`
	Reason    string `json:"reason"`
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
	root, ctx, _ := a.unifyCtx(parsed, nil, src)
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
	if c, has := m.peg["code"]; has {
		meetSrc += "\ncode: " + Hcanon(c)
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
	return RenderValue(instance, &options)
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
	instance, gerr := New().Generate(
		renderProfileVocabulary + "\nprofile: " + Hcanon(m.peg["profile"]))
	if nil != gerr { //coverage:ignore vet passed, so the meet generates
		// A vetted profile document generates; this arm is the Go
		// signature's, not a reachable outcome.
		return nil, []VetFinding{renderFinding(
			"render_profile", "parse", "$", gerr.Error())}
	}
	inst, _ := instance.(map[string]any)
	profile, _ := inst["profile"].(map[string]any)
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
		renderBundled[lang], _ = m["profile"].(map[string]any)
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
	code, _ := root["code"].(map[string]any)
	list, _ := code["units"].([]any)

	seen := []string{}
	selected := 0
	for i, u := range list {
		unit, _ := u.(map[string]any)
		upath := "$.code.units." + itoa(i)
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
		errs = append(errs, renderFinding("render_unit", "reference", "$.code.units",
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
