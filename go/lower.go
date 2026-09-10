/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu


import (
	"strconv"
	"strings"
)

// lowerCtx is the lowering's view of one unit: the merged profile,
// the family it names, and the report the losses go to.
type lowerCtx struct {
	profile map[string]any
	family  string
	unit    string
	lossy   *[]RenderLoss
}

func lowerLine(at int, text string) map[string]any {
	return map[string]any{"k": "line", "at": int64(at), "of": []any{text}}
}

func lowerBlank() map[string]any {
	return map[string]any{"k": "blank"}
}

func lowerMap(m map[string]any, key string) map[string]any {
	sub, _ := m[key].(map[string]any)
	return sub
}

func lowerStr(m map[string]any, key string) string {
	s, _ := m[key].(string)
	return s
}

func lowerStrings(v any) []string {
	list, _ := v.([]any)
	out := []string{}
	for _, x := range list {
		if s, ok := x.(string); ok {
			out = append(out, s)
		}
	}
	return out
}

// --- identifiers -------------------------------------------------------

func lowerIsUpper(c rune) bool { return 'A' <= c && c <= 'Z' }
func lowerIsLower(c rune) bool { return 'a' <= c && c <= 'z' }
func lowerIsDigit(c rune) bool { return '0' <= c && c <= '9' }

func lowerSplitWords(name string) []string {
	words := []string{}
	cur := []rune{}
	chars := []rune(name)
	for i, c := range chars {
		if '_' == c || '-' == c || ' ' == c {
			if 0 < len(cur) {
				words = append(words, string(cur))
			}
			cur = []rune{}
			continue
		}
		if 0 < len(cur) {
			prev := chars[i-1]
			boundary := c < 0x80 && prev < 0x80 &&
				((lowerIsUpper(c) && (lowerIsLower(prev) || lowerIsDigit(prev))) ||
					(lowerIsDigit(c) != lowerIsDigit(prev)) ||
					(lowerIsUpper(c) && lowerIsUpper(prev) && i+1 < len(chars) && lowerIsLower(chars[i+1])))
			if boundary {
				words = append(words, string(cur))
				cur = []rune{}
			}
		}
		cur = append(cur, c)
	}
	if 0 < len(cur) {
		words = append(words, string(cur))
	}
	return words
}

func lowerASCII(s string) string {
	out := []rune(s)
	for i, c := range out {
		if lowerIsUpper(c) {
			out[i] = c + 32
		}
	}
	return string(out)
}

func upperASCII(s string) string {
	out := []rune(s)
	for i, c := range out {
		if lowerIsLower(c) {
			out[i] = c - 32
		}
	}
	return string(out)
}

// lowerCapitalise is a word capitalised: the acronym set wins, so `id`
// is `ID` under a profile that lists it and `Id` under one that does
// not.
func lowerCapitalise(word string, acronyms []string) string {
	low := lowerASCII(word)
	for _, a := range acronyms {
		if lowerASCII(a) == low {
			return a
		}
	}
	chars := []rune(low)
	return upperASCII(string(chars[:1])) + string(chars[1:])
}

// lowerCaseName is THE CASE STYLES of aontu:profile's %case, over the
// words.
func lowerCaseName(name, style string, acronyms []string) string {
	if "as-is" == style {
		return name
	}
	words := lowerSplitWords(name)
	if 0 == len(words) {
		return name
	}
	switch style {
	case "snake", "kebab", "screaming":
		parts := make([]string, len(words))
		for i, w := range words {
			if "screaming" == style {
				parts[i] = upperASCII(w)
			} else {
				parts[i] = lowerASCII(w)
			}
		}
		if "kebab" == style {
			return strings.Join(parts, "-")
		}
		return strings.Join(parts, "_")
	}
	caps := make([]string, len(words))
	for i, w := range words {
		caps[i] = lowerCapitalise(w, acronyms)
	}
	if "pascal" == style {
		return strings.Join(caps, "")
	}
	// camel: the first word lower, and never an acronym.
	return lowerASCII(words[0]) + strings.Join(caps[1:], "")
}

