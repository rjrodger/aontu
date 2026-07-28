/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"math/big"
	"reflect"
	"strconv"
	"strings"
	"sync"
	"unicode/utf8"

	expr "github.com/tabnas/expr/go"
	jsonic "github.com/tabnas/jsonic/go"
	multisource "github.com/tabnas/multisource/go"
	path "github.com/tabnas/path/go"
)

// The parser is built on the Go ports of the @tabnas parser stack
// (@tabnas/jsonic and its expr and path plugins) — the same stack the
// canonical TypeScript parser (ts/src/lang.ts) uses. This keeps syntax in
// parity instead of maintaining a divergent hand-written parser.
//
// Construction model (important): the Go jsonic port emits plain Go
// values (map[string]any, []any, float64, string, bool, nil) and shares
// the node reference between the `val` and `map` rules, so replacing a
// map node in the `map` rule does not propagate upward. We therefore:
//   1. wrap scalar leaves into Vals in the `val` rule (capturing the
//      source byte offset for error ordering),
//   2. record key order on each map via a sentinel entry in the `pair`
//      rule (Go maps are unordered, unlike JS objects), and
//   3. convert map[string]any -> MapVal and []any -> ListVal in a final
//      post-walk (asVal).
//
// The grammar layers the expr operators (& | * $ . +), the path plugin,
// custom rules for &: spreads and a?: optional keys, and the multisource
// plugin for @"file" loading — the same stack and order as ts/src/lang.ts.

// orderKey is the sentinel map entry holding insertion order, spreadKey
// holds the &: spread value. The reserved prefix keeps them from
// colliding with real keys; a source key carrying the prefix is rejected
// (see trackOrder) rather than silently corrupting the map. (The TS
// implementation stores this state under a Symbol, so it is immune; this
// guard keeps the Go behaviour safe for the same exotic input.)
const reservedKeyPrefix = "\x00aontu_"
const orderKey = reservedKeyPrefix + "order"
const spreadKey = reservedKeyPrefix + "spread"
const optionalKey = reservedKeyPrefix + "optional"

// theLang is the default parser (base ""), resolving relative @"file"
// loads from the process working directory.
var theLang = mustMakeLang("")

// langCache memoises base -> parser. multisource resolves a top-level
// load's relative path against opts.Path, which is fixed when the plugin
// is applied, so each distinct non-empty entry base needs its own parser.
// (Nested loads inside a loaded file are rebased per-file by multisource
// itself, via the jsonic context meta.)
var (
	langCacheMu sync.Mutex
	langCache   = map[string]*jsonic.Jsonic{}
)

// maxLangCache bounds the number of cached per-base parsers (see
// langForBase) so a long-running process cannot grow the cache without
// limit.
const maxLangCache = 256

// langForBase returns a parser whose relative @"file" loads resolve
// against base. Base "" reuses the shared default parser.
func langForBase(base string) (*jsonic.Jsonic, error) {
	if base == "" {
		return theLang, nil
	}
	langCacheMu.Lock()
	defer langCacheMu.Unlock()
	if j, ok := langCache[base]; ok {
		return j, nil
	}
	j, err := makeLang(base)
	if err != nil {
		return nil, err
	}
	// Bound memory in long-running hosts (e.g. the LSP) that may resolve
	// many distinct bases over their lifetime: once the cache is full,
	// stop adding rather than growing without limit. Bases past the cap
	// are rebuilt per call (slower) but never leak.
	if len(langCache) < maxLangCache {
		langCache[base] = j
	}
	return j, nil
}

func boolPtr(b bool) *bool { return &b }

func mustMakeLang(base string) *jsonic.Jsonic {
	j, err := makeLang(base)
	if err != nil {
		panic("aontu: jsonic grammar setup failed: " + err.Error())
	}
	return j
}

