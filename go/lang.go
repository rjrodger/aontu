/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"strings"
	"sync"

	expr "github.com/jsonicjs/expr/go"
	jsonic "github.com/jsonicjs/jsonic/go"
	multisource "github.com/jsonicjs/multisource/go"
	path "github.com/jsonicjs/path/go"
)

// The parser is built on the official Go ports of jsonic and its expr
// and path plugins — the same stack the canonical TypeScript parser
// (ts/src/lang.ts) uses. This keeps syntax in parity instead of
// maintaining a divergent hand-written parser.
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
// holds the &: spread value. The NUL prefix keeps them from colliding
// with real keys.
const orderKey = "\x00aontu_order"
const spreadKey = "\x00aontu_spread"
const optionalKey = "\x00aontu_optional"

// The default parser (base "") resolves relative @"file" loads from the
// process working directory. It is initialised lazily, not as a package
// var: its construction transitively references langForBase (via the
// loaded-source processor), which would otherwise be an init cycle.
var (
	defaultLangOnce sync.Once
	defaultLangInst *jsonic.Jsonic
)

func defaultLang() *jsonic.Jsonic {
	defaultLangOnce.Do(func() { defaultLangInst = mustMakeLang("") })
	return defaultLangInst
}

// langCache memoises base -> parser. The multisource base path is baked
// into the jsonic instance when the plugin is applied (it is captured in
// a closure, not read per-parse), so each distinct non-empty base needs
// its own parser.
var (
	langCacheMu sync.Mutex
	langCache   = map[string]*jsonic.Jsonic{}
)

// langForBase returns a parser whose relative @"file" loads resolve
// against base. Base "" reuses the shared default parser.
func langForBase(base string) (*jsonic.Jsonic, error) {
	if base == "" {
		return defaultLang(), nil
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
	langCache[base] = j
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

	// The `&` operator token (for &: spread) and the `?` token (for
	// optional keys, a?:1).
	cj := j.Token("#E&")
	cl := jsonic.TinCL
	qm := j.Token("#QM", "?")
	optkey := []jsonic.Tin{jsonic.TinTX, jsonic.TinST, jsonic.TinNR}

	// val: a leading `&:` is an implicit spread map (a:&:{x:1}); push to
	// map without consuming. Otherwise wrap scalar leaves into Vals.
	j.Rule("val", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.Open = append([]*jsonic.AltSpec{
			{S: [][]jsonic.Tin{{cj}, {cl}}, P: "map", B: 2, G: "spread"},
		}, rs.Open...)
		// On close, a following `&:` belongs to the enclosing map as a
		// spread, not a conjunct — backtrack so the map can take it.
		rs.Close = append([]*jsonic.AltSpec{
			{S: [][]jsonic.Tin{{cj}, {cl}}, B: 2, G: "spread"},
		}, rs.Close...)
		rs.AC = append(rs.AC, wrapLeaf)
	})

	// map: a leading `&:` pushes to pair without consuming.
	j.Rule("map", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.Open = append([]*jsonic.AltSpec{
			{S: [][]jsonic.Tin{{cj}, {cl}}, P: "pair", B: 2, G: "spread"},
		}, rs.Open...)
	})

	// pair: `&:value` is a spread (stored on the enclosing map);
	// otherwise record key order.
	j.Rule("pair", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.Open = append([]*jsonic.AltSpec{
			{S: [][]jsonic.Tin{{cj}, {cl}}, P: "val", U: map[string]any{"spread": true}, G: "spread"},
			// `key ? : value` — optional key.
			{S: [][]jsonic.Tin{optkey, {qm}, {cl}}, P: "val", U: map[string]any{"optional": true}, G: "optional"},
		}, rs.Open...)
		rs.AC = append(rs.AC, trackOrder)
	})

	// elem: a `&:value` list element is a spread; jsonic appends it as a
	// normal element, so replace it with a marker that asVal extracts.
	j.Rule("elem", func(rs *jsonic.RuleSpec, _ *jsonic.Parser) {
		rs.Open = append([]*jsonic.AltSpec{
			{S: [][]jsonic.Tin{{cj}, {cl}}, P: "val", U: map[string]any{"spread": true}, G: "spread"},
		}, rs.Open...)
		rs.AC = append(rs.AC, elemSpread)
	})

	// @"file" source loading — registered last so the multisource
	// directive layers over the aontu grammar (mirrors the ts/src/lang.ts
	// order: AontuJsonic then MultiSource).
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
		v := newString(n)
		v.sp = sp
		r.Node = v
	case bool:
		v := newBoolean(n)
		v.sp = sp
		r.Node = v
	}
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
		sv := asVal(r.Child.Node)
		if existing, ok := m[spreadKey]; ok {
			m[spreadKey] = mergeVals(existing.(Val), sv)
		} else {
			m[spreadKey] = sv
		}
		return
	}

	key := keyOf(r.O0)

	// An optional pair (key?:value): the custom alt bypasses jsonic's
	// value storage, so store the value ourselves and record the key.
	if r.U["optional"] == true {
		opt, _ := m[optionalKey].([]string)
		m[optionalKey] = append(opt, key)
		if r.Child != nil {
			m[key] = r.Child.Node
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

// evaluate builds Val nodes for the expr operators.
func evaluate(r *jsonic.Rule, ctx *jsonic.Context, op *expr.Op, terms []interface{}) interface{} {
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
		inner := asVal(terms[0])
		pv := newPref(inner)
		pv.sp = inner.pos()
		return pv
	case "negative-prefix":
		return negate(terms[0])
	case "positive-prefix":
		return asVal(terms[0])
	case "dot-prefix":
		return newRef(terms, true)
	case "dot-infix":
		return newRef(terms, false)
	case "dollar-prefix":
		// $.a.b -> absolute reference; $name -> variable (the name is
		// wrapped as a StringVal so canon renders as $"name").
		if r0, ok := terms[0].(*RefVal); ok {
			r0.absolute = true
			return r0
		}
		return newVar(asVal(terms[0]))
	case "addition-infix":
		return newPlusOp(asVal(terms[0]), asVal(terms[1]))
	case "func-paren":
		// `name(args)` is a function call (preval injects the name);
		// `(expr)` with no preval is parenthesised grouping.
		if len(terms) > 0 {
			if name, ok := terms[0].(string); ok && funcSet[name] {
				args := make([]Val, 0, len(terms)-1)
				for _, t := range terms[1:] {
					args = append(args, asVal(t))
				}
				return newFunc(name, args)
			}
			return asVal(terms[len(terms)-1])
		}
		return newMap()
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

// asVal converts a parsed jsonic node into a Val. Containers are
// converted recursively; map order comes from the order sentinel.
func asVal(node any) Val {
	switch n := node.(type) {
	case Val:
		return n
	case *jsonic.ListRef:
		// A top-level expression is returned as an unevaluated expr
		// wrapper; evaluate it (map-value expressions are already
		// evaluated during parse).
		return asVal(expr.Evaluation(nil, nil, n, evaluate))
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
			mv.set(k, asVal(v))
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
			lv.peg = append(lv.peg, asVal(e))
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
		return newMap()
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
	return root, nil
}
