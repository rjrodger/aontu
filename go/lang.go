/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"math"
	"strings"

	jsonic "github.com/jsonicjs/jsonic/go"
	"github.com/jsonicjs/expr/go"
	"github.com/jsonicjs/path/go"
)

// Lang wraps the jsonic parser with aontu grammar rules.
type Lang struct {
	jsonic *jsonic.Jsonic
	opts   *AontuOptions
	paths  []*PathVal
	keys   []*KeyFuncVal
}

// Marker types for special keyword values.
type scalarKindMarker struct{ kind ScalarKind }
type nilMarker struct{}
type topMarker struct{}

var (
	markerString  = &scalarKindMarker{KindString}
	markerNumber  = &scalarKindMarker{KindNumber}
	markerInteger = &scalarKindMarker{KindInteger}
	markerBoolean = &scalarKindMarker{KindBoolean}
	markerNil     = &nilMarker{}
	markerTop     = &topMarker{}
)

// spreadData holds spread constraint info during parsing.
type spreadData struct {
	op    string
	terms []interface{}
}

// NewLang creates a new parser instance.
func NewLang(opts *AontuOptions) *Lang {
	l := &Lang{opts: opts}

	j := jsonic.Make()

	// Install Path plugin for path tracking.
	j.Use(path.Path, nil)

	// Install Expr plugin with aontu operators.
	j.Use(expr.Expr, map[string]interface{}{
		"op": map[string]interface{}{
			"conjunct": map[string]interface{}{
				"infix": true, "src": "&",
				"left": 16_000_000, "right": 17_000_000,
			},
			"disjunct": map[string]interface{}{
				"infix": true, "src": "|",
				"left": 14_000_000, "right": 15_000_000,
			},
			"plus-infix": map[string]interface{}{
				"infix": true, "src": "+",
				"left": 20_000_000, "right": 21_000_000,
			},
			"dollar-prefix": map[string]interface{}{
				"prefix": true, "src": "$",
				"right": 31_000_000,
			},
			"dot-infix": map[string]interface{}{
				"infix": true, "src": ".",
				"left": 25_000_000, "right": 24_000_000,
			},
			"dot-prefix": map[string]interface{}{
				"prefix": true, "src": ".",
				"right": 24_000_000,
			},
			"star": map[string]interface{}{
				"prefix": true, "src": "*",
				"right": 24_000_000,
			},
			"func": map[string]interface{}{
				"paren": true,
				"preval": map[string]interface{}{
					"active": true,
				},
				"osrc": "(", "csrc": ")",
			},
			// Disable default arithmetic operators
			"plain":          nil,
			"addition":       nil,
			"subtraction":    nil,
			"multiplication": nil,
			"division":       nil,
			"remainder":      nil,
		},
		"evaluate": func(r *jsonic.Rule, ctx *jsonic.Context, op *expr.Op, terms []interface{}) interface{} {
			return l.evaluate(r, ctx, op, terms)
		},
	})

	// Register keyword value definitions for aontu type names.
	// Must re-include true/false/null since SetOptions replaces the entire Def map.
	j.SetOptions(jsonic.Options{
		Value: &jsonic.ValueOptions{
			Def: map[string]*jsonic.ValueDef{
				"true":    {Val: true},
				"false":   {Val: false},
				"null":    {Val: nil},
				"string":  {Val: markerString},
				"number":  {Val: markerNumber},
				"integer": {Val: markerInteger},
				"boolean": {Val: markerBoolean},
				"nil":     {Val: markerNil},
				"top":     {Val: markerTop},
			},
		},
		Map: &jsonic.MapOptions{
			Merge: func(prev, curr any, r *jsonic.Rule, ctx *jsonic.Context) any {
				return l.mapMerge(prev, curr, r, ctx)
			},
		},
	})

	// Register custom token for '?'
	j.Token("#QM", "?")

	// Add grammar rules for val, map, list, pair, elem.
	l.installRules(j)

	// Install @"path" file-import directive (multisource parity).
	installMultiSource(l, j)

	l.jsonic = j
	return l
}