func makeLang(base string) (*jsonic.Jsonic, error) {
	j := jsonic.Make(jsonic.Options{
		// Only # line comments are valid Aontu syntax (see
		// docs/reference-language.md; ts/src/lang.ts sets the same). A
		// non-nil Def replaces the parser's comment marker defaults
		// (#, //, /* */) wholesale, so the comment set is hash-only
		// regardless of those defaults.
		Comment: &jsonic.CommentOptions{
			Lex: boolPtr(true),
			Def: map[string]*jsonic.CommentDef{
				"hash": {Line: true, Start: "#"},
			},
		},
		// See tsTextCheck: unquoted text must run through quote chars
		// (`x:tail` + "`" is the text "tail`"), as in the TS lexer.
		Text: &jsonic.TextOptions{Check: tsTextCheck},
		// See tsNumCheck: a numeric prefix of a larger text token is
		// not a number ("100'sq'" is one text token), as in TS.
		Number: &jsonic.NumberOptions{Check: tsNumCheck},
		Value: &jsonic.ValueOptions{
			Lex: boolPtr(true),
			Def: map[string]*jsonic.ValueDef{
				"string":  kindDef(KindString),
				"number":  kindDef(KindNumber),
				"integer": kindDef(KindInteger),
				"boolean": kindDef(KindBoolean),
				"top":     valDef(func(int) Val { return top() }),
				"nil":     valDef(func(sp int) Val { n := newNil("literal_nil"); n.sp = sp; return n }),
				"true":    valDef(func(sp int) Val { v := newBoolean(true); v.sp = sp; return v }),
				"false":   valDef(func(sp int) Val { v := newBoolean(false); v.sp = sp; return v }),
				"null":    valDef(func(sp int) Val { v := newNull(); v.sp = sp; return v }),
			},
		},
		Map: &jsonic.MapOptions{
			// Duplicate keys combine into a conjunct (mirrors the jsonic
			// merge in ts/src/lang.ts), e.g. `a:1 a:2` -> `a:1&2`.
			Merge: func(prev, val any, r *jsonic.Rule, ctx *jsonic.Context) any {
				// A new key (prev == nil) has nothing to unify — take the
				// value as-is. (asVal(nil) is an empty MapVal, so merging
				// would wrongly yield `{} & val`.) tabnas's multisource calls
				// this for every key of a top-level @"file" load, including
				// new ones, so this guard is required for source loading.
				if prev == nil {
					return val
				}
				return mergeVals(asVal(prev), asVal(val))
			},
		},
	})

	if err := j.Use(expr.Expr, map[string]interface{}{
		"op": map[string]interface{}{
			"conjunct":      map[string]interface{}{"infix": true, "src": "&", "left": 16000000, "right": 17000000},
			"disjunct":      map[string]interface{}{"infix": true, "src": "|", "left": 14000000, "right": 15000000},
			"star":          map[string]interface{}{"prefix": true, "src": "*", "right": 24000000},
			"dollar-prefix": map[string]interface{}{"prefix": true, "src": "$", "right": 31000000},
			"dot-infix":     map[string]interface{}{"infix": true, "src": ".", "left": 25000000, "right": 24000000},
			"dot-prefix":    map[string]interface{}{"prefix": true, "src": ".", "right": 24000000},
			// Override the default `+` (addition) precedence to match the
			// aontu plus operator (binds tighter than & and |).
			"addition": map[string]interface{}{"infix": true, "src": "+", "left": 20000000, "right": 21000000},
			// Replace the default grouping paren with a preval-active
			// function paren: `name(args)` is a call, `(expr)` is grouping.
			"plain": nil,
			// Disable the default arithmetic infix ops (mirrors
			// ts/src/lang.ts): only + is an Aontu operator. With these
			// removed, / and % are plain text chars (`a:6/2` is the bare
			// string "6/2") and infix - and * are syntax errors.
			"subtraction":    nil,
			"multiplication": nil,
			"division":       nil,
			"remainder":      nil,
			"func": map[string]interface{}{
				"paren": true, "osrc": "(", "csrc": ")",
				"preval": map[string]interface{}{"active": true},
			},
		},
		"evaluate": evaluate,
	}); err != nil {
		return nil, err
	}

	if err := j.Use(path.Path, nil); err != nil {
		return nil, err
	}

	// A dangling operator at end of input (`a:1&`, `a:$`, `a:.`) makes
	// the pinned @tabnas/expr Go port build a self-referential term: the
	// expression slice contains its own ListRef wrapper. Its recursive
	// evaluation (run in the expr rule's own after-close action) would
	// then recurse forever — a fatal, unrecoverable stack overflow. The
	// TS plugin instead drops such unfilled terms. Prepend an action
	// that snips the back-edges first, restoring the TS shape; the
	// evaluate() guards below then map any now-missing operand to an
	// `incomplete_expression` nil (mirroring ts/src/lang.ts).
	j.Rule("expr", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependAC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			if r.N["expr"] < 1 {
				parent := r.Parent
				if parent != nil && parent != jsonic.NoRule {
					parent.Node = snipExprCycles(parent.Node)
				}
			}
		})
	})

	// The `&` operator token (for &: spread) and the `?` token (for
	// optional keys, a?:1).
	cj := j.Token("#E&")
	cl := jsonic.TinCL

	// expr: a `&` followed by `:` after an expression value belongs to
	// the enclosing map as a spread, not to the expression as a conjunct
	// — backtrack both tokens so the expression completes (and
	// evaluates) and the map's spread alts take over. This makes infix
	// expressions before a spread parse (`zz:-2.5+-2.5 &:string`),
	// matching the expr-rule close alt in ts/src/lang.ts. The
	// expr-counter reset mirrors the plugin's own expr-end alts, whose
	// evaluation after-close only runs at counter zero.
	j.Rule("expr", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{cj}, {cl}}, B: 2,
				N: map[string]int{"expr": 0},
				G: "expr,expr-end,spread",
			},
		)
	})
	qm := j.Token("#QM", "?")
	optkey := []jsonic.Tin{jsonic.TinTX, jsonic.TinST, jsonic.TinNR}

	// val: a leading `&:` is an implicit spread map (a:&:{x:1}); push to
	// map without consuming. Otherwise wrap scalar leaves into Vals.
	// An optional key at the top level (`a?:1` with no braces) needs the
	// val rule to dive into a map on seeing `key ?`, with a fresh node
	// so the descended map does not share the parent's node object
	// (mirrors the two OPTKEY,QM val alts in ts/src/lang.ts).
	freshMapNode := func(r *jsonic.Rule, _ *jsonic.Context) { r.Node = map[string]any{} }

	j.Rule("val", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, P: "map", B: 2, G: "spread"},
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{optkey, {qm}},
				C: func(r *jsonic.Rule, _ *jsonic.Context) bool { return r.D == 0 },
				P: "map", B: 2, A: freshMapNode, G: "optional",
			},
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{optkey, {qm}},
				P: "map", B: 2, N: map[string]int{"pk": 1}, A: freshMapNode,
				G: "optional,dive",
			},
		)
		// On close, a following `&:` belongs to the enclosing map as a
		// spread, not a conjunct — backtrack so the map can take it.
		rs.PrependClose(
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, B: 2, G: "spread"},
		)
		rs.AddAC(wrapLeaf)
	})

	// map: a leading `&:` pushes to pair without consuming; `key ?` is
	// an optional-key pair (for the top-level `a?:1` dive from val).
	// On close, a `&:` bubbles up (mirrors the map close in
	// ts/src/lang.ts) so a sibling spread after an implicit colon-chain
	// map reattaches at the right level (see the pair close alts).
	j.Rule("map", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, P: "pair", B: 2, G: "spread"},
			&jsonic.AltSpec{S: [][]jsonic.Tin{optkey, {qm}}, P: "pair", B: 2, G: "optional"},
		)
		rs.PrependClose(
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, B: 2, G: "spread"},
		)
	})

	// pair: `&:value` is a spread (stored on the enclosing map);
	// otherwise record key order.
	j.Rule("pair", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, P: "val", U: map[string]any{"spread": true}, G: "spread"},
			// `key ? : value` — optional key.
			&jsonic.AltSpec{S: [][]jsonic.Tin{optkey, {qm}, {cl}}, P: "val", U: map[string]any{"optional": true}, G: "optional"},
		)
		rs.PrependClose(
			// A following `&:` starts a sibling spread pair in the
			// current map: directly inside a braced map (pk<=0) at any
			// depth, or in the implicit top-level map (dmap<=1). Inside
			// an implicit colon-chain map (pk>0) it bubbles up instead
			// (second alt), so `&:k:a &:p:2` yields two sibling spreads
			// on the enclosing map, not a spread nested in the first
			// spread's template (mirrors the pair close in ts/src/lang.ts).
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{cj}, {cl}},
				C: func(r *jsonic.Rule, _ *jsonic.Context) bool {
					return r.N["pk"] <= 0 || r.N["dmap"] <= 1
				},
				R: "pair", B: 2, G: "spread",
			},
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, B: 2, G: "spread"},
		)
		rs.AddAC(trackOrder)
	})

	// elem: a `&:value` list element is a spread; jsonic appends it as a
	// normal element, so replace it with a marker that asVal extracts.
	j.Rule("elem", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{S: [][]jsonic.Tin{{cj}, {cl}}, P: "val", U: map[string]any{"spread": true}, G: "spread"},
		)
		rs.AddAC(elemSpread)
	})

	if err := j.Use(multisource.MultiSource, msOptions(base)); err != nil {
		return nil, err
	}

	return j, nil
}