func lowerIdent(name, role string, ctx *lowerCtx, path string, bare bool) string {
	rules := lowerMap(ctx.profile, "ident")
	style := lowerStr(lowerMap(rules, "case"), role)
	if "" == style {
		style = "as-is"
	}
	acronyms := lowerStrings(rules["acronyms"])
	out := lowerCaseName(name, style, acronyms)
	if bare {
		for _, r := range lowerStrings(rules["reserved"]) {
			if r == out {
				*ctx.lossy = append(*ctx.lossy, RenderLoss{
					Unit: ctx.unit, Path: path, Tier: 1, Construct: "reserved",
					Reason: out + " is reserved in " + lowerStr(ctx.profile, "lang") + "; renamed " + out + "_",
				})
				out += "_"
				break
			}
		}
	}
	return out
}

// --- literals ----------------------------------------------------------

func lowerHex4(n rune) string {
	h := strconv.FormatInt(int64(n), 16)
	for len(h) < 4 {
		h = "0" + h
	}
	return "\\u" + h
}

// lowerQuote is a string literal: the profile's quote, and one pass
// over the code points through its escape table. A control character
// the table does not name is a \u escape; so are the quote and the
// backslash when the table is silent about them; everything else,
// non-ASCII and astral included, is verbatim.
func lowerQuote(s string, profile map[string]any) string {
	str := lowerMap(profile, "str")
	q := lowerStr(str, "quote")
	if "" == q {
		q = "\""
	}
	table := lowerMap(str, "escape")
	var b strings.Builder
	b.WriteString(q)
	qr := []rune(q)[0]
	for _, c := range s {
		if esc, ok := table[strconv.Itoa(int(c))].(string); ok {
			b.WriteString(esc)
		} else if c < 0x20 || 0x7f == c || c == qr || '\\' == c {
			b.WriteString(lowerHex4(c))
		} else {
			b.WriteRune(c)
		}
	}
	b.WriteString(q)
	return b.String()
}

// lowerLiteral is a literal value as the target spells it: a string
// quoted, a number through the one number formatter, a boolean as is,
// and null as the family's null.
func lowerLiteral(v any, ctx *lowerCtx) string {
	switch x := v.(type) {
	case string:
		return lowerQuote(x, ctx.profile)
	case nil:
		if "go" == ctx.family {
			return "nil"
		}
		return "null"
	case bool:
		if x {
			return "true"
		}
		return "false"
	case int64:
		return strconv.FormatInt(x, 10)
	case float64:
		return formatNumber(x)
	}
	return "" //coverage:ignore the vocabulary admits no other literal kind
}

// --- types -------------------------------------------------------------

type lowerExpr struct {
	text string
	prec int
}

func lowerForm(ctx *lowerCtx, name string) map[string]any {
	f := lowerMap(lowerMap(ctx.profile, "types"), name)
	if nil == f {
		return map[string]any{"open": "", "close": "", "prec": int64(9), "childPrec": int64(0)}
	}
	return f
}

// lowerUnder is an inner expression under a form, in parens when its
// precedence is below the form's childPrec: TypeScript's
// `(string | null)[]`.
func lowerUnder(inner lowerExpr, f map[string]any) string {
	if inner.prec < renderInt(f, "childPrec", 0) {
		return "(" + inner.text + ")"
	}
	return inner.text
}

func lowerLoss(ctx *lowerCtx, path, construct, reason string) {
	*ctx.lossy = append(*ctx.lossy, RenderLoss{
		Unit: ctx.unit, Path: path, Tier: 1, Construct: construct, Reason: reason,
	})
}