// Parse converts a source string into a Val tree.
func (l *Lang) Parse(src string) (Val, error) {
	l.paths = nil
	l.keys = nil

	result, err := l.jsonic.Parse(src)
	if err != nil {
		return NewNilVal(&ValSpec{Why: "parse", Msg: err.Error()}), nil
	}

	val := l.wrapVal(result, nil, nil)
	if val == nil {
		return top(), nil
	}
	return val, nil
}

// evaluate handles the Expr plugin's operator evaluation callback.
// Go expr plugin appends operator type to name: "dot-prefix" becomes "dot-prefix-prefix",
// "plus-infix" becomes "plus-infix-infix". We normalize by extracting the base name.
func (l *Lang) evaluate(r *jsonic.Rule, ctx *jsonic.Context, op *expr.Op, terms []interface{}) interface{} {
	name := op.Name

	pathFromRule := getPathFromRule(r)
	site := getSiteFromRule(r, ctx)

	switch name {
	case "conjunct-infix":
		vals := l.wrapTerms(terms, r, ctx)
		cv := NewConjunctVal(&ValSpec{Peg: vals}, nil)
		applySite(cv, site)
		cv.path = pathFromRule
		return cv

	case "disjunct-infix":
		vals := l.wrapTerms(terms, r, ctx)
		dv := NewDisjunctVal(&ValSpec{Peg: vals}, nil)
		applySite(dv, site)
		dv.path = pathFromRule
		return dv

	case "dot-prefix":
		var segments []string
		for _, t := range terms {
			switch tv := t.(type) {
			case *PathVal:
				// Match TS: when prefix wraps another prefix PathVal, add "." go-up marker
				if tv.prefix {
					segments = append(segments, ".")
				}
				segments = append(segments, tv.PathSegments()...)
			case *IntegerVal:
				segments = append(segments, tv.src)
			case *NumberVal:
				parts := strings.Split(tv.src, ".")
				segments = append(segments, parts...)
			case string:
				segments = append(segments, tv)
			case Val:
				segments = append(segments, valToString(tv))
			}
		}
		pv := NewPathVal(&ValSpec{Peg: segments, Prefix: true}, nil)
		applySite(pv, site)
		pv.path = pathFromRule
		l.paths = append(l.paths, pv)
		return pv

	case "dot-infix":
		// Build path segments from terms, matching TS PathVal.append() logic:
		// - PathVal: flatten segments, propagate absolute/prefix
		// - StringVal/string: use as segment
		// - IntegerVal: use src as segment
		// - NumberVal: split src on "." into multiple segments (e.g. "1.2" → ["1","2"])
		var segments []string
		abs := false
		pfx := false
		for _, t := range terms {
			switch tv := t.(type) {
			case *PathVal:
				if tv.absolute {
					abs = true
				}
				// Match TS PathVal.append() — insert "." go-up marker
				// when combining prefix PathVals.
				if pfx {
					if tv.prefix {
						segments = append(segments, ".")
					}
				} else {
					if tv.prefix {
						if len(segments) == 0 {
							pfx = true
						} else {
							segments = append(segments, ".")
						}
					}
				}
				segments = append(segments, tv.PathSegments()...)
			case *IntegerVal:
				segments = append(segments, tv.src)
			case *NumberVal:
				// TS: part.src.split('.') — e.g. "1.2" → ["1", "2"]
				parts := strings.Split(tv.src, ".")
				segments = append(segments, parts...)
			case *StringVal:
				if s, ok := tv.peg.(string); ok {
					segments = append(segments, s)
				}
			case Val:
				c := valToString(tv)
				if c != "" {
					segments = append(segments, c)
				}
			case string:
				segments = append(segments, tv)
			default:
				segments = append(segments, fmt.Sprintf("%v", t))
			}
		}
		// Remove consumed intermediate PathVals from tracking
		for _, t := range terms {
			if pv, ok := t.(*PathVal); ok {
				for i, p := range l.paths {
					if p == pv {
						l.paths = append(l.paths[:i], l.paths[i+1:]...)
						break
					}
				}
			}
		}
		pv := NewPathVal(&ValSpec{Peg: segments, Absolute: abs, Prefix: pfx}, nil)
		applySite(pv, site)
		pv.path = pathFromRule
		l.paths = append(l.paths, pv)
		return pv

	case "star-prefix":
		val := l.wrapVal(terms[0], r, ctx)
		pv := NewPrefVal(&ValSpec{Peg: val}, nil)
		applySite(pv, site)
		pv.path = pathFromRule
		return pv

	case "dollar-prefix":
		t0 := terms[0]
		if pv, ok := t0.(*PathVal); ok {
			pv.absolute = true
			return pv
		}
		val := l.wrapVal(t0, r, ctx)
		if pv, ok := val.(*PathVal); ok {
			pv.absolute = true
			return pv
		}
		vv := NewVarVal(&ValSpec{Peg: valToString(val)}, nil)
		applySite(vv, site)
		vv.path = pathFromRule
		return vv

	case "plus-infix":
		vals := l.wrapTerms(terms, r, ctx)
		if len(vals) >= 2 {
			pov := NewPlusOpVal(&ValSpec{Peg: vals[:2]}, nil)
			applySite(pov, site)
			pov.path = pathFromRule
			return pov
		}
		return nil

	case "negative-prefix":
		val := l.wrapVal(terms[0], r, ctx)
		if nv, ok := val.(*NumberVal); ok {
			f := toFloat64(nv.peg)
			return NewNumberVal(&ValSpec{Peg: -f})
		}
		if iv, ok := val.(*IntegerVal); ok {
			n, _ := iv.peg.(int)
			return NewIntegerVal(&ValSpec{Peg: -n})
		}
		return val

	case "positive-prefix":
		return l.wrapVal(terms[0], r, ctx)

	case "func-paren":
		// Match TS: for func-paren without preval, prepend "" so
		// terms[0] is always the function name (or "" for plain parens).
		if r.U == nil || r.U["paren_preval"] == nil || r.U["paren_preval"] != true {
			terms = append([]interface{}{""}, terms...)
		}

		fname := ""
		if s, ok := terms[0].(string); ok {
			fname = s
		}

		if fname == "" {
			// Plain parens — return inner value (terms[1] after prepend)
			if len(terms) > 1 {
				return l.wrapVal(terms[1], r, ctx)
			}
			return top()
		}

		args := l.wrapTerms(terms[1:], r, ctx)

		constructor, exists := FuncMap[fname]
		if !exists {
			nv := NewNilVal(&ValSpec{Why: "unknown_function", Msg: "unknown function: " + fname})
			return nv
		}

		fv := constructor(&ValSpec{Peg: args}, nil)
		applySite(fv, site)
		fv.SetPath(pathFromRule)

		if kf, ok := fv.(*KeyFuncVal); ok {
			l.keys = append(l.keys, kf)
		}

		return fv
	}

	return terms
}


