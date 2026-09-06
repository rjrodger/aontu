/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strconv"
	"strings"
)

// THE GENERATION COMBINATORS (G8 phase 1, the Go side of
// ts/src/val/PackFuncVal.ts and ts/src/val/EachFuncVal.ts,
// docs/capability-review/g8-generation.md).
//
//	pack(data, tmpl)  one KEYED child per child of data
//	each(data, tmpl?) one LIST ELEMENT per child of data
//
// Both clone their template per destination -- an independent copy for
// each generated child, because a generator's template IS the child and
// a child is a position -- and both wait for the model to settle before
// they fire (the staging rule, G8 phase 0): a data
// argument that is merely `done` once can still be merged into by a
// sibling, an include or a spread, and children generated from a
// half-merged bag would be missing.
//
// TOTALITY. Both iterate a finite, settled bag and neither can call
// itself: the number of children either can produce is fixed by data
// that already exists. Nothing here recurses, which is the guarantee
// the combinators exist to keep.

// packKeys is the keys a data bag names, or the code naming what is
// wrong with it. For a list the strings themselves are the keys: keys
// are DATA, never position, or reordering the list would churn every
// generated child (the Terraform `count` lesson).
func packKeys(data Val, ctx *Ctx) ([]string, string) {
	// The candidates are the bag's MEMBERS -- what generation would
	// emit (members.go, BUGS.md §79) -- so a hidden key, or a hidden
	// name in a list of names, packs nothing.
	switch data.(type) {
	case *MapVal:
		out := []string{}
		for _, m := range bagMembers(data, ctx) {
			out = append(out, m.key)
		}
		return out, ""
	case *ListVal:
		out := []string{}
		for _, m := range bagMembers(data, ctx) {
			sv, ok := m.val.(*ScalarVal)
			if !ok || KindString != sv.kind {
				return nil, "pack_key"
			}
			s, _ := sv.peg.(string)
			out = append(out, s)
		}
		return out, ""
	}
	return nil, "pack_data"
}

// eachValues is the members a data bag holds -- what generation would
// emit (members.go, BUGS.md §79) -- in the order the result
// must carry them: source order for a list, sorted-key order for a map.
// A generated list whose order depended on insertion history would
// differ between two runs of one document, and between the two ports.
func eachValues(data Val, ctx *Ctx) ([]Val, string) {
	if !isBag(data) {
		return nil, "each_data"
	}
	return memberVals(data, ctx), ""
}

func packFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var data Val = top()
	if 0 < len(args) {
		data = args[0]
	}
	keys, bad := packKeys(data, ctx)
	if "" != bad {
		return makeNilErr(ctx, bad, f, nil)
	}

	var tmpl Val = top()
	if 1 < len(args) {
		tmpl = args[1]
	}

	out := newMap()
	for ki, key := range keys {
		kslot := append(cp(base), key)
		// THE PLACEHOLDER BINDS THE SOURCE CHILD (G8 phase 3): inside a
		// generator's template `_` is the datum this child is being
		// made FROM. For a map that is the child's value; for a list of
		// names it is the name, which is also the key -- so `_` and
		// key() agree there, and differ the moment the data is a map.
		var source Val
		if m, ok := data.(*MapVal); ok {
			source = m.peg[key]
		} else if l, ok := data.(*ListVal); ok {
			source = l.peg[ki]
		}
		// CLONED, never shared. A spread may share a template that
		// holds nothing path-dependent; a generator's template IS the
		// child, and a child is a position (see the TS
		// PackFuncVal.resolve comment).
		// A FULL INSTANCE, to the leaves (instanceClone, ADR-005): a
		// bare clone shares the inner structure of any call, preference
		// or operation in the template, so the first child's resolution
		// of a shared key()/ref answered for every child (BUGS.md §8, §9).
		child := fillPlace(instanceClone(tmpl, kslot), source)
		if prev, seen := out.peg[key]; seen {
			// Duplicate generated keys are not an error: the colliding
			// children unify, exactly as duplicate source keys merge.
			ctx.slot = kslot
			out.peg[key] = unite(ctx, prev, child)
			continue
		}
		out.keys = append(out.keys, key)
		out.peg[key] = child
	}
	out.setvpath(cp(base))
	return out
}

func eachFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var data Val = top()
	if 0 < len(args) {
		data = args[0]
	}
	vals, bad := eachValues(data, ctx)
	if "" != bad {
		return makeNilErr(ctx, bad, f, nil)
	}

	var tmpl Val
	if 1 < len(args) {
		tmpl = args[1]
	}

	elems := make([]Val, 0, len(vals))
	for i, v := range vals {
		islot := append(cp(base), itoa(i))
		// The element is the source child CLONED, not shared: it is a
		// second position holding that value, and a position is where
		// path-dependent content resolves. The clone keeps the identity
		// if the child carries one (G4 phase 1) -- a listed entity is
		// still that entity.
		el := clonePath(v, islot)
		if nil != tmpl {
			ctx.slot = islot
			// `_` inside the template binds the source child (G8 phase
			// 3), which for each() is the element itself.
			// A full instance per element (instanceClone, ADR-005).
			el = unite(ctx, el, fillPlace(instanceClone(tmpl, islot), v))
		}
		elems = append(elems, el)
	}
	out := newList(elems)
	out.setvpath(cp(base))
	return out
}

// SELECTION (G8 phase 2, the Go side of ts/src/val/FilterFuncVal.ts and
// ts/src/val/MatchFuncVal.ts).
//
//	filter(data, cond)                the children that ALREADY satisfy cond
//	match(v, p1, r1, …, d?)           the result of the first pattern v matches
//
// Both select by trying a meet and reading the outcome, never by a
// predicate language: a condition and a pattern are ordinary Aontu
// values, so the constraint atoms compose with them for free.

// trialUnify is a TRIAL meet: does a unify with b, and if so as what?
// Failure is an ANSWER rather than an error, so the error list is
// swapped for a throwaway one exactly as DisjunctVal's member trials do
// (disjunct.go). Mirrors trialUnify in ts/src/val/FuncBaseVal.ts.
func trialUnify(ctx *Ctx, a, b Val) Val {
	saved := ctx.err
	// AND ctx.trial, which this used to leave alone. The list-length
	// gate in listval.go is guarded by it -- a trial peer of a
	// different length cannot narrow a positional structure, so the
	// trial must fail rather than merge -- and TypeScript's trialUnify
	// (ts/src/val/FuncBaseVal.ts) has always set the flag. Go set it
	// only on the disjunct-member path, so the gate could never fire
	// from a combinator or from the preference distribution: `match`
	// selected the other arm, `filter` made the OPPOSITE selection, and
	// `a: *[] a: [1]` answered `*[1]` at exit 0 where the canonical
	// port refused (BUGS.md §61). Saved and restored, because a trial
	// nested inside a trial must not clear the outer one.
	savedTrial := ctx.trial
	ctx.err = []*NilVal{}
	ctx.trial = true
	out := unite(ctx, a, b)
	failed := 0 < len(ctx.err) || (nil != out && out.Nil())
	ctx.err = saved
	ctx.trial = savedTrial
	if failed {
		return nil
	}
	return out
}

func filterFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var data Val = top()
	if 0 < len(args) {
		data = args[0]
	}
	var cond Val = top()
	if 1 < len(args) {
		cond = args[1]
	}

	// A child is kept when the condition CHANGES NOTHING: the meet
	// succeeds AND its answer is the child itself, which is to say the
	// child already satisfies the condition. Mere unifiability is not
	// the test and cannot be -- a map is open, so `{p:2}` unifies with
	// `{debug:true}` by GAINING the key, and a filter that keeps
	// everything that could be made to match keeps everything. Canon is
	// the comparison because canon is what "the same value" means here.
	keeps := func(child Val, slot []string) bool {
		ctx.slot = slot
		// `_` inside the condition binds the child being tested (G8
		// phase 3), so a condition can be about the child as a whole
		// rather than only about its shape.
		// The condition is cloned as a FULL instance per trial
		// (instanceClone, ADR-005) — a bare clone shares call/pref
		// innards across trials.
		test := fillPlace(instanceClone(cond, slot), child)
		met := trialUnify(ctx, clonePath(child, slot), test)
		return nil != met && met.Canon() == child.Canon()
	}

	// The candidates are the bag's MEMBERS -- what generation would
	// emit (members.go, BUGS.md §79) -- so a hidden child is never
	// selected into the result.
	switch data.(type) {
	case *MapVal:
		out := newMap()
		for _, m := range bagMembers(data, ctx) {
			kslot := append(cp(base), m.key)
			if keeps(m.val, kslot) {
				out.keys = append(out.keys, m.key)
				out.peg[m.key] = clonePath(m.val, kslot)
			}
		}
		out.setvpath(cp(base))
		return out
	case *ListVal:
		elems := []Val{}
		for _, m := range bagMembers(data, ctx) {
			// The element context is the position it will END UP at,
			// which is its index in the RESULT: dropping the third of
			// five moves the fourth up.
			islot := append(cp(base), itoa(len(elems)))
			if keeps(m.val, islot) {
				elems = append(elems, clonePath(m.val, islot))
			}
		}
		out := newList(elems)
		out.setvpath(cp(base))
		return out
	}

	return makeNilErr(ctx, "filter_data", f, nil)
}

