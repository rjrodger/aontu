/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

// THE GRAMMAR PAIR: abnf(src) and parse(g, v) -- G9.
// Twin of ts/src/val/AbnfFuncVal.ts, where the full note lives.
//
// abnf(src) COMPILES an RFC 5234 grammar and answers the grammar
// SOURCE, so a parser is an ordinary string value: it canons, it hashes
// and it unifies with no new kind in the lattice.
//
// parse(g, v) applies the grammar to a string and answers the tabnas
// AST -- {rule, src, kids} all the way down -- as ordinary maps and
// lists. A FAILURE TO PARSE IS A FAILURE TO UNIFY.
//
// parse(g) -- the one-argument form -- is the same grammar as a
// CONSTRAINT on whatever meets it, which is what a schema position
// wants where there is no value yet to hand the call.

// grammarSource compiles the argument and answers its source.
func grammarSource(ctx *Ctx, f *FuncVal, g Val) Val {
	src, ok := stringPeg(g)
	if !ok {
		return makeNilErrFull(ctx, "abnf_grammar", f, nil, "abnf", nil)
	}

	// The compile is CACHED by source, so a grammar named at many sites
	// is built once -- and refused once, with the compiler's own reason.
	if _, why := compileGrammar(src); "" != why {
		return makeNilErrFull(ctx, "abnf_grammar", f, nil, "abnf",
			map[string]string{"reason": why})
	}

	return newString(src)
}

// applyGrammar parses text under the grammar and answers the AST.
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

	// THE EMPTY STRING IS NOT A PARSE. Both engines answer an empty
	// tree for empty input rather than refusing it, which would make
	// parse(g, "") succeed under every grammar.
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

// constrainParse is the ONE-ARGUMENT form: the grammar as a constraint.
//
// `*"" | parse(G)` says the field is either the default or a string
// this grammar accepts. It is VALUE-PRESERVING, like every other
// constraint in the algebra -- the field keeps the string it was
// written with, and the tree is what the two-argument form is for.
// That is also what keeps it idempotent: a meet that returns its peer
// can be applied twice in any order.
//
// The grammar argument is driven first -- it is normally a reference to
// an abnf() call -- and until it settles the call HOLDS, exactly as an
// unmet min(3) does. A settled string peer is then the check; every
// other peer keeps the residual, so the constraint survives to meet a
// value on a later pass. Twin of ParseFuncVal.unify in
// ts/src/val/AbnfFuncVal.ts.
func constrainParse(ctx *Ctx, f *FuncVal, base []string, peer Val) Val {
	if arg := f.peg[0]; DONE != arg.Dc() {
		ctx.slot = base
		f.peg[0] = unite(ctx, arg, top())
	}

	// A STRING PEG IS A SETTLED GRAMMAR, so this is also the doneness
	// test: nothing carrying one is still resolving.
	gsrc, gok := stringPeg(f.peg[0])
	if !gok {
		return residuate(f, base, peer)
	}

	// A SETTLED CONSTRAINT IS A STABLE VALUE, exactly as the residual a
	// constraint atom answers is ("a residual constraint is stable, like
	// a ScalarKindVal", newConstraint in go/constraint.go). Without it
	// the call was never done, so a type() holding one never resolved
	// and the whole schema it belonged to was ungeneratable --
	// `$.aontu.System.Semver & [1]` reported mapval_no_gen over the
	// schema itself. Twin: the same assignment in ParseFuncVal.unify.
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

	// THE EMPTY STRING IS NOT A PARSE, for the reason applyGrammar
	// states above.
	if "" == text {
		return makeNilErrFull(ctx, "parse_failed", f, peer, "parse",
			map[string]string{
				"reason": "the empty string parses under no grammar"})
	}

	if _, perr := parseWith(grammar, text); "" != perr {
		return makeNilErrFull(ctx, "parse_failed", f, peer, "parse",
			map[string]string{"reason": perr})
	}

	// ADMITTED: the peer stands, unchanged.
	return peer
}

// holdParse is the STABLE TWIN of residuate: the same cases, without
// the notdone() -- a constraint whose grammar has settled is DONE and
// stays DONE while it waits for a value (see constrainParse above).
//
// THREE cases and not residuate's four: there is no nil arm, because a
// NIL never arrives as this call's peer. A conjunct or a map absorbs
// one before the func is driven against it, and this function is
// reached only once the grammar has SETTLED -- a staged residual is
// entered before that, which is why residuate's nil arm is live and
// this one would be dead. A nil that did arrive would fall to the
// conjunct below and be absorbed by it, which is the same answer.
//
// Twin of ParseFuncVal.hold in ts/src/val/AbnfFuncVal.ts.
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

// astVal renders the tabnas AST as ordinary aontu values. kids is
// always present and always a list, because the vocabulary a caller
// writes against should not have to ask whether a leaf has the key.
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

// stringPeg answers a Val's string content, and whether it had one.
func stringPeg(v Val) (string, bool) {
	s, ok := v.(*ScalarVal)
	if !ok || KindString != s.kind {
		return "", false
	}
	text, ok := s.peg.(string)
	return text, ok
}