// listSpread marks the &: spread value within a parsed list slice.
type listSpread struct{ val Val }

func elemSpread(r *jsonic.Rule, _ *jsonic.Context) {
	if r.U["spread"] != true {
		return
	}
	list, ok := r.Node.([]any)
	if !ok || len(list) == 0 {
		return
	}
	sv := asVal(r.Child.Node)
	if ls, ok := list[len(list)-1].(*listSpread); ok {
		ls.val = mergeVals(ls.val, sv)
		return
	}
	list[len(list)-1] = &listSpread{val: sv}
}

func kindDef(k Kind) *jsonic.ValueDef {
	return &jsonic.ValueDef{Val: jsonic.TokenValFunc(func(r *jsonic.Rule, _ *jsonic.Context) any {
		v := newScalarKind(k)
		if r.ON > 0 {
			v.sp = r.O0.SI
		}
		return v
	})}
}

func valDef(mk func(sp int) Val) *jsonic.ValueDef {
	return &jsonic.ValueDef{Val: jsonic.TokenValFunc(func(r *jsonic.Rule, _ *jsonic.Context) any {
		sp := -1
		if r.ON > 0 {
			sp = r.O0.SI
		}
		return mk(sp)
	})}
}

// wrapLeaf converts a plain scalar leaf (number/string/bool) produced by
// jsonic into the matching Val, recording the source byte offset.
func wrapLeaf(r *jsonic.Rule, _ *jsonic.Context) {
	// Leave the @"path" argument of the multisource directive as a raw
	// string so the directive can read it (it extracts the path itself,
	// unlike the TS resolver which reads StringVal.peg).
	if r.Parent != nil && r.Parent.Name == "multisource" {
		return
	}
	sp := -1
	src := ""
	if r.ON > 0 {
		sp = r.O0.SI
		src = r.O0.Src
	}
	switch n := r.Node.(type) {
	case float64:
		r.Node = numberVal(n, src, sp)
	case string:
		// An overflowing numeric literal (1e999) fails Go's float
		// parsing and falls back to text; in TS it lexes to Infinity,
		// which is a not_number error nil. Match that — but only for
		// unquoted text (a quoted "1e999" stays a string).
		if r.ON > 0 && r.O0.Tin == jsonic.TinTX && n == src && overflowsFloat(src) {
			e := newNil("not_number")
			e.sp = sp
			r.Node = e
			return
		}
		v := newString(n)
		v.sp = sp
		r.Node = v
	case bool:
		v := newBoolean(n)
		v.sp = sp
		r.Node = v
	}
}