// mapMerge handles duplicate keys in maps by creating ConjunctVals.
// Matches TS: when both are Vals, creates ConjunctVal.
// When not both Vals (deferred case), stores in ___merge for later processing.
func (l *Lang) mapMerge(prev, curr any, r *jsonic.Rule, ctx *jsonic.Context) any {
	pval, pIsVal := prev.(Val)
	cval, cIsVal := curr.(Val)

	if pIsVal && cIsVal {
		if pval.IsConjunct() && cval.IsConjunct() {
			// Append all terms from cval's conjunct to pval
			pval.(*ConjunctVal).Append(cval)
			return pval
		}
		if pval.IsConjunct() {
			pval.(*ConjunctVal).Append(cval)
			return pval
		}
		cv := NewConjunctVal(&ValSpec{Peg: []Val{pval, cval}}, nil)
		site := getSiteFromRule(r, ctx)
		applySite(cv, site)
		return cv
	}

	// Handle deferred conjuncts, where MapVal does not yet exist.
	// Store in ___merge for later processing in map BC.
	// Matches TS: prev.___merge = (prev.___merge || []).push(curr)
	if pm, ok := prev.(map[string]interface{}); ok {
		if existing, ok := pm["___merge"].([]interface{}); ok {
			pm["___merge"] = append(existing, curr)
		} else {
			pm["___merge"] = []interface{}{curr}
		}
		return prev
	}

	return curr
}

