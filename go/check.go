/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// Problem describes a single source problem found by Check: a NilVal
// (unification conflict, unresolved reference, unknown function, …)
// present in the unified result tree. It carries the source byte offset
// so tooling — notably the LSP server in ../go/lsp — can render editor
// diagnostics. A valid but non-concrete document (e.g. a bare `a:string`
// schema) yields no Problems: only genuine errors become NilVals.
type Problem struct {
	// Pos is the byte offset into the source of the offending value, or
	// -1 when no position is known.
	Pos int

	// Len is the byte length of the offending value's canonical form
	// (always >= 1), used to size the diagnostic range.
	Len int

	// Why is the engine error code (e.g. "scalar_value", "no_path",
	// "unknown_function").
	Why string

	// Message is the human-readable error message.
	Message string
}

// Check parses and unifies src and reports every problem found, without
// stopping at the first. Unlike Generate it does not fail on non-concrete
// values — a schema such as `a:string` is valid and yields no problems.
// A parse (syntax) error is returned as a single Problem with Pos -1.
func (a *Aontu) Check(src string) []Problem {
	return a.CheckVars(src, nil)
}

// CheckVars is Check with $name variables resolved from vars.
func (a *Aontu) CheckVars(src string, vars map[string]Val) []Problem {
	v, perr := parseBase(src, a.base)
	if perr != nil {
		return []Problem{{Pos: -1, Len: 1, Why: "parse", Message: perr.Error()}}
	}

	ctx := &Ctx{root: v, vars: vars}
	res := unifyRoot(v, ctx)
	ctx.root = res

	var nils []*NilVal
	collectNils(res, &nils, map[Val]bool{})

	out := make([]Problem, 0, len(nils))
	for _, n := range nils {
		p := Problem{Pos: n.sp, Len: 1, Why: n.why, Message: n.Message()}
		if p.Pos < 0 {
			p.Pos = -1
		}
		if n.primary != nil {
			if c := n.primary.Canon(); len(c) > 0 {
				p.Len = len(c)
			}
		}
		out = append(out, p)
	}
	return out
}

// collectNils walks a unified Val tree, appending every reachable NilVal
// exactly once (deduplicated by identity). A NilVal in the result always
// represents an error; valid non-concrete values (scalar kinds, refs,
// conjuncts that simply did not resolve) are never NilVals.
func collectNils(v Val, out *[]*NilVal, seen map[Val]bool) {
	if v == nil || seen[v] {
		return
	}
	seen[v] = true

	if n, ok := v.(*NilVal); ok {
		*out = append(*out, n)
		return
	}

	switch t := v.(type) {
	case *MapVal:
		for _, k := range t.keys {
			collectNils(t.peg[k], out, seen)
		}
		if t.spread != nil {
			collectNils(t.spread, out, seen)
		}
	case *ListVal:
		for _, e := range t.peg {
			collectNils(e, out, seen)
		}
		if t.spread != nil {
			collectNils(t.spread, out, seen)
		}
	case *ConjunctVal:
		for _, e := range t.peg {
			collectNils(e, out, seen)
		}
	case *DisjunctVal:
		for _, e := range t.peg {
			collectNils(e, out, seen)
		}
	}
}