// matchHasDefault reports whether the last argument is a trailing
// default rather than half of a pattern/result pair.
func matchHasDefault(peg []Val) bool {
	return 0 == len(peg)%2
}

// effectiveScrutinee is THE DEFAULTED-SCRUTINEE RULE (ADR-004,
// use-cases/BUGS.md §5): the generation-effective view of a settled
// scrutinee. A preference -- or a disjunction carrying one -- means
// "this value unless something overrides it", and by resolve time the
// model has SETTLED (staging rule), so nothing will: the value
// generation is about to emit is the value the patterns must be tested
// against. Testing against the still-open preference instead let a
// pattern SELECT an arm by overriding the default. A pref-free
// scrutinee (open disjunction included) is untouched. Mirrors
// effectiveScrutinee in ts/src/val/MatchFuncVal.ts.
func effectiveScrutinee(v Val) Val {
	out := v
	if d, ok := out.(*DisjunctVal); ok {
		// Generation picks the LOWEST rank (subEffectiveDefault in
		// subsume.go; `a:**1|*2` generates 2). rankPrefs leaves at most
		// one pref standing in a settled disjunct, so the scan is
		// defensive.
		var best *PrefVal
		for _, m := range d.peg {
			if p, ok := m.(*PrefVal); ok && (nil == best || p.rank < best.rank) {
				best = p
			}
		}
		if nil == best {
			return v
		}
		out = best
	}
	return prefInnerPeg(out)
}

func matchFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	scrutinee := effectiveScrutinee(args[0])
	last := len(args)
	if matchHasDefault(args) {
		last--
	}

	tried := []string{}
	for i := 1; i < last; i += 2 {
		tried = append(tried, args[i].Canon())
		ctx.slot = base
		if nil != trialUnify(ctx,
			clonePath(scrutinee, base), clonePath(args[i], base)) {
			// The RESULT is the answer: a match MAPS a value to another
			// value rather than narrowing the scrutinee by the arm (see
			// the TS MatchFuncVal header for why the design's `v & p & r`
			// cannot be what a match is for).
			return clonePath(args[i+1], base)
		}
	}

	if matchHasDefault(args) {
		return clonePath(args[len(args)-1], base)
	}

	return makeNilErrFull(ctx, "match_none", f, nil, "resolve",
		map[string]string{
			"value": scrutinee.Canon(),
			"tried": strings.Join(tried, " "),
		})
}

// stagedArgIdx is the arguments a staged func must have DRIVEN before
// it can fire: the ones whose value the decision reads. Everything
// else -- a generator's template, a match arm's result -- is left
// standing until it is chosen.
func stagedArgIdx(f *FuncVal) []int {
	switch f.name {
	case "pack", "each", "form":
		return []int{0}
	case "emit":
		// The SELECTION only. The table is templates, instantiated at
		// each matched node, so its bodies may hold a `_` or a relative
		// reference -- neither of which has an answer at the call site.
		return []int{0}
	case "filter":
		// The DATA only. The condition is a template, tested against
		// each child at that child's position, so it may hold a `_` or
		// a relative reference — neither of which has an answer at the
		// call site (see the TS FilterFuncVal.prepare comment).
		return []int{0}
	case "match":
		out := []int{0}
		last := len(f.peg)
		if matchHasDefault(f.peg) {
			last--
		}
		for i := 1; i < last; i += 2 {
			out = append(out, i)
		}
		return out
	}
	// key() has nothing to settle but its own position.
	return nil
}

// stagedDrive advances a staged func's decision arguments IN PLACE,
// every pass rather than only on the settle pass: they are part of the
// model that has to settle. Answers whether they are all done, which is
// the other half of "ready to fire". Mirrors driveStagedArgs in
// ts/src/val/FuncBaseVal.ts.
func stagedDrive(ctx *Ctx, f *FuncVal, base []string) bool {
	ready := true
	// THE SNAPSHOT WAITS FOR THE SOURCE (see Ctx.argsnap): every ref
	// resolution inside this drive defers its copy until the target has
	// settled in the tree. Saved/restored rather than simply cleared:
	// a staged func nested inside another's data argument drives its
	// own argument with the flag already up, exactly as TS's
	// prototype-inherited ctx flag behaves.
	saved := ctx.argsnap
	ctx.argsnap = true
	defer func() { ctx.argsnap = saved }()
	// Every index stagedArgIdx answers is derived from len(f.peg), and
	// arity is checked at parse, so there is no bound to test here.
	for _, i := range stagedArgIdx(f) {
		if f.peg[i].Dc() != DONE {
			ctx.slot = base
			driven := unite(ctx, f.peg[i], top())
			if driven != f.peg[i] {
				// COPY ON WRITE. A clone shares its arguments with the
				// value it was cloned from (clonePath, for the sharing
				// artifacts the ghost cases depend on), so writing a
				// driven argument straight back would write it into
				// every sibling clone too — and a generator's template,
				// cloned once per destination, is exactly a set of
				// siblings that must answer differently. Each staged
				// func takes ownership of its arguments the first time
				// it advances one.
				peg := append([]Val{}, f.peg...)
				peg[i] = driven
				f.peg = peg
			}
		}
		ready = ready && f.peg[i].Dc() == DONE
	}
	return ready
}