// wrapVal converts a raw parse result into a Val.
func (l *Lang) wrapVal(node interface{}, r *jsonic.Rule, ctx *jsonic.Context) Val {
	// Note: Go nil can mean either "no value" (top) or JSON null.
	// In parse context, nil from jsonic typically means null was parsed.
	// We use NullVal for explicit null, but top() for truly absent values.
	if node == nil {
		// If called from BC with a parsed token, it's a JSON null
		if r != nil && r.O0 != nil {
			return NewNullVal(&ValSpec{})
		}
		return top()
	}

	// Already a Val
	if v, ok := node.(Val); ok {
		return v
	}

	// Marker types
	if m, ok := node.(*scalarKindMarker); ok {
		return NewScalarKindVal(&ValSpec{}, m.kind)
	}
	if _, ok := node.(*nilMarker); ok {
		return NewNilVal(&ValSpec{Why: "literal_nil"})
	}
	if _, ok := node.(*topMarker); ok {
		return top()
	}

	// Go nil = JSON null
	// (checked after markers since marker nil is different from JSON null)

	// Scalar values
	switch v := node.(type) {
	case string:
		return NewStringVal(&ValSpec{Peg: v})
	case float64:
		// Match TS: Number.isInteger(r.node) && !r.o0.src.includes('.')
		// 1.0 in source has a dot, so it's a NumberVal not IntegerVal.
		isInt := v == math.Trunc(v) && !math.IsInf(v, 0)
		if isInt && r != nil && r.O0 != nil {
			// Check source text for dot — 1.0 has dot, 1 doesn't
			if strings.Contains(r.O0.Src, ".") {
				isInt = false
			}
		}
		if isInt {
			return NewIntegerVal(&ValSpec{Peg: int(v), Src: fmt.Sprintf("%v", v)})
		}
		return NewNumberVal(&ValSpec{Peg: v})
	case int:
		return NewIntegerVal(&ValSpec{Peg: v})
	case bool:
		return NewBooleanVal(&ValSpec{Peg: v})
	}

	// Map
	if m, ok := node.(map[string]interface{}); ok {
		return l.wrapMap(m, r, ctx)
	}

	// Array/slice — the expr AC evaluate callback handles S-expressions,
	// so any slice here is a plain list.
	if a, ok := node.([]interface{}); ok {
		return l.wrapList(a, r, ctx)
	}

	// Fallback
	return NewStringVal(&ValSpec{Peg: fmt.Sprintf("%v", node)})
}

// wrapMap converts a raw map to a MapVal.
// Handles ___spread (spread constraints) and ___merge (deferred conjuncts)
// matching the TS map BC logic.
func (l *Lang) wrapMap(m map[string]interface{}, r *jsonic.Rule, ctx *jsonic.Context) Val {
	pegMap := make(map[string]Val)
	var spread *spreadData
	var mergeItems []interface{}

	for k, v := range m {
		if k == "___spread" {
			if sd, ok := v.(*spreadData); ok {
				spread = sd
			}
			continue
		}
		if k == "___merge" {
			if items, ok := v.([]interface{}); ok {
				mergeItems = items
			}
			continue
		}
		pegMap[k] = l.wrapVal(v, r, ctx)
	}

	mv := NewMapVal(&ValSpec{Peg: pegMap}, nil)

	// Handle deferred conjuncts (___merge).
	// Matches TS: let terms = [mopv, ...mo.___merge]
	if len(mergeItems) > 0 {
		terms := []Val{mv}
		for _, item := range mergeItems {
			terms = append(terms, l.wrapVal(item, r, ctx))
		}
		if spread != nil {
			terms = append(terms, l.makeSpreadVal(spread, r, ctx))
		}
		return NewConjunctVal(&ValSpec{Peg: terms}, nil)
	}

	if spread != nil {
		sv := l.makeSpreadVal(spread, r, ctx)
		return NewConjunctVal(&ValSpec{Peg: []Val{mv, sv}}, nil)
	}

	return mv
}