// lowerLitPrim is the primitive kind a literal set shares, for a
// family with no literal type: strings, integers, floats, booleans,
// null, or any.
func lowerLitPrim(of []any) string {
	// A number is one kind here, as it is in TypeScript: the split into
	// int and float comes after, over the whole set.
	kind := func(v any) string {
		switch v.(type) {
		case string:
			return "string"
		case bool:
			return "bool"
		case int64, float64:
			return "number"
		}
		return "null"
	}
	first := kind(of[0])
	for _, v := range of[1:] {
		if kind(v) != first {
			return "any"
		}
	}
	if "number" != first {
		return first
	}
	for _, v := range of {
		if f, ok := v.(float64); ok && f != float64(int64(f)) {
			return "float"
		}
	}
	return "int"
}

func lowerPrim(ctx *lowerCtx, name string) string {
	if p, ok := lowerMap(lowerMap(ctx.profile, "types"), "prim")[name].(string); ok {
		return p
	}
	return name
}

// lowerTypeExpr is THE TYPE EXPRESSION, from the profile's type forms
// (D6): an atom has prec 9; a form is open + inner + close, its
// precedence its own, its inner parenthesised below childPrec. A text
// leaf is verbatim target syntax and tier 3, as a text declaration is.
func lowerTypeExpr(t map[string]any, ctx *lowerCtx, path string) lowerExpr {
	switch lowerStr(t, "k") {
	case "prim":
		return lowerExpr{lowerPrim(ctx, lowerStr(t, "prim")), 9}
	case "ref":
		return lowerExpr{lowerIdent(lowerStr(t, "name"), "record", ctx, path, false), 9}
	case "text":
		*ctx.lossy = append(*ctx.lossy, RenderLoss{
			Unit: ctx.unit, Path: path, Tier: 3, Construct: "text",
			Reason: "verbatim " + lowerStr(t, "lang") + ": the renderer checks nothing in it",
		})
		return lowerExpr{lowerStr(t, "text"), 9}
	case "list":
		f := lowerForm(ctx, "list")
		inner := lowerTypeExpr(lowerMap(t, "of"), ctx, path+".of")
		return lowerExpr{lowerStr(f, "open") + lowerUnder(inner, f) + lowerStr(f, "close"), renderInt(f, "prec", 9)}
	case "map":
		f := lowerForm(ctx, "map")
		key := lowerUnder(lowerTypeExpr(lowerMap(t, "key"), ctx, path+".key"), f)
		of := lowerUnder(lowerTypeExpr(lowerMap(t, "of"), ctx, path+".of"), f)
		sep := ", "
		if "go" == ctx.family {
			sep = "]"
		}
		return lowerExpr{lowerStr(f, "open") + key + sep + of + lowerStr(f, "close"), renderInt(f, "prec", 9)}
	case "opt":
		f := lowerForm(ctx, "opt")
		inner := lowerTypeExpr(lowerMap(t, "of"), ctx, path+".of")
		return lowerExpr{lowerStr(f, "open") + lowerUnder(inner, f) + lowerStr(f, "close"), renderInt(f, "prec", 9)}
	case "union":
		if "go" == ctx.family {
			lowerLoss(ctx, path, "union", "go has no union type: any")
			return lowerExpr{lowerPrim(ctx, "any"), 9}
		}
		f := lowerForm(ctx, "union")
		of, _ := t["of"].([]any)
		members := make([]string, len(of))
		for i, m := range of {
			mm, _ := m.(map[string]any)
			members[i] = lowerUnder(lowerTypeExpr(mm, ctx, path+".of."+itoa(i)), f)
		}
		return lowerExpr{lowerStr(f, "open") + strings.Join(members, " | ") + lowerStr(f, "close"), renderInt(f, "prec", 9)}
	}
	// lit
	of, _ := t["of"].([]any)
	if "go" == ctx.family {
		p := lowerLitPrim(of)
		lowerLoss(ctx, path, "lit", "go has no literal type: "+p)
		return lowerExpr{lowerPrim(ctx, p), 9}
	}
	f := lowerForm(ctx, "lit")
	lits := make([]string, len(of))
	for i, v := range of {
		lits[i] = lowerLiteral(v, ctx)
	}
	return lowerExpr{lowerStr(f, "open") + strings.Join(lits, " | ") + lowerStr(f, "close"), renderInt(f, "prec", 9)}
}