// TRANSFORMATION: emit(select, table) (G9 phase 6, the Go side of
// ts/src/val/EmitFuncVal.ts, docs/design/EMIT.0.md). Apply-templates,
// with the dispatch in the engine and none of it in user space.
//
//	emit($.services, [
//	  {match: {kind: sqs},  body: [`listen(` + .pin + `)`]}
//	  {match: {kind: http}, body: [`serve(` + .path + `)`]}
//	])
//
// For every node of select, in order, the first template whose match
// the node unifies with is taken and its body instantiated AGAINST
// THAT NODE. The result is one flat list; a body element that is
// itself a list SPLICES, which is what makes a nested emit compose.
//
// A NAMED TABLE IS A PLACEHELD emit (`%wire = emit(_, T)`). A table
// written at a document position is DRIVEN there, so its bodies'
// relative references resolve against wherever it sits and miss;
// nothing in the language holds a value unevaluated at such a position,
// and what does hold one is a CALL's template argument.
// `emit(.listen, %wire)` follows the reference and reads the table out
// of the placeheld call; `.listen & %wire` fills the hole. Both are the
// same dispatch, and it is what lets a rule set name ITSELF.
//
// TERMINATION IS THE SELECTION's. Unlike pack and each, this one
// recurses -- a nested model walked into nested output is the
// capability the rule layer exists to add -- so the bound is not "it
// cannot call itself" but "each dispatch descends into a finite bag
// that already exists, and a selection that empties emits nothing". A
// rule set that walks into itself WITHOUT descending is charged to the
// depth budget and refused as unify_cycle, like any other runaway
// descent.

// emitTemplate is one entry of the rule table: the pattern to try, the
// body to instantiate, and -- docs/design/TEMPLATE.0.md D3 and D4 --
// the `replace` map and the `esc` convention its values take, with the
// literal spots of the body the replacements are written into.
type emitTemplate struct {
	match   Val
	body    *ListVal
	replace *MapVal
	esc     string
	lits    []emitLit
}

// emitLit is one literal string of a body: element i, and within a map
// element the `of` index (-1 when it is not one) or the `text` key.
type emitLit struct {
	i    int
	of   int
	text bool
	s    string
}

// emitRefusal names what is wrong with a table, with the detail the
// message carries.
type emitRefusal struct {
	code    string
	details map[string]string
}

// emitPair is one replacement: the key, and the text it becomes.
type emitPair struct {
	key   string
	value string
}

// emitTemplates reads the table, or the refusal naming what is wrong
// with it. A map is one template; a list is many; a PLACEHELD emit is a
// named table (see the TS tableTemplates comment) and its own table is
// the table. A reference has been followed by emitFunc before this.
func emitTemplates(table Val) ([]emitTemplate, *emitRefusal) {
	switch t := table.(type) {
	case *FuncVal:
		if "emit" == t.name && 1 < len(t.peg) {
			return emitTemplates(t.peg[1])
		}
	case *MapVal:
		one, bad := oneEmitTemplate(t)
		if nil != bad {
			return nil, bad
		}
		return []emitTemplate{one}, nil
	case *ListVal:
		out := make([]emitTemplate, 0, len(t.peg))
		for _, el := range t.peg {
			m, ok := el.(*MapVal)
			if !ok {
				return nil, &emitRefusal{code: "emit_template"}
			}
			one, bad := oneEmitTemplate(m)
			if nil != bad {
				return nil, bad
			}
			out = append(out, one)
		}
		return out, nil
	}
	return nil, &emitRefusal{code: "emit_table"}
}