// overflowsFloat reports whether src is a numeric literal whose value
// overflows a float64 (strconv rejects it with ErrRange; JS lexes it as
// Infinity).
func overflowsFloat(src string) bool {
	_, err := strconv.ParseFloat(src, 64)
	if err == nil {
		return false
	}
	ne, ok := err.(*strconv.NumError)
	return ok && ne.Err == strconv.ErrRange
}

// numberVal picks IntegerVal vs NumberVal: a number is an integer when
// its source has no decimal point (mirrors ts/src/lang.ts).
func numberVal(n float64, src string, sp int) Val {
	if !strings.Contains(src, ".") && n == float64(int64(n)) {
		v := newInteger(int64(n))
		v.sp = sp
		return v
	}
	v := newNumber(n)
	v.sp = sp
	return v
}

// trackOrder appends this pair's key to the enclosing map's insertion
// order (first occurrence wins; duplicates are merged by value).
func trackOrder(r *jsonic.Rule, _ *jsonic.Context) {
	m, ok := r.Node.(map[string]any)
	if !ok {
		return
	}
	// A &: spread pair: store the spread value (merge multiple spreads
	// into a conjunct) rather than recording it as a key.
	if r.U["spread"] == true {
		cn := r.Child.Node
		// An elided spread value (`x:$obj&:` at end of input) never
		// became a node — TS's MapVal constructor drops the falsy
		// spread entirely, so store nothing.
		if cn == nil || jsonic.IsUndefined(cn) {
			return
		}
		sv := asVal(cn)
		if existing, ok := m[spreadKey]; ok {
			m[spreadKey] = mergeVals(existing.(Val), sv)
		} else {
			m[spreadKey] = sv
		}
		return
	}

	key := keyOf(r.O0)

	// Reject a source key in the reserved sentinel namespace: it would
	// collide with the order/spread/optional entries above and silently
	// corrupt the map. The parser's recover turns this panic into a
	// normal parse error (it never crashes the process).
	if strings.HasPrefix(key, reservedKeyPrefix) {
		panic("aontu: map key may not begin with the reserved prefix " +
			`"\x00aontu_"`)
	}

	// An optional pair (key?:value): the custom alt bypasses jsonic's
	// value storage, so store the value ourselves and record the key.
	// A duplicate key merges into a conjunct exactly like the Map.Merge
	// option does for normal pairs (`a:1 a?:2` -> `a:1&2`).
	if r.U["optional"] == true {
		opt, _ := m[optionalKey].([]string)
		m[optionalKey] = append(opt, key)
		var cn any
		if r.Child != nil {
			cn = r.Child.Node
		}
		// An elided optional value (`a?:`) is null, like `a:` (the nil
		// becomes a NullVal in asVal).
		if prev, ok := m[key]; ok && prev != nil {
			m[key] = mergeVals(asVal(prev), asVal(cn))
		} else {
			m[key] = cn
		}
	}

	ord, _ := m[orderKey].([]string)
	for _, k := range ord {
		if k == key {
			return
		}
	}
	m[orderKey] = append(ord, key)
}