// makeSpreadVal creates a SpreadVal from parsed spread data.
// Matches TS makeSpreadVal: if multiple terms, wrap in ConjunctVal.
func (l *Lang) makeSpreadVal(sd *spreadData, r *jsonic.Rule, ctx *jsonic.Context) *SpreadVal {
	spreadVals := make([]Val, 0, len(sd.terms))
	for _, t := range sd.terms {
		spreadVals = append(spreadVals, l.wrapVal(t, r, ctx))
	}
	var constraint Val
	if len(spreadVals) == 1 {
		constraint = spreadVals[0]
	} else {
		constraint = NewConjunctVal(&ValSpec{Peg: spreadVals}, nil)
	}
	return NewSpreadVal(&ValSpec{Peg: constraint}, nil)
}

// wrapList converts a raw list to a ListVal.
func (l *Lang) wrapList(a []interface{}, r *jsonic.Rule, ctx *jsonic.Context) Val {
	vals := make([]Val, len(a))
	for i, v := range a {
		vals[i] = l.wrapVal(v, r, ctx)
	}
	return NewListVal(&ValSpec{Peg: vals}, nil)
}

// wrapTerms converts a slice of raw terms to Vals.
func (l *Lang) wrapTerms(terms []interface{}, r *jsonic.Rule, ctx *jsonic.Context) []Val {
	vals := make([]Val, len(terms))
	for i, t := range terms {
		vals[i] = l.wrapVal(t, r, ctx)
	}
	return vals
}