// oneEmitTemplate reads one rule. Both keys are required: a template
// with no pattern would match everything by accident, and one with no
// body would emit nothing while claiming a node. The two optional keys
// -- a `replace` map and an `esc` naming the convention its values are
// escaped by, `none` the one opt-out -- are the template's shape too,
// and D3's two static checks run here, on the template alone, before
// any node.
func oneEmitTemplate(m *MapVal) (emitTemplate, *emitRefusal) {
	match, hasMatch := m.peg["match"]
	body, hasBody := m.peg["body"]
	if !hasMatch || !hasBody || nil == match || nil == body {
		return emitTemplate{}, &emitRefusal{code: "emit_template"}
	}
	list, ok := body.(*ListVal)
	if !ok {
		return emitTemplate{}, &emitRefusal{code: "emit_body"}
	}
	tmpl := emitTemplate{match: match, body: list, lits: emitLiterals(list)}
	if rv, has := m.peg["replace"]; has && nil != rv {
		rm, ok := rv.(*MapVal)
		if !ok {
			return emitTemplate{}, &emitRefusal{code: "emit_template"}
		}
		tmpl.replace = rm
	}
	if ev, has := m.peg["esc"]; has && nil != ev {
		name, ok := funcText(ev)
		if !ok || ("none" != name && !isEscVariant(name)) {
			return emitTemplate{}, &emitRefusal{code: "esc_variant"}
		}
		tmpl.esc = name
	}
	if nil != tmpl.replace {
		if bad := emitCheckReplace(tmpl.replace, tmpl.lits); nil != bad {
			return emitTemplate{}, bad
		}
	}
	return tmpl, nil
}

// emitLiterals is the literal strings of a body -- a string element,
// and the strings written directly in a map element's `of` list or
// `text` -- which are the text the template wrote. A string an
// expression or a nested dispatch computes is not one: D3's third rule
// (a spliced result is finished) and its second (a substituted value
// is never re-scanned) both follow from substituting at these spots
// and nowhere else.
func emitLiterals(body *ListVal) []emitLit {
	out := []emitLit{}
	for i, el := range body.peg {
		if s, ok := funcText(el); ok {
			out = append(out, emitLit{i: i, of: -1, s: s})
			continue
		}
		m, ok := el.(*MapVal)
		if !ok {
			continue
		}
		if of, ok := m.peg["of"].(*ListVal); ok {
			for j, p := range of.peg {
				if s, ok := funcText(p); ok {
					out = append(out, emitLit{i: i, of: j, s: s})
				}
			}
		}
		if s, ok := funcText(m.peg["text"]); ok {
			out = append(out, emitLit{i: i, of: -1, text: true, s: s})
		}
	}
	return out
}

// emitCheckReplace is D3's two static checks, on the template alone and
// before any node: a key inside another is ambiguous whatever the order
// (replace_overlap), and a key no literal holds means the template
// drifted from its map (replace_unused). Keys are visited in code point
// order, so both ports name the same pair.
func emitCheckReplace(replace *MapVal, lits []emitLit) *emitRefusal {
	keys := cp(replace.keys)
	sort.Strings(keys)
	for _, a := range keys {
		for _, b := range keys {
			if a != b && strings.Contains(b, a) {
				return &emitRefusal{"replace_overlap",
					map[string]string{"key": emitQuote(a), "other": emitQuote(b)}}
			}
		}
	}
	for _, k := range keys {
		held := false
		for _, l := range lits {
			if "" != k && strings.Contains(l.s, k) {
				held = true
				break
			}
		}
		if !held {
			return &emitRefusal{"replace_unused", map[string]string{"key": emitQuote(k)}}
		}
	}
	return nil
}

// emitQuote is a key as the message writes it, quoted so an empty key
// is visible.
func emitQuote(s string) string {
	return "\"" + s + "\""
}

// emitRefuse is the located error for a refusal, with the message's
// details when the refusal carries them.
func emitRefuse(ctx *Ctx, f *FuncVal, r *emitRefusal) Val {
	if nil == r.details {
		return makeNilErr(ctx, r.code, f, nil)
	}
	return makeNilErrFull(ctx, r.code, f, nil, "resolve", r.details)
}

// nodeField is the field of node a reference names, or nil when it
// names none. Only a chain of plain NAMES is a field: a parent step has
// no answer at a node that is an origin rather than a position, and a
// variable segment is not a name until something resolves it -- both
// are refused here rather than left to resolve somewhere else, which is
// the failure mode the binding exists to remove.
func nodeField(rv *RefVal, node Val) Val {
	cur := node
	for _, seg := range rv.peg {
		name, ok := seg.(string)
		if !ok || "." == name {
			return nil
		}
		switch n := cur.(type) {
		case *MapVal:
			child, has := n.peg[name]
			if !has || nil == child {
				return nil
			}
			cur = child
		case *ListVal:
			i, err := strconv.Atoi(name)
			if nil != err || i < 0 || len(n.peg) <= i {
				return nil
			}
			cur = n.peg[i]
		default:
			return nil
		}
	}
	return cur
}