func keyOf(t *jsonic.Token) string {
	if t == nil {
		return ""
	}
	if t.Tin == jsonic.TinST || t.Tin == jsonic.TinTX {
		if s, ok := t.Val.(string); ok {
			return s
		}
	}
	return t.Src
}

// tsTextCheck reproduces the TS lexer's treatment of quote characters
// inside unquoted text. The TS text matcher's ender set is space, line,
// ender, fixed and comment starters — NOT string quote chars — so
// `x:tail` + "`" lexes as the text "tail`". The Go port's text matcher
// also stops at StringChars, which would then hand the stray quote to
// the string matcher (unterminated-string error). When a quote appears
// mid-text, emit the full TS-style text token here; otherwise defer to
// the default matcher (which also handles value keywords). A quote at
// the *start* of a value never reaches the text stage — the string
// matcher runs first — so string literals are unaffected.
func tsTextCheck(l *jsonic.Lex) *jsonic.LexCheckResult {
	pnt := l.Cursor()
	start := pnt.SI
	if start >= pnt.Len {
		return nil
	}

	sI, sawQuote := scanTextExtent(l, start, false)

	// No mid-text quote: the default text matcher produces the same
	// token (and handles value keywords).
	if !sawQuote || sI == start {
		return nil
	}

	msrc := l.Src[start:sI]
	tkn := l.Token("#TX", jsonic.TinTX, msrc, msrc)
	pnt.SI += len(msrc)
	pnt.CI += utf8.RuneCountInString(msrc)
	return &jsonic.LexCheckResult{Done: true, Token: tkn}
}

// scanTextExtent scans forward from start using the TS lexer's text
// ender set — space, line, ender, fixed tokens and comment starters,
// but NOT quote chars — returning the extent end and whether a quote
// char was passed through. With expo set, an exponent sign continues
// the scan (`1e-7` — number-check extents only; plain text stops at
// the fixed `-`).
func scanTextExtent(l *jsonic.Lex, start int, expo bool) (int, bool) {
	cfg := l.Config
	src := l.Src
	sI := start
	sawQuote := false
	for sI < len(src) {
		ch, chSize := utf8.DecodeRuneInString(src[sI:])
		if (cfg.SpaceLex && cfg.SpaceChars[ch]) ||
			(cfg.LineLex && cfg.LineChars[ch]) ||
			cfg.EnderChars[ch] {
			break
		}
		rest := src[sI:]
		fixed := false
		for _, fs := range cfg.FixedSorted {
			if strings.HasPrefix(rest, fs) {
				fixed = true
				break
			}
		}
		if fixed {
			// An exponent sign is part of a numeric token (`1e-7`), not
			// a fixed operator token — the TS number pattern consumes
			// it before the ender check.
			if expo && (ch == '-' || ch == '+') && sI > start && sI+chSize < len(src) {
				prev := src[sI-1]
				next := src[sI+chSize]
				if (prev == 'e' || prev == 'E') && next >= '0' && next <= '9' {
					sI += chSize
					continue
				}
			}
			break
		}
		if cfg.CommentLex {
			cmt := false
			for _, cs := range cfg.CommentLine {
				if strings.HasPrefix(rest, cs) {
					cmt = true
					break
				}
			}
			if !cmt {
				for _, cb := range cfg.CommentBlock {
					if strings.HasPrefix(rest, cb[0]) {
						cmt = true
						break
					}
				}
			}
			if cmt {
				break
			}
		}
		if cfg.StringLex && cfg.StringChars[ch] {
			sawQuote = true
		}
		sI += chSize
	}
	return sI, sawQuote
}

// tsNumCheck suppresses the number matcher when the full TS-style text
// extent at this position is not entirely numeric: the TS lexer only
// lexes a number when the whole token is one, whereas the Go port's
// matcher would take the numeric prefix ("100'sq'" must be the single
// text token "100'sq'", not the number 100 followed by 'sq').
func tsNumCheck(l *jsonic.Lex) *jsonic.LexCheckResult {
	pnt := l.Cursor()
	start := pnt.SI
	if start >= pnt.Len {
		return nil
	}
	sI, _ := scanTextExtent(l, start, true)
	if sI == start {
		return nil
	}
	if fullNumeric(l.Src[start:sI]) {
		// A base-prefixed integer beyond int64 (0xffffffffffffffff)
		// overflows the standard number matcher into a text fallback,
		// but is a finite float in JS — construct the numeric token
		// here with the JS value (big-int digits, float64 precision).
		src := l.Src[start:sI]
		s := strings.ReplaceAll(src, "_", "")
		if basedNumeric(s) {
			if _, ierr := strconv.ParseInt(s, 0, 64); ierr != nil {
				if f, ok := basedFloat(s); ok {
					tkn := l.Token("#NR", jsonic.TinNR, f, src)
					pnt.SI = sI
					pnt.CI += sI - start
					return &jsonic.LexCheckResult{Done: true, Token: tkn}
				}
			}
		}
		return nil
	}
	// Not a complete number: let the text matcher take the extent.
	return &jsonic.LexCheckResult{Done: true, Token: nil}
}