// installRules adds aontu-specific grammar rules to jsonic.
func (l *Lang) installRules(j *jsonic.Jsonic) {
	// Token lookup now matches TS exactly: #E& for conjunct operator.
	// FixedSrc("&") also works but Token("#E&") is the direct match.
	CJ := j.Token("#E&")
	CL := j.Token("#CL")
	QM := j.Token("#QM")
	TX := j.Token("#TX")
	ST := j.Token("#ST")
	NR := j.Token("#NR")

	OPTKEY := []jsonic.Tin{TX, ST, NR}

	// --- val rule: add spread and optional key handling ---
	j.Rule("val", func(rs *jsonic.RuleSpec, p *jsonic.Parser) {
		// Add spread open alt: &: at start pushes map
		rs.PrependOpen(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				P: "map", B: 2,
				N: map[string]int{"pk": 1},
				G: "spread,aontu",
			},
			// Optional key at top level
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{OPTKEY, {QM}},
				C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
					return r.D == 0
				},
				P: "map", B: 2,
				G: "pair,jsonic,top,aontu-optional",
			},
			// Optional key at nested level
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{OPTKEY, {QM}},
				P: "map", B: 2,
				N: map[string]int{"pk": 1},
				G: "pair,jsonic,top,dive,aontu-optional",
			},
		)

		// BC: wrap raw values in Val types
		rs.AddBC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			node := r.Node
			if node == nil {
				return
			}

			// Already a Val — just update site
			if _, ok := node.(Val); ok {
				return
			}

			// S-expression from expr plugin — leave for expr AC to evaluate.
			// Also skip slices that contain S-expressions (nested ops).
			if _, ok := node.([]interface{}); ok {
				return // Don't wrap any slices in val BC — let expr AC or wrapMap handle them
			}

			// Wrap raw values
			wrapped := l.wrapVal(node, r, ctx)
			if r.O0 != nil && wrapped != nil {
				s := wrapped.GetSite()
				s.Row = r.O0.RI
				s.Col = r.O0.CI
			}
			r.Node = wrapped
		})

		// Close: allow spread continuation
		rs.AddClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				B: 2,
				G: "spread,json,more,aontu",
			},
		)
	})

	// --- map rule: wrap raw map in MapVal ---
	j.Rule("map", func(rs *jsonic.RuleSpec, p *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				P: "pair", B: 2,
				G: "spread,aontu",
			},
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{OPTKEY, {QM}},
				P: "pair", B: 2,
				G: "pair,list,val,imp,jsonic,aontu-optional",
			},
		)

		rs.AddBC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			node := r.Node
			if node == nil {
				return
			}

			// Already a Val (from merge or prior callback)
			if _, ok := node.(Val); ok {
				return
			}

			// Raw map
			if m, ok := node.(map[string]interface{}); ok {
				wrapped := l.wrapMap(m, r, ctx)
				if r.O0 != nil {
					s := wrapped.GetSite()
					s.Row = r.O0.RI
					s.Col = r.O0.CI
				}
				r.Node = wrapped
				return
			}
		})

		rs.AddClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				B: 2,
				G: "spread,json,more,aontu",
			},
		)
	})

	// --- list rule: wrap raw list in ListVal ---
	j.Rule("list", func(rs *jsonic.RuleSpec, p *jsonic.Parser) {
		rs.AddBC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			node := r.Node
			if node == nil {
				return
			}
			if _, ok := node.(Val); ok {
				return
			}
			if a, ok := node.([]interface{}); ok {
				wrapped := l.wrapList(a, r, ctx)
				if r.O0 != nil {
					s := wrapped.GetSite()
					s.Row = r.O0.RI
					s.Col = r.O0.CI
				}
				r.Node = wrapped
			}
		})
	})

	// --- pair rule: handle spread syntax (&:) ---
	j.Rule("pair", func(rs *jsonic.RuleSpec, p *jsonic.Parser) {
		rs.PrependOpen(
			// Spread pair: & followed by :
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				P: "val",
				U: map[string]interface{}{"spread": true},
				G: "spread,aontu",
			},
			// Optional key
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{OPTKEY, {QM}},
				B: 1, RF: func(r *jsonic.Rule, ctx *jsonic.Context) string { return "pair" },
				U: map[string]interface{}{"aontu_optional": true},
				G: "aontu-optional-key",
			},
			// Optional pair (after ? matched)
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{QM}, {CL}},
				C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
					if r.Prev == nil || r.Prev.U == nil {
						return false
					}
					v, ok := r.Prev.U["aontu_optional"]
					return ok && v == true
				},
				P: "val",
				U: map[string]interface{}{"pair": true},
				A: func(r *jsonic.Rule, ctx *jsonic.Context) {
					// Extract key from prev rule
					if r.Prev != nil && r.Prev.O0 != nil {
						key := tokenToKey(r.Prev.O0)
						if r.U == nil {
							r.U = make(map[string]interface{})
						}
						r.U["key"] = key
						// Track optional key
						if r.Parent != nil {
							if r.Parent.U == nil {
								r.Parent.U = make(map[string]interface{})
							}
							var optKeys []string
							if existing, ok := r.Parent.U["aontu_optional_keys"].([]string); ok {
								optKeys = existing
							}
							r.Parent.U["aontu_optional_keys"] = append(optKeys, key)
						}
					}
				},
				G: "aontu-optional-pair",
			},
		)

		// AO: spread children inherit the parent path directly.
		// Matches TS: if (0 < r.d && r.u.spread) { r.child.k.path = r.k.path }
		rs.AddAO(func(r *jsonic.Rule, ctx *jsonic.Context) {
			if r.D > 0 && r.U != nil {
				if isSpread, _ := r.U["spread"].(bool); isSpread {
					if r.Child != nil && r.K != nil {
						if r.Child.K == nil {
							r.Child.K = make(map[string]interface{})
						}
						r.Child.K["path"] = r.K["path"]
						r.Child.K["key"] = r.K["key"]
					}
				}
			}
		})

		// BC: handle spread data
		rs.AddBC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			if r.U == nil {
				return
			}
			isSpread, _ := r.U["spread"].(bool)
			if !isSpread {
				return
			}

			// Store spread data on the parent node
			if r.Parent != nil {
				parentNode := r.Parent.Node
				if parentMap, ok := parentNode.(map[string]interface{}); ok {
					var sd *spreadData
					if existing, ok := parentMap["___spread"].(*spreadData); ok {
						sd = existing
					} else {
						sd = &spreadData{op: "&"}
						parentMap["___spread"] = sd
					}
					if r.Child != nil {
						sd.terms = append(sd.terms, r.Child.Node)
					}
				}
			}
		})

		// Close: allow spread continuation
		rs.AddClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
					return r.Lte("dmap", 1)
				},
				RF: func(r *jsonic.Rule, ctx *jsonic.Context) string { return "pair" },
				B: 2,
				G: "spread,json,pair,aontu",
			},
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				B: 2,
				G: "spread,json,more,aontu",
			},
		)
	})

	// --- elem rule: spread in lists ---
	j.Rule("elem", func(rs *jsonic.RuleSpec, p *jsonic.Parser) {
		rs.PrependOpen(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				P: "val",
				N: map[string]int{"pk": 1, "dmap": 1},
				U: map[string]interface{}{"spread": true, "done": true, "list": true},
				G: "spread,aontu",
			},
		)

		rs.AddBC(func(r *jsonic.Rule, ctx *jsonic.Context) {
			if r.U == nil {
				return
			}
			isSpread, _ := r.U["spread"].(bool)
			if !isSpread {
				return
			}

			if r.Parent != nil && r.Parent.Node != nil {
				if parentList, ok := r.Parent.Node.([]interface{}); ok {
					_ = parentList // spread data for lists handled via marker
				}
			}
		})

		rs.AddClose(
			&jsonic.AltSpec{
				S: [][]jsonic.Tin{{CJ}, {CL}},
				RF: func(r *jsonic.Rule, ctx *jsonic.Context) string { return "elem" },
				B: 2,
				G: "spread,json,more,aontu",
			},
		)
	})
}