// hasNodeRef reports whether v holds a relative reference for the node
// binding to replace. Asked first so a body with no substitutions is
// never needlessly rebuilt -- the identity behaviour fillPlace has.
// Stops at a nested generator's binding arguments for the reason
// bindNode does.
func hasNodeRef(v Val) bool {
	switch n := v.(type) {
	case *RefVal:
		return !n.absolute
	case *FuncVal:
		bound := boundArgStart(n)
		for i, a := range n.peg {
			if bound <= i {
				break
			}
			if hasNodeRef(a) {
				return true
			}
		}
	case *PlusOpVal:
		for _, a := range n.peg {
			if hasNodeRef(a) {
				return true
			}
		}
	case *ConjunctVal:
		for _, a := range n.peg {
			if hasNodeRef(a) {
				return true
			}
		}
	case *DisjunctVal:
		for _, a := range n.peg {
			if hasNodeRef(a) {
				return true
			}
		}
	case *PrefVal:
		return hasNodeRef(n.peg)
	case *MapVal:
		for _, k := range n.keys {
			if hasNodeRef(n.peg[k]) {
				return true
			}
		}
	case *ListVal:
		for _, e := range n.peg {
			if hasNodeRef(e) {
				return true
			}
		}
	}
	return false
}

// bindNode is v with every relative reference replaced by the field of
// node it names. The binding is done HERE rather than left to path
// resolution: a relative path is a COUNT taken wherever the value comes
// to rest, and the nodes of a computed selection (filter(...)) come to
// rest nowhere -- there is no position for a count to be taken from. An
// ABSOLUTE reference is untouched and still reads the document root.
//
// The walk stops at a nested generator's own binding argument
// (boundArgStart): a rule table nested in a body is the INNER emit's to
// bind, so .x inside it is the inner node. What crosses the boundary is
// the nested call's SELECTOR, which is argument 0 -- the selector is
// the channel. `fail` keeps the first reference the node could not
// answer, for the located error.
func bindNode(v Val, node Val, fail *string) Val {
	if rv, ok := v.(*RefVal); ok && !rv.absolute {
		found := nodeField(rv, node)
		if nil == found {
			if "" == *fail {
				*fail = rv.Canon()
			}
			return v
		}
		return clonePath(found, cp(rv.path))
	}
	if !hasNodeRef(v) {
		return v
	}

	switch n := v.(type) {
	case *FuncVal:
		out := *n
		out.peg = bindNodeArgs(n.peg, node, fail, boundArgStart(n))
		out.dc = 0
		return &out
	case *PlusOpVal:
		out := *n
		out.peg = bindNodeEach(n.peg, node, fail)
		out.dc = 0
		return &out
	case *ConjunctVal:
		out := *n
		out.peg = bindNodeEach(n.peg, node, fail)
		out.dc = 0
		return &out
	case *DisjunctVal:
		out := *n
		out.peg = bindNodeEach(n.peg, node, fail)
		out.dc = 0
		return &out
	case *PrefVal:
		out := *n
		out.peg = bindNode(n.peg, node, fail)
		out.dc = 0
		return &out
	case *MapVal:
		out := *n
		out.keys = cp(n.keys)
		out.peg = map[string]Val{}
		for _, k := range n.keys {
			out.peg[k] = bindNode(n.peg[k], node, fail)
		}
		out.dc = 0
		return &out
	case *ListVal:
		out := *n
		out.peg = bindNodeEach(n.peg, node, fail)
		out.dc = 0
		return &out
	}

	// UNREACHABLE: hasNodeRef above answered true, and it answers true
	// only for the kinds this switch covers. The return is here because
	// Go needs one.
	return v //coverage:ignore hasNodeRef true implies a case above
}

func bindNodeEach(vals []Val, node Val, fail *string) []Val {
	return bindNodeArgs(vals, node, fail, len(vals))
}

// bindNodeArgs binds the first `bound` values and carries the rest
// through unchanged -- the generator-template boundary of the FuncVal
// arm above.
func bindNodeArgs(vals []Val, node Val, fail *string, bound int) []Val {
	out := make([]Val, 0, len(vals))
	for i, v := range vals {
		if bound <= i {
			out = append(out, v)
			continue
		}
		out = append(out, bindNode(v, node, fail))
	}
	return out
}

// emitSplice appends v to out, flattening a list into its elements:
// the fragment algebra is FLAT, so a body element that is itself a list
// splices rather than nesting.
func emitSplice(v Val, out []Val) []Val {
	if l, ok := v.(*ListVal); ok {
		for _, el := range l.peg {
			out = emitSplice(el, out)
		}
		return out
	}
	return append(out, v)
}

func emitFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var sel Val = top()
	if 0 < len(args) {
		sel = args[0]
	}
	nodes, bad := eachValues(sel, ctx)
	if "" != bad {
		// eachValues names each's code; emit answers for itself.
		return makeNilErr(ctx, "emit_data", f, nil)
	}

	var table Val
	if 1 < len(args) {
		table = args[1]
	}
	// A NAMED TABLE IS REACHED BY REFERENCE, and the reference -- not
	// the table -- is what is followed. Followed HERE rather than in
	// the staged drive, which waits for a SETTLED target: a table is a
	// template, a template holding a hole never settles, and waiting
	// for one would mean the dispatch never fires.
	if rv, ok := table.(*RefVal); ok {
		ctx.slot = base
		table = unite(ctx, rv, top())
	}

	templates, refused := emitTemplates(table)
	if nil != refused {
		return emitRefuse(ctx, f, refused)
	}

	pieces := []Val{}
	for _, node := range nodes {
		tmpl, tried := emitDispatch(ctx, base, node, templates)
		if nil == tmpl {
			return makeNilErrFull(ctx, "emit_none", f, nil, "resolve",
				map[string]string{
					"value": node.Canon(),
					"tried": strings.Join(tried, " "),
				})
		}

		fail := ""
		var refused *emitRefusal
		pieces, refused = emitInstantiate(ctx, base, node, *tmpl, pieces, &fail)
		if "" != fail {
			return makeNilErrFull(ctx, "emit_ref", f, nil, "resolve",
				map[string]string{
					"ref":   fail,
					"value": node.Canon(),
				})
		}
		if nil != refused {
			return emitRefuse(ctx, f, refused)
		}
	}

	// THE PIECES ARE PATHED WHERE THEY LAND, once the splicing has
	// settled how many there are. A piece keeps no trace of the body it
	// was written in: the body is a template, and a template's parse
	// position is the one place it is never used.
	for i, p := range pieces {
		// setPaths, not clonePath: the piece is already this
		// instantiation's own clone, and cloning it again would overlay
		// its stored tail on the new location -- the TS twin is
		// repathInstance, which rewrites in place.
		setPaths(p, append(cp(base), itoa(i)))
	}

	out := newList(pieces)
	out.setvpath(cp(base))
	return out
}

// emitDispatch answers the first template the node unifies with, in
// table order -- the same question match and filter ask, answered the
// same way. Answers the patterns tried when nothing matched, for the
// located error.
func emitDispatch(ctx *Ctx, base []string, node Val,
	templates []emitTemplate) (*emitTemplate, []string) {
	tried := []string{}
	for i := range templates {
		tried = append(tried, templates[i].match.Canon())
		ctx.slot = base
		// The trial is against CLONES: unite refines a bag in place
		// against a TOP peer, and a pattern that failed must be
		// untouched for the next node.
		if nil != trialUnify(ctx, clonePath(node, base),
			clonePath(templates[i].match, base)) {
			return &templates[i], nil
		}
	}
	return nil, tried
}

// emitInstantiate instantiates one body at the node and SPLICES its
// pieces into the output. A full instance to the leaves (instanceClone,
// ADR-005), because a bare clone shares the inner structure of any call
// in the body and the first node's resolution would answer for every
// node; the template's replacements written into the instance's literal
// text (TEMPLATE.0.md D3); then the two bindings, relative references
// and the hole, both to the node.
func emitInstantiate(ctx *Ctx, base []string, node Val, tmpl emitTemplate,
	out []Val, fail *string) ([]Val, *emitRefusal) {
	pairs, refused := emitReplacements(ctx, base, node, tmpl, fail)
	if nil != refused {
		return out, refused
	}
	for i, el := range tmpl.body.peg {
		islot := append(cp(base), itoa(len(out)))
		inst := instanceClone(el, islot)
		if nil != pairs {
			inst = emitSubstituted(inst, i, tmpl.lits, pairs, islot)
		}
		piece := fillPlace(bindNode(inst, node, fail), node)

		// A NESTED DISPATCH IS DRIVEN HERE, not left for the next pass.
		// Its selection is bound and the model has settled, so it has
		// everything it needs -- and it must answer NOW, because what
		// makes the result flat is splicing its pieces into this one.
		// Left standing, a nested emit resolved a pass later, as a list
		// INSIDE the list, and the fragment algebra is flat. Through
		// unite rather than by hand: a rule set that walks into itself
		// for ever is charged to the depth budget and refused as
		// unify_cycle, like any other runaway descent.
		if piece.Dc() != DONE {
			ctx.slot = islot
			piece = unite(ctx, piece, top())
		}

		out = emitSplice(piece, out)
	}
	return out, nil
}