// basedFloat evaluates a syntactically valid base-prefixed integer
// literal of any magnitude to the float64 JS would produce.
func basedFloat(s string) (float64, bool) {
	neg := false
	if s[0] == '+' || s[0] == '-' {
		neg = s[0] == '-'
		s = s[1:]
	}
	var b int
	switch s[1] {
	case 'x', 'X':
		b = 16
	case 'o', 'O':
		b = 8
	default:
		b = 2
	}
	bi, ok := new(big.Int).SetString(s[2:], b)
	if !ok {
		return 0, false
	}
	f, _ := new(big.Float).SetInt(bi).Float64()
	if neg {
		f = -f
	}
	return f, true
}

// fullNumeric reports whether src parses in its entirety as a numeric
// literal (decimal/exponent, hex/octal/binary, or with _ separators).
// An overflowing literal still counts (it becomes not_number later),
// and base-prefixed integers beyond int64 are still numeric (JS
// Number('0xffffffffffffffff') is a finite float).
func fullNumeric(src string) bool {
	s := strings.ReplaceAll(src, "_", "")
	if s == "" {
		return false
	}
	if basedNumeric(s) {
		return true
	}
	_, err := strconv.ParseFloat(s, 64)
	if err == nil {
		return true
	}
	if ne, ok := err.(*strconv.NumError); ok && ne.Err == strconv.ErrRange {
		return true
	}
	_, ierr := strconv.ParseInt(s, 0, 64)
	return ierr == nil
}

// basedNumeric reports whether s is a syntactically valid base-prefixed
// (0x/0o/0b) integer literal of ANY magnitude, with optional sign.
func basedNumeric(s string) bool {
	if len(s) > 0 && (s[0] == '+' || s[0] == '-') {
		s = s[1:]
	}
	if len(s) < 3 || s[0] != '0' {
		return false
	}
	var ok func(byte) bool
	switch s[1] {
	case 'x', 'X':
		ok = func(c byte) bool {
			return '0' <= c && c <= '9' || 'a' <= c && c <= 'f' || 'A' <= c && c <= 'F'
		}
	case 'o', 'O':
		ok = func(c byte) bool { return '0' <= c && c <= '7' }
	case 'b', 'B':
		ok = func(c byte) bool { return c == '0' || c == '1' }
	default:
		return false
	}
	for i := 2; i < len(s); i++ {
		if !ok(s[i]) {
			return false
		}
	}
	return true
}

// snipExprCycles removes cyclic back-edges from an expression tree: a
// dangling trailing operator makes the expr Go port append the
// expression's own ListRef wrapper (or slice) as its final term. Only
// true back-edges (an ancestor of the current walk) are dropped —
// legitimately shared nodes are untouched. See the expr rule action in
// makeLang.
func snipExprCycles(node any) any {
	out, _ := snipWalk(node, map[any]bool{})
	return out
}

// snipWalk returns (node, keep); keep is false when node is an ancestor
// back-edge and must be dropped by the caller. Slices are identified by
// their data pointer (only when non-empty: empty slices can share a
// zero-size allocation and must not alias each other).
func snipWalk(node any, seen map[any]bool) (any, bool) {
	switch v := node.(type) {
	case *jsonic.ListRef:
		if v == nil {
			return node, true
		}
		if seen[node] {
			return nil, false
		}
		seen[node] = true
		nv, keep := snipWalk(v.Val, seen)
		delete(seen, node)
		if keep {
			v.Val, _ = nv.([]any)
		} else {
			v.Val = nil
		}
		return v, true
	case []any:
		var key any
		if len(v) > 0 {
			key = reflect.ValueOf(v).Pointer()
			if seen[key] {
				return nil, false
			}
			seen[key] = true
		}
		out := make([]any, 0, len(v))
		for _, e := range v {
			ne, keep := snipWalk(e, seen)
			if keep {
				out = append(out, ne)
			}
		}
		if key != nil {
			delete(seen, key)
		}
		return out, true
	default:
		return node, true
	}
}

// incompleteNil is the evaluate() result for an operator whose required
// operand is missing (`a:$`, `a:1+`, `a:*` — a dangling operator whose
// unfilled term was snipped). Unify surfaces it as a "Cannot resolve
// value" error, mirroring the incomplete_expression NilVal in
// ts/src/lang.ts.
func incompleteNil(r *jsonic.Rule) Val {
	n := newNil("incomplete_expression")
	if r != nil && r.ON > 0 {
		n.sp = r.O0.SI
	}
	return n
}