// --- comments ----------------------------------------------------------

// lowerDoc is a doc comment as pieces at a depth: the profile's doc
// form -- open, a prefix per line, close -- and the line form when a
// profile has no doc form. A deprecation is the last line, in the
// family's spelling.
func lowerDoc(d map[string]any, at int, ctx *lowerCtx) []any {
	if nil == d {
		return nil
	}
	forms := lowerMap(ctx.profile, "comment")
	f := lowerMap(forms, "doc")
	if nil == f {
		f = lowerMap(forms, "line")
	}
	if nil == f {
		f = map[string]any{"prefix": "// "}
	}
	prefix := lowerStr(f, "prefix")
	lines := strings.Split(lowerStr(d, "text"), "\n")
	if dep := lowerMap(d, "deprecated"); nil != dep {
		parts := []string{}
		if msg := lowerStr(dep, "msg"); "" != msg {
			parts = append(parts, msg)
		}
		if use := lowerStr(dep, "use"); "" != use {
			parts = append(parts, "use "+use)
		}
		if since := lowerStr(dep, "since"); "" != since {
			parts = append(parts, "since "+since)
		}
		note := strings.Join(parts, "; ")
		if "go" == ctx.family {
			lines = append(lines, "Deprecated: "+note)
		} else {
			lines = append(lines, "@deprecated "+note)
		}
	}
	out := []any{}
	if open, ok := f["open"].(string); ok {
		out = append(out, lowerLine(at, open))
	}
	for _, l := range lines {
		out = append(out, lowerLine(at, strings.TrimRight(prefix+l, " \t")))
	}
	if cl, ok := f["close"].(string); ok {
		out = append(out, lowerLine(at, cl))
	}
	return out
}

func lowerChecks(list any, path string, ctx *lowerCtx) {
	checks, _ := list.([]any)
	for i, c := range checks {
		cm, _ := c.(map[string]any)
		lowerLoss(ctx, path+".check."+itoa(i), "check",
			"the check "+lowerStr(cm, "c")+" is not enforced by the "+lowerStr(ctx.profile, "lang")+" type system")
	}
}

// --- the unit header ---------------------------------------------------

// lowerRelImport is the path from one unit's directory to another
// unit, for a TypeScript import: ./other beside, ../shared/x across,
// the extension gone.
func lowerRelImport(from, to string) string {
	a := strings.Split(from, "/")
	a = a[:len(a)-1]
	b := strings.Split(to, "/")
	file := b[len(b)-1]
	b = b[:len(b)-1]
	if dot := strings.LastIndex(file, "."); 0 < dot {
		file = file[:dot]
	}
	i := 0
	for i < len(a) && i < len(b) && a[i] == b[i] {
		i++
	}
	parts := []string{}
	for range a[i:] {
		parts = append(parts, "..")
	}
	up := len(parts)
	parts = append(parts, b[i:]...)
	parts = append(parts, file)
	if 0 == up {
		return "./" + strings.Join(parts, "/")
	}
	return strings.Join(parts, "/")
}

type lowerImportGroup struct {
	from  string
	names []string
}

// lowerDerivedImports are the imports derived from {k:"ref", unit}
// nodes, in order of first appearance, grouped by unit -- TypeScript
// only: a Go reference names a type in the same package.
func lowerDerivedImports(unit map[string]any) []lowerImportGroup {
	groups := []lowerImportGroup{}
	var visit func(t any)
	visit = func(t any) {
		switch x := t.(type) {
		case []any:
			for _, e := range x {
				visit(e)
			}
		case map[string]any:
			if from, ok := x["unit"].(string); ok && "ref" == lowerStr(x, "k") {
				name := lowerStr(x, "name")
				for gi := range groups {
					if groups[gi].from == from {
						for _, n := range groups[gi].names {
							if n == name {
								return
							}
						}
						groups[gi].names = append(groups[gi].names, name)
						return
					}
				}
				groups = append(groups, lowerImportGroup{from, []string{name}})
				return
			}
			for _, key := range []string{"type", "of", "key", "returns", "fields", "params"} {
				visit(x[key])
			}
		}
	}
	visit(unit["decls"])
	return groups
}