// emitReplacements is the replacement pairs for one node: the
// template's `replace` map instantiated at the node -- bound, filled
// and driven as a body is -- each value as text by the one
// number-to-text rule (joinTextOf, the rule `+` and join share),
// escaped by the template's convention unless that is `none`, and
// sorted longest key first so the scan takes the longest match at
// every position (D3's first rule). A value that is not text, or has
// not settled, is replace_value.
func emitReplacements(ctx *Ctx, base []string, node Val, tmpl emitTemplate,
	fail *string) ([]emitPair, *emitRefusal) {
	if nil == tmpl.replace {
		return nil, nil
	}
	inst := fillPlace(bindNode(instanceClone(tmpl.replace, base), node, fail), node)
	if inst.Dc() != DONE {
		ctx.slot = base
		inst = unite(ctx, inst, top())
	}
	m, _ := inst.(*MapVal)
	pairs := []emitPair{}
	for _, k := range m.keys {
		v := unpref(m.peg[k])
		text, ok := joinTextOf(v)
		if !ok {
			return nil, &emitRefusal{"replace_value",
				map[string]string{"key": emitQuote(k), "value": v.Canon()}}
		}
		if "none" != tmpl.esc {
			text = escapeText(text, tmpl.esc)
		}
		pairs = append(pairs, emitPair{k, text})
	}
	sort.SliceStable(pairs, func(a, b int) bool {
		if len(pairs[a].key) != len(pairs[b].key) {
			return len(pairs[a].key) > len(pairs[b].key)
		}
		return pairs[a].key < pairs[b].key
	})
	return pairs, nil
}

// emitSubstituted is the instance with the template's literal text at
// element i rewritten through the pairs -- on the fresh instance, where
// the structure is exactly the template's, and before any binding, so
// a value written in is never scanned again (D3's second rule) and a
// spliced result is never touched (its third).
func emitSubstituted(inst Val, i int, lits []emitLit, pairs []emitPair,
	slot []string) Val {
	for _, l := range lits {
		if l.i != i {
			continue
		}
		s := newString(emitSubstitute(l.s, pairs))
		s.path = cp(slot)
		if 0 <= l.of {
			m, _ := inst.(*MapVal)
			of, _ := m.peg["of"].(*ListVal)
			of.peg[l.of] = s
		} else if l.text {
			m, _ := inst.(*MapVal)
			m.peg["text"] = s
		} else {
			inst = s
		}
	}
	return inst
}

// emitSubstitute is D3's first two rules as one scan: at each position
// the longest key that matches is taken and its value written out
// whole, and the scan moves past the KEY -- the value is never looked
// at again, so no value can introduce a key.
func emitSubstitute(text string, pairs []emitPair) string {
	var b strings.Builder
	i := 0
	for i < len(text) {
		hit := -1
		for pi := range pairs {
			if strings.HasPrefix(text[i:], pairs[pi].key) {
				hit = pi
				break
			}
		}
		if hit < 0 {
			b.WriteByte(text[i])
			i++
			continue
		}
		b.WriteString(pairs[hit].value)
		i += len(pairs[hit].key)
	}
	return b.String()
}

// formFunc is form(data, tmpl) (G9 §4; docs/design/RENDER.0.md D11 and
// P6): one list element per child of data, being tmpl instantiated at
// that position with `_` bound to the source child. It REPLACES; it
// does not meet -- the construction where each is the bound (see the
// TS FormFuncVal comment). The members come through eachValues, so
// form and each can never disagree about order, and a hidden child or
// an unfilled optional is skipped as generation would skip it.
func formFunc(ctx *Ctx, f *FuncVal, base []string, args []Val) Val {
	var data Val = top()
	if 0 < len(args) {
		data = args[0]
	}
	vals, bad := eachValues(data, ctx)
	if "" != bad {
		// eachValues names each's code; form answers for itself.
		return makeNilErr(ctx, "form_data", f, nil)
	}

	var tmpl Val = top()
	if 1 < len(args) {
		tmpl = args[1]
	}

	elems := make([]Val, 0, len(vals))
	for i, v := range vals {
		islot := append(cp(base), itoa(i))
		// A full instance per element, to the leaves (instanceClone,
		// ADR-005), at the element's own position, with `_` bound to
		// the source child and NOTHING met into it.
		elems = append(elems, fillPlace(instanceClone(tmpl, islot), v))
	}
	out := newList(elems)
	out.setvpath(cp(base))
	return out
}