// evaluate builds Val nodes for the expr operators.
func evaluate(r *jsonic.Rule, ctx *jsonic.Context, op *expr.Op, terms []interface{}) interface{} {
	// Top-level expression wrappers are evaluated outside any rule
	// (expr.Evaluation(nil, nil, ...) in asValDepth); the NoRule
	// sentinel keeps the r.ON source-position guards safe.
	if r == nil {
		r = jsonic.NoRule
	}
	// Drop unfilled (nil) operator terms — a dangling `*` in a list
	// leaves a nil term rather than a cyclic one — so the
	// missing-operand guards below fire exactly as the dropUnfilled
	// filter does in ts/src/lang.ts.
	kept := make([]interface{}, 0, len(terms))
	for _, t := range terms {
		if t != nil {
			kept = append(kept, t)
		}
	}
	terms = kept
	switch op.Name {
	case "conjunct-infix":
		vals := toVals(terms)
		c := newConjunct(vals)
		if len(vals) > 0 {
			c.sp = vals[0].pos()
		}
		return c
	case "disjunct-infix":
		vals := toVals(terms)
		d := newDisjunct(vals)
		if len(vals) > 0 {
			d.sp = vals[0].pos()
		}
		return d
	case "star-prefix":
		if len(terms) < 1 {
			return incompleteNil(r)
		}
		inner := asVal(terms[0])
		pv := newPref(inner)
		pv.sp = inner.pos()
		return pv
	case "negative-prefix":
		if len(terms) < 1 {
			return incompleteNil(r)
		}
		return negate(terms[0])
	case "positive-prefix":
		if len(terms) < 1 {
			return incompleteNil(r)
		}
		return asVal(terms[0])
	case "dot-prefix":
		if len(terms) < 1 {
			return incompleteNil(r)
		}
		rv := newRef(terms, true)
		if r.ON > 0 {
			rv.sp = r.O0.SI
		}
		return rv
	case "dot-infix":
		if len(terms) < 1 {
			return incompleteNil(r)
		}
		rv := newRef(terms, false)
		if r.ON > 0 {
			rv.sp = r.O0.SI
		}
		return rv
	case "dollar-prefix":
		if len(terms) < 1 {
			return incompleteNil(r)
		}
		// $.a.b -> absolute reference; $name -> variable (the name is
		// wrapped as a StringVal so canon renders as $"name").
		if r0, ok := terms[0].(*RefVal); ok {
			r0.absolute = true
			if r.ON > 0 {
				r0.sp = r.O0.SI
			}
			return r0
		}
		return newVar(asVal(terms[0]))
	case "addition-infix":
		if len(terms) < 2 {
			return incompleteNil(r)
		}
		return newPlusOp(asVal(terms[0]), asVal(terms[1]))
	case "func-paren":
		// preval injects the function name as a raw string term[0] for
		// `name(args)`; plain `(expr)` grouping has the inner Val in
		// term[0] (no name preval). So a string term[0] means a call —
		// an unrecognised name is an error, not grouping (mirrors the
		// `unknown_function` NilVal in ts/src/lang.ts func-paren).
		if len(terms) > 0 {
			if name, ok := terms[0].(string); ok {
				if !funcSet[name] {
					n := newNil("unknown_function")
					if r.ON > 0 {
						n.sp = r.O0.SI
					}
					return n
				}
				args := make([]Val, 0, len(terms)-1)
				for _, t := range terms[1:] {
					args = append(args, asVal(t))
				}
				return newFunc(name, args)
			}
			return asVal(terms[len(terms)-1])
		}
		// `a:()` — grouping parens with nothing inside.
		return incompleteNil(r)
	}
	return newNil("unknown_op")
}

// negate returns the arithmetic negation of a numeric operand.
func negate(t any) Val {
	switch v := t.(type) {
	case float64:
		return numberVal(-v, "", -1)
	case *ScalarVal:
		switch v.kind {
		case KindInteger:
			return newInteger(-v.peg.(int64))
		case KindNumber:
			return newNumber(-v.peg.(float64))
		}
	}
	return newNil("negative")
}

func toVals(terms []interface{}) []Val {
	out := make([]Val, len(terms))
	for i, t := range terms {
		out[i] = asVal(t)
	}
	return out
}

// maxNodeDepth bounds asVal's recursion so pathologically deep input
// (thousands of nested {}/[]) yields a clean error instead of a fatal,
// unrecoverable Go stack overflow. Because every Val tree is built by
// asVal, this also transitively bounds the depth that setPaths and
// clonePath (which walk asVal's output) ever recurse to, so they cannot
// overflow either. Real configs are orders of magnitude shallower.
const maxNodeDepth = 10000

// asVal converts a parsed jsonic node into a Val. Containers are
// converted recursively; map order comes from the order sentinel.
func asVal(node any) Val { return asValDepth(node, 0) }