// lowerHeader is the banner from code.source, the package clause, and
// the imports: what stands before the declarations, each part
// followed by a blank.
func lowerHeader(unit, source map[string]any, ctx *lowerCtx) []any {
	parts := [][]any{}
	if banner, ok := ctx.profile["banner"].(string); ok && "" != lowerStr(source, "path") {
		prefix := lowerStr(lowerMap(lowerMap(ctx.profile, "comment"), "line"), "prefix")
		text := strings.ReplaceAll(banner, "{path}", lowerStr(source, "path"))
		text = strings.ReplaceAll(text, "{hash}", lowerStr(source, "hash"))
		parts = append(parts, []any{prefix + text})
	}
	if pkg, ok := unit["pkg"].(string); ok && "go" == ctx.family {
		parts = append(parts, []any{"package " + pkg})
	}
	imports := []map[string]any{}
	if list, ok := unit["imports"].([]any); ok {
		for _, im := range list {
			m, _ := im.(map[string]any)
			imports = append(imports, m)
		}
	}
	if "typescript" == ctx.family {
		for _, g := range lowerDerivedImports(unit) {
			names := make([]any, len(g.names))
			for i, n := range g.names {
				names[i] = lowerIdent(n, "record", ctx, "", false)
			}
			imports = append(imports, map[string]any{
				"from": lowerRelImport(lowerStr(unit, "path"), g.from), "names": names,
			})
		}
	}
	if 0 < len(imports) {
		lines := []any{}
		if "go" == ctx.family {
			spell := func(im map[string]any) string {
				alias := ""
				if a, ok := im["alias"].(string); ok {
					alias = a + " "
				}
				return alias + lowerQuote(lowerStr(im, "from"), ctx.profile)
			}
			if 1 == len(imports) {
				lines = append(lines, "import "+spell(imports[0]))
			} else {
				lines = append(lines, "import (")
				for _, im := range imports {
					lines = append(lines, lowerLine(1, spell(im)))
				}
				lines = append(lines, ")")
			}
		} else {
			for _, im := range imports {
				from := lowerQuote(lowerStr(im, "from"), ctx.profile)
				names := lowerStrings(im["names"])
				if 0 < len(names) {
					lines = append(lines, "import { "+strings.Join(names, ", ")+" } from "+from+";")
				} else if alias, ok := im["alias"].(string); ok {
					lines = append(lines, "import * as "+alias+" from "+from+";")
				} else {
					lines = append(lines, "import "+from+";")
				}
			}
		}
		parts = append(parts, lines)
	}
	// The parts, a blank between each two; the fold puts the blank
	// after the last when a declaration follows.
	out := []any{}
	for i, part := range parts {
		if 0 < i {
			out = append(out, lowerBlank())
		}
		out = append(out, part...)
	}
	return out
}

// --- declarations ------------------------------------------------------

// lowerNest is a body fragment's pieces, one level deeper: a bare
// string is a line at depth 1, a line or a raw keeps its shape at
// at + 1, a blank is a blank.
func lowerNest(pieces []any) []any {
	out := make([]any, len(pieces))
	for i, p := range pieces {
		switch x := p.(type) {
		case string:
			out[i] = lowerLine(1, x)
		case map[string]any:
			if "blank" == lowerStr(x, "k") {
				out[i] = x
				continue
			}
			copy := map[string]any{}
			for k, v := range x {
				copy[k] = v
			}
			copy["at"] = int64(renderInt(x, "at", 0) + 1)
			out[i] = copy
		}
	}
	return out
}