// --- Helpers ---

func getPathFromRule(r *jsonic.Rule) []string {
	if r == nil {
		return nil
	}
	if r.K != nil {
		if p, ok := r.K["path"].([]string); ok {
			return p
		}
		if p, ok := r.K["path"].([]interface{}); ok {
			out := make([]string, len(p))
			for i, v := range p {
				out[i] = fmt.Sprintf("%v", v)
			}
			return out
		}
	}
	return nil
}

func getSiteFromRule(r *jsonic.Rule, ctx *jsonic.Context) *Site {
	s := &Site{Row: -1, Col: -1}
	if r != nil && r.O0 != nil {
		s.Row = r.O0.RI
		s.Col = r.O0.CI
	}
	if ctx != nil && ctx.Meta != nil {
		if ms, ok := ctx.Meta["multisource"].(map[string]interface{}); ok {
			if p, ok := ms["path"].(string); ok {
				s.URL = p
			}
		}
	}
	return s
}

func applySite(v Val, s *Site) {
	vs := v.GetSite()
	vs.Row = s.Row
	vs.Col = s.Col
	vs.URL = s.URL
}

func tokenToKey(t *jsonic.Token) string {
	if t == nil {
		return ""
	}
	// Text and string tokens use resolved value
	if t.Val != nil {
		if s, ok := t.Val.(string); ok {
			return s
		}
	}
	return t.Src
}


func valToString(v Val) string {
	if v == nil {
		return ""
	}
	if s, ok := v.GetPeg().(string); ok {
		return s
	}
	c := v.Canon()
	c = strings.TrimPrefix(c, "'")
	c = strings.TrimSuffix(c, "'")
	return c
}

// FuncMap maps function names to constructors.
var FuncMap = map[string]func(*ValSpec, *AontuContext) Val{
	"upper": func(s *ValSpec, c *AontuContext) Val { return NewUpperFuncVal(s, c) },
	"lower": func(s *ValSpec, c *AontuContext) Val { return NewLowerFuncVal(s, c) },
	"copy":  func(s *ValSpec, c *AontuContext) Val { return NewCopyFuncVal(s, c) },
	"move":  func(s *ValSpec, c *AontuContext) Val { return NewMoveFuncVal(s, c) },
	"key":   func(s *ValSpec, c *AontuContext) Val { return NewKeyFuncVal(s, c) },
	"type":  func(s *ValSpec, c *AontuContext) Val { return NewTypeFuncVal(s, c) },
	"hide":  func(s *ValSpec, c *AontuContext) Val { return NewHideFuncVal(s, c) },
	"path":  func(s *ValSpec, c *AontuContext) Val { return NewPathFuncVal(s, c) },
	"pref":  func(s *ValSpec, c *AontuContext) Val { return NewPrefFuncVal(s, c) },
	"close": func(s *ValSpec, c *AontuContext) Val { return NewCloseFuncVal(s, c) },
	"open":  func(s *ValSpec, c *AontuContext) Val { return NewOpenFuncVal(s, c) },
	"super": func(s *ValSpec, c *AontuContext) Val { return NewSuperFuncVal(s, c) },
}