func asValDepth(node any, depth int) Val {
	if depth > maxNodeDepth {
		return newNil("max_depth")
	}
	switch n := node.(type) {
	case Val:
		return n
	case *jsonic.ListRef:
		// An empty expression wrapper is an elided value (`a?:` with
		// nothing after the colon) — null, like a plain `a:`.
		if len(n.Val) == 0 && n.Child == nil {
			return newNull()
		}
		// A top-level expression is returned as an unevaluated expr
		// wrapper; evaluate it (map-value expressions are already
		// evaluated during parse). Snip any cyclic dangling-operator
		// back-edges first (see the expr rule action in makeLang).
		return asValDepth(expr.Evaluation(nil, nil, snipExprCycles(n), evaluate), depth+1)
	case map[string]any:
		mv := newMap()
		if sp, ok := n[spreadKey]; ok {
			mv.spread = sp.(Val)
		}
		if opt, ok := n[optionalKey].([]string); ok {
			mv.optional = opt
		}
		ord, _ := n[orderKey].([]string)
		for _, k := range ord {
			// Skip an order entry with no value: the multisource mark "@"
			// is recorded in order but injects its content under real keys.
			v, ok := n[k]
			if !ok {
				continue
			}
			mv.set(k, asValDepth(v, depth+1))
		}
		return mv
	case []any:
		lv := &ListVal{}
		for _, e := range n {
			if ls, ok := e.(*listSpread); ok {
				if lv.spread == nil {
					lv.spread = ls.val
				} else {
					lv.spread = mergeVals(lv.spread, ls.val)
				}
				continue
			}
			lv.peg = append(lv.peg, asValDepth(e, depth+1))
		}
		return lv
	case float64:
		// Source text is unavailable here (e.g. expr operands); treat an
		// integral value as an integer.
		return numberVal(n, "", -1)
	case string:
		return newString(n)
	case bool:
		return newBoolean(n)
	case nil:
		// An elided value or element (`a:`, `[,]`) is null in jsonic;
		// mirror the TS NullVal conversion. (An empty *source* still
		// yields {} — see the out == nil branch in parseBase.)
		return newNull()
	}
	// The jsonic Undefined sentinel marks a missing value (`a?:` with
	// nothing after the colon) — null, like an elided plain value.
	if jsonic.IsUndefined(node) {
		return newNull()
	}
	return newNil("parse_unknown")
}

// parse parses source into a (not yet unified) Val, resolving relative
// @"file" loads from the process working directory.
func parse(src string) (Val, error) {
	return parseBase(src, "")
}

// parseBase is parse with an explicit base directory for resolving
// relative @"file" loads.
func parseBase(src, base string) (Val, error) {
	lang, err := langForBase(base)
	if err != nil {
		return newMap(), &AontuError{Msg: err.Error()}
	}
	out, err := lang.Parse(src)
	if err != nil {
		return newMap(), &AontuError{Msg: err.Error()}
	}
	if out == nil {
		return newMap(), nil
	}
	root := asVal(out)
	setPaths(root, []string{})
	// A failed @"file" load is a parse error in TS (the multisource
	// plugin raises multisource_not_found during the parse); mirror that
	// by surfacing the injected not-found nil (see source.go) here.
	if nf := findNotFoundNil(root); nf != nil {
		return newMap(), &AontuError{Msg: nf.msg}
	}
	return root, nil
}

// findNotFoundNil walks a parsed Val tree for a multisource_not_found
// nil injected by notFoundProcessor (source.go).
func findNotFoundNil(v Val) *NilVal {
	switch t := v.(type) {
	case *NilVal:
		if t.why == "multisource_not_found" {
			return t
		}
	case *MapVal:
		if t.spread != nil {
			if n := findNotFoundNil(t.spread); n != nil {
				return n
			}
		}
		for _, k := range t.keys {
			if n := findNotFoundNil(t.peg[k]); n != nil {
				return n
			}
		}
	case *ListVal:
		if t.spread != nil {
			if n := findNotFoundNil(t.spread); n != nil {
				return n
			}
		}
		for _, e := range t.peg {
			if n := findNotFoundNil(e); n != nil {
				return n
			}
		}
	case *ConjunctVal:
		for _, e := range t.peg {
			if n := findNotFoundNil(e); n != nil {
				return n
			}
		}
	case *DisjunctVal:
		for _, e := range t.peg {
			if n := findNotFoundNil(e); n != nil {
				return n
			}
		}
	case *PrefVal:
		if t.peg != nil {
			if n := findNotFoundNil(t.peg); n != nil {
				return n
			}
		}
	case *FuncVal:
		for _, e := range t.peg {
			if n := findNotFoundNil(e); n != nil {
				return n
			}
		}
	}
	return nil
}