func lowerParams(list []any, ctx *lowerCtx, path string) string {
	parts := make([]string, len(list))
	for i, p := range list {
		pm, _ := p.(map[string]any)
		ppath := path + ".params." + itoa(i)
		name := lowerIdent(lowerStr(pm, "name"), "param", ctx, ppath+".name", true)
		typ := lowerTypeExpr(lowerMap(pm, "type"), ctx, ppath+".type").text
		_, hasDefault := pm["default"]
		if "go" == ctx.family {
			if hasDefault {
				lowerLoss(ctx, ppath+".default", "default",
					"go has no default parameter: the default of "+lowerStr(pm, "name")+" is dropped")
			}
			parts[i] = name + " " + typ
			continue
		}
		parts[i] = name + ": " + typ
		if hasDefault {
			parts[i] += " = " + lowerLiteral(pm["default"], ctx)
		}
	}
	return strings.Join(parts, ", ")
}

// lowerDecl is the lowering of one declaration to pieces. A frag and a
// text never arrive here: the fold takes those itself.
func lowerDecl(decl map[string]any, path string, ctx *lowerCtx) []any {
	isGo := "go" == ctx.family
	out := []any{}

	switch lowerStr(decl, "k") {
	case "record":
		name := lowerIdent(lowerStr(decl, "name"), "record", ctx, path+".name", true)
		out = append(out, lowerDoc(lowerMap(decl, "doc"), 0, ctx)...)
		if isGo {
			out = append(out, "type "+name+" struct {")
		} else {
			out = append(out, "export interface "+name+" {")
		}
		fields, _ := decl["fields"].([]any)
		for i, fv := range fields {
			f, _ := fv.(map[string]any)
			fpath := path + ".fields." + itoa(i)
			out = append(out, lowerDoc(lowerMap(f, "doc"), 1, ctx)...)
			fname := lowerIdent(lowerStr(f, "name"), "field", ctx, fpath+".name", false)
			ftype := lowerMap(f, "type")
			typ := lowerTypeExpr(ftype, ctx, fpath+".type")
			lowerChecks(f["check"], fpath, ctx)
			opt, _ := f["optional"].(bool)
			if isGo {
				star := ""
				if opt && "opt" != lowerStr(ftype, "k") {
					star = "*"
				}
				tag := lowerStr(f, "name")
				if opt {
					tag += ",omitempty"
				}
				out = append(out, lowerLine(1, fname+" "+star+typ.text+" `json:\""+tag+"\"`"))
			} else {
				q := ""
				if opt {
					q = "?"
				}
				out = append(out, lowerLine(1, fname+q+": "+typ.text+";"))
			}
			if _, has := f["default"]; has {
				what := "typescript interface"
				if isGo {
					what = "go struct"
				}
				lowerLoss(ctx, fpath+".default", "default", "a field default is not expressed by a "+what)
			}
		}
		if open, _ := decl["open"].(bool); open {
			if isGo {
				lowerLoss(ctx, path+".open", "open", "go has no open struct: extra keys are dropped")
			} else {
				out = append(out, lowerLine(1, "[key: string]: unknown;"))
			}
		}
		lowerChecks(decl["check"], path, ctx)
		out = append(out, "}")
		return out

	case "enum":
		name := lowerIdent(lowerStr(decl, "name"), "enum", ctx, path+".name", true)
		out = append(out, lowerDoc(lowerMap(decl, "doc"), 0, ctx)...)
		members, _ := decl["members"].([]any)
		if isGo {
			numeric := 0 < len(members)
			for _, mv := range members {
				m, _ := mv.(map[string]any)
				switch m["value"].(type) {
				case int64, float64:
				default:
					numeric = false
				}
			}
			base := "string"
			if numeric {
				base = "int"
			}
			out = append(out, "type "+name+" "+lowerPrim(ctx, base), lowerBlank(), "const (")
			for i, mv := range members {
				m, _ := mv.(map[string]any)
				out = append(out, lowerDoc(lowerMap(m, "doc"), 1, ctx)...)
				mname := name + lowerIdent(lowerStr(m, "name"), "member", ctx, path+".members."+itoa(i)+".name", false)
				value := ""
				if _, has := m["value"]; has {
					value = lowerLiteral(m["value"], ctx)
				} else {
					value = lowerQuote(lowerStr(m, "name"), ctx.profile)
				}
				out = append(out, lowerLine(1, mname+" "+name+" = "+value))
			}
			out = append(out, ")")
		} else {
			out = append(out, "export enum "+name+" {")
			for i, mv := range members {
				m, _ := mv.(map[string]any)
				out = append(out, lowerDoc(lowerMap(m, "doc"), 1, ctx)...)
				mname := lowerIdent(lowerStr(m, "name"), "member", ctx, path+".members."+itoa(i)+".name", false)
				if _, has := m["value"]; has {
					mname += " = " + lowerLiteral(m["value"], ctx)
				}
				out = append(out, lowerLine(1, mname+","))
			}
			out = append(out, "}")
		}
		return out

	case "alias":
		name := lowerIdent(lowerStr(decl, "name"), "alias", ctx, path+".name", true)
		out = append(out, lowerDoc(lowerMap(decl, "doc"), 0, ctx)...)
		typ := lowerTypeExpr(lowerMap(decl, "type"), ctx, path+".type").text
		lowerChecks(decl["check"], path, ctx)
		if isGo {
			out = append(out, "type "+name+" "+typ)
		} else {
			out = append(out, "export type "+name+" = "+typ+";")
		}
		return out

	case "const":
		name := lowerIdent(lowerStr(decl, "name"), "const", ctx, path+".name", true)
		out = append(out, lowerDoc(lowerMap(decl, "doc"), 0, ctx)...)
		typ := ""
		if t := lowerMap(decl, "type"); nil != t {
			typ = lowerTypeExpr(t, ctx, path+".type").text
		}
		value := lowerLiteral(decl["value"], ctx)
		if isGo {
			if "" != typ {
				typ = " " + typ
			}
			out = append(out, "const "+name+typ+" = "+value)
		} else {
			if "" != typ {
				typ = ": " + typ
			}
			out = append(out, "export const "+name+typ+" = "+value+";")
		}
		return out
	}

	// func
	name := lowerIdent(lowerStr(decl, "name"), "func", ctx, path+".name", true)
	out = append(out, lowerDoc(lowerMap(decl, "doc"), 0, ctx)...)
	params, _ := decl["params"].([]any)
	sig := lowerParams(params, ctx, path)
	returns := ""
	hasReturns := false
	if r := lowerMap(decl, "returns"); nil != r {
		returns = lowerTypeExpr(r, ctx, path+".returns").text
		hasReturns = true
	}
	body := lowerMap(decl, "body")
	abstract := "abstract" == lowerStr(body, "k")
	bodyOf, _ := body["of"].([]any)
	if isGo {
		head := "func " + name + "(" + sig + ")"
		if hasReturns {
			head += " " + returns
		}
		out = append(out, head+" {")
		if abstract {
			lowerLoss(ctx, path+".body", "abstract", "go has no abstract function: the body panics")
			out = append(out, lowerLine(1, "panic("+lowerQuote("abstract", ctx.profile)+")"))
		} else {
			out = append(out, lowerNest(bodyOf)...)
		}
		out = append(out, "}")
		return out
	}
	ret := ": void"
	if hasReturns {
		ret = ": " + returns
	}
	if abstract {
		out = append(out, "export declare function "+name+"("+sig+")"+ret+";")
		return out
	}
	out = append(out, "export function "+name+"("+sig+")"+ret+" {")
	out = append(out, lowerNest(bodyOf)...)
	out = append(out, "}")
	return out
}
