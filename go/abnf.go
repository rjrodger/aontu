/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

// The grammar pair, ADR-033. Twin of ts/src/val/AbnfFuncVal.ts.

func grammarSource(ctx *Ctx, f *FuncVal, g Val) Val {
	src, ok := stringPeg(g)
	if !ok {
		return makeNilErrFull(ctx, "abnf_grammar", f, nil, "abnf", nil)
	}

	if _, why := compileGrammar(src); "" != why {
		return makeNilErrFull(ctx, "abnf_grammar", f, nil, "abnf",
			map[string]string{"reason": why})
	}

	return newString(src)
}

func applyGrammar(ctx *Ctx, f *FuncVal, g, v Val) Val {
	gsrc, gok := stringPeg(g)
	text, vok := stringPeg(v)
	if !gok || !vok {
		return makeNilErrFull(ctx, "parse_arg", f, nil, "parse", nil)
	}

	grammar, why := compileGrammar(gsrc)
	if "" != why {
		return makeNilErrFull(ctx, "abnf_grammar", f, nil, "parse",
			map[string]string{"reason": why})
	}

	// The host answers an empty tree for empty input.
	if "" == text {
		return makeNilErrFull(ctx, "parse_failed", f, nil, "parse",
			map[string]string{
				"reason": "the empty string parses under no grammar"})
	}

	node, perr := parseWith(grammar, text)
	if "" != perr {
		return makeNilErrFull(ctx, "parse_failed", f, nil, "parse",
			map[string]string{"reason": perr})
	}

	return astVal(node)
}

// constrainParse meets its peer instead of resolving, so it must see
// the peer before the argument loop drives it.
func constrainParse(ctx *Ctx, f *FuncVal, base []string, peer Val) Val {
	if arg := f.peg[0]; DONE != arg.Dc() {
		ctx.slot = base
		f.peg[0] = unite(ctx, arg, top())
	}

	gsrc, gok := stringPeg(f.peg[0])
	if !gok {
		return residuate(f, base, peer)
	}

	// A settled constraint is stable, as a residual constraint atom is.
	// Without this a type() holding one never resolves.
	f.setDc(DONE)

	text, vok := stringPeg(peer)
	if !vok {
		return holdParse(f, base, peer)
	}

	grammar, why := compileGrammar(gsrc)
	if "" != why {
		return makeNilErrFull(ctx, "abnf_grammar", f, peer, "parse",
			map[string]string{"reason": why})
	}

	if "" == text {
		return makeNilErrFull(ctx, "parse_failed", f, peer, "parse",
			map[string]string{
				"reason": "the empty string parses under no grammar"})
	}

	if _, perr := parseWith(grammar, text); "" != perr {
		return makeNilErrFull(ctx, "parse_failed", f, peer, "parse",
			map[string]string{"reason": perr})
	}

	return peer
}

// holdParse is the stable twin of residuate: no notdone(), because a
// settled constraint stays done while it waits for a value.
func holdParse(f *FuncVal, base []string, peer Val) Val {
	switch {
	case isTop(peer):
		out := clonePath(f, overlayPath(base, f.path))
		out.setDc(DONE)
		return out
	default:
		if pf, ok := peer.(*FuncVal); ok && pf.name == f.name &&
			pathEq(pf.path, f.path) && pf.Canon() == f.Canon() {
			return f
		}
		cj := newConjunct([]Val{f, peer})
		cj.path = cp(f.path)
		cj.sp, cj.spu, cj.surl = f.sp, f.spu, f.surl
		return cj
	}
}

func astVal(node any) Val {
	m, _ := node.(map[string]any)

	rule, _ := m["rule"].(string)
	src, _ := m["src"].(string)

	rawkids, _ := m["kids"].([]any)
	kids := make([]Val, 0, len(rawkids))
	for _, k := range rawkids {
		kids = append(kids, astVal(k))
	}

	out := newMap()
	out.set("rule", newString(rule))
	out.set("src", newString(src))
	out.set("kids", newList(kids))
	return out
}

func stringPeg(v Val) (string, bool) {
	s, ok := v.(*ScalarVal)
	if !ok || KindString != s.kind {
		return "", false
	}
	text, ok := s.peg.(string)
	return text, ok
}
