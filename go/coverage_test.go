/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// Direct unit tests for engine paths a shared spec row cannot reach:
// comparison-internal branches (binary64 infinities never constructible
// from source), defensive contracts (ExpectVal.Gen's deliberate
// silence), tooling walks (Check/Spans over every Val kind), and small
// plumbing helpers. Everything reachable FROM SOURCE is pinned by
// shared rows instead (test/spec/*.tsv, edge.tsv in particular); these
// tests exist for the remainder, per docs/test-coverage.md.

import (
	"math"
	"math/big"
	"strings"
	"testing"
)

// The binary64 infinities order below/above everything finite and are
// equal to themselves. No aontu source constructs an infinite float
// (1e999 is a not_number error), so the scaled-comparison branches are
// pinned here, not by rows.
func TestScaledInfinities(t *testing.T) {
	pinf := scaledOfFloat(math.Inf(1))
	ninf := scaledOfFloat(math.Inf(-1))
	one := scaledOfFloat(1)
	if pinf.inf != 1 || ninf.inf != -1 {
		t.Fatalf("inf marks: %+v %+v", pinf, ninf)
	}
	if cmpScaled(ninf, one) != -1 || cmpScaled(one, pinf) != -1 {
		t.Fatalf("finite vs inf ordering broken")
	}
	if cmpScaled(pinf, pinf) != 0 || cmpScaled(pinf, ninf) != 1 {
		t.Fatalf("inf vs inf ordering broken")
	}
	if scaledIsIntegral(pinf) {
		t.Fatalf("an infinity is not integral")
	}
}

// A subnormal float converts exactly (expBits 0 branch), and the
// scale-alignment branches of cmpScaled agree with float ordering.
func TestScaledSubnormalAndAlignment(t *testing.T) {
	sub := math.SmallestNonzeroFloat64
	s := scaledOfFloat(sub)
	if s.inf != 0 || s.unscaled.Sign() != 1 || s.scale != 1074 {
		t.Fatalf("subnormal conversion: %+v", s)
	}
	// 0.5 (scale 1) vs 0.25 (scale 2): alignment in both directions.
	a, b := scaledOfFloat(0.5), scaledOfFloat(0.25)
	if cmpScaled(a, b) != 1 || cmpScaled(b, a) != -1 {
		t.Fatalf("scale alignment broken")
	}
}

// towerRank's float default and the biginteger rank, direct.
func TestTowerRankDirect(t *testing.T) {
	f := numberVal(1.5, "", -1).(*ScalarVal)
	bi := &ScalarVal{kind: KindBigInteger, peg: big.NewInt(2)}
	if towerRank(f) != 1 || towerRank(bi) != 2 {
		t.Fatalf("towerRank: %d %d", towerRank(f), towerRank(bi))
	}
}

// ExpectVal.Gen is deliberately silent dead code (the bag-level Gen
// intercepts expect children first, in both ports); the contract that
// it stays silent is pinned here. superior() is TOP, like every
// residual feature.
func TestExpectValContracts(t *testing.T) {
	e := &ExpectVal{peg: newScalarKind(KindString)}
	v, err := e.Gen(nil)
	if v != nil || err != nil {
		t.Fatalf("ExpectVal.Gen must be silent, got %v %v", v, err)
	}
	if _, ok := e.superior().(*TopVal); !ok {
		t.Fatalf("ExpectVal.superior must be top")
	}
	if isExpect(newTop()) {
		t.Fatalf("isExpect(top) must be false")
	}
	// A TOP peer leaves the expect pending-but-done.
	out := e.Unify(top(), nil)
	if out != Val(e) || out.Dc() != DONE {
		t.Fatalf("top peer must keep the expect, done")
	}
}

// listval_spread_required is registered vocabulary with NO source-level
// raise site in either port (only maps create expects). The branch is
// the mirrored BagVal.gen shape; pin its message contract directly.
func TestListSpreadRequiredBranch(t *testing.T) {
	parent := newMap()
	parent.sp = 3
	ev := &ExpectVal{peg: newScalarKind(KindString), parent: parent, key: "0"}
	l := &ListVal{peg: []Val{ev}}
	_, err := l.Gen(&Ctx{src: "a:b", file: ""})
	if err == nil {
		t.Fatalf("expected listval_spread_required")
	}
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "listval_spread_required" {
		t.Fatalf("want listval_spread_required, got %v", err)
	}
	// A collect ctx truncates silently instead.
	out, err2 := l.Gen(&Ctx{collect: true})
	if err2 != nil || len(out.([]any)) != 0 {
		t.Fatalf("collect must truncate: %v %v", out, err2)
	}
}

// Check and Spans walk every Val kind; the kinds and problem set are
// the LSP surface contract (valKind, collectSpans, collectNils).
func TestCheckAndSpansKinds(t *testing.T) {
	a := New()
	spans := a.Spans("a:1 b:1.5 c:x d:true e:null f:{g:[2]} h:number i:$.a j:1|top k:*7 m:min(0) n:upper(z)")
	kinds := map[string]bool{}
	for _, sp := range spans {
		kinds[sp.Kind] = true
	}
	for _, want := range []string{"integer", "float", "string", "boolean",
		"null", "type", "constraint"} {
		if !kinds[want] {
			t.Fatalf("Spans missing kind %q in %v", want, kinds)
		}
	}
	probs := a.Check("a:1 a:2 b:$.zz")
	if len(probs) < 2 {
		t.Fatalf("Check must surface both problems, got %v", probs)
	}
}

// UnifyVars surfaces a parse error (the error-return branch of the
// public API).
func TestUnifyVarsParseError(t *testing.T) {
	// jsonic is lenient about unclosed braces, so use a genuine
	// unparseable operator instead.
	_, err := New().UnifyVars("a:number > 0", nil)
	if err == nil {
		t.Fatalf("expected parse error")
	}
}

// BuiltinFuncNames is sorted and matches funcSet exactly.
func TestBuiltinFuncNamesDirect(t *testing.T) {
	names := BuiltinFuncNames()
	if len(names) != len(funcSet) {
		t.Fatalf("length mismatch")
	}
	for i, n := range names {
		if !funcSet[n] {
			t.Fatalf("unknown name %q", n)
		}
		if i > 0 && names[i-1] >= n {
			t.Fatalf("not sorted at %d", i)
		}
	}
}

// Small plumbing helpers with no other reachable call path.
func TestPlumbingHelpers(t *testing.T) {
	// numStr: integral floats print as integers, others as floats.
	if numStr(3) != "3" || numStr(1.5) != "1.5" {
		t.Fatalf("numStr: %q %q", numStr(3), numStr(1.5))
	}
	// setPos is the Val-interface position setter.
	v := newString("x")
	Val(v).setPos(7)
	if v.pos() != 7 {
		t.Fatalf("setPos")
	}
	// srcOr prefers the recorded source text.
	if srcOr("src", func() string { return "fb" }) != "src" ||
		srcOr("", func() string { return "fb" }) != "fb" {
		t.Fatalf("srcOr")
	}
	// Decimal String is the 0d-less digits rendering.
	d := newDecimal(big.NewInt(15), 1)
	if d.String() != "1.5" {
		t.Fatalf("Decimal.String: %q", d.String())
	}
	// codeClass prefix families: op[ is conflict, var[/ref[ reference.
	if codeClass("op[+]") != "conflict" || codeClass("var[x") != "reference" ||
		codeClass("ref[x") != "reference" {
		t.Fatalf("codeClass prefixes")
	}
}

// TopVal.Unify delegates to a non-top peer; NilVal.Gen defaults a
// missing why to nil_gen; Message renders the resolve form.
func TestTopAndNilContracts(t *testing.T) {
	one := numberVal(1, "1", -1)
	if out := newTop().Unify(one, &Ctx{}); out != Val(one) {
		t.Fatalf("top must yield the peer")
	}
	n := &NilVal{}
	n.sp = -1
	_, err := n.Gen(nil)
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "nil_gen" {
		t.Fatalf("why-less nil must gen nil_gen, got %v", err)
	}
	m := newNil("no_gen")
	m.primary = one
	if !strings.Contains(m.Message(), "Cannot resolve value: 1") {
		t.Fatalf("Message: %q", m.Message())
	}
}

// The parse-depth bound: >10000 nested lists is a clean max_depth
// error at parse — the iterative valTreeDepth guard (the recursive
// walkers rely on it; see maxNodeDepth).
func TestMaxDepthGuard(t *testing.T) {
	n := maxNodeDepth + 2
	src := "a:" + strings.Repeat("[", n) + "1" + strings.Repeat("]", n)
	_, err := New().Generate(src)
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "max_depth" {
		t.Fatalf("want max_depth, got %v", err)
	}
}

// asValDepth defensive fallbacks: an unknown raw node is parse_unknown;
// beyond-limit raw nesting is max_depth (the raw-side guard).
func TestAsValFallbacks(t *testing.T) {
	if v := asVal(struct{}{}); !v.Nil() {
		t.Fatalf("unknown raw node must be a nil")
	}
	deep := any("x")
	for i := 0; i < maxNodeDepth+2; i++ {
		deep = []any{deep}
	}
	// The fallback listOfRaw path guards raw recursion.
	v := asVal(deep)
	found := false
	var walk func(Val, int)
	walk = func(x Val, d int) {
		if found || d > maxNodeDepth+3 {
			return
		}
		if nv, ok := x.(*NilVal); ok && nv.why == "max_depth" {
			found = true
			return
		}
		if lv, ok := x.(*ListVal); ok && len(lv.peg) > 0 {
			walk(lv.peg[0], d+1)
		}
	}
	walk(v, 0)
	if !found {
		t.Fatalf("deep raw list must embed a max_depth nil")
	}
}

// Direct Unify contracts shared by the residual family: a nil receiver
// argument peer normalises to TOP, and self-unification is identity.
func TestResidualUnifyIdentity(t *testing.T) {
	ctx := &Ctx{root: newMap()}
	rv := &RefVal{absolute: true, peg: []any{"zz"}}
	if rv.Unify(nil, ctx) == nil {
		t.Fatalf("ref nil peer")
	}
	if rv.Unify(rv, ctx) != Val(rv) {
		t.Fatalf("ref self peer")
	}
	f := newFunc("upper", []Val{newString("x")})
	if f.Unify(f, ctx) != Val(f) {
		t.Fatalf("func self peer")
	}
	o := newPlusOp(numberVal(1, "1", -1), &RefVal{absolute: true, peg: []any{"zz"}})
	if o.Unify(o, ctx) != Val(o) {
		t.Fatalf("op self peer")
	}
	d := newDisjunct([]Val{numberVal(1, "1", -1)})
	if d.Unify(nil, ctx) == nil {
		t.Fatalf("disjunct nil peer")
	}
	l := &ListVal{}
	if l.Unify(nil, ctx) == nil {
		t.Fatalf("list nil peer")
	}
}

// A deferring reference meeting a NIL peer or its own spelling (the
// found==nil and found-is-ref defer arms).
func TestRefDeferPeers(t *testing.T) {
	// A pending (not-done) node mid-path makes find defer (return nil),
	// reaching the defer arms.
	root := newMap()
	root.set("a", newConjunct([]Val{numberVal(1, "1", -1)}))
	ctx := &Ctx{root: root}
	rv := &RefVal{absolute: true, peg: []any{"a", "b"}}
	n := newNil("x")
	if out := rv.Unify(n, ctx); !out.Nil() {
		t.Fatalf("nil peer must fail")
	}
	rv2 := &RefVal{absolute: true, peg: []any{"a", "b"}}
	if out := rv.Unify(rv2, ctx); out.Nil() {
		t.Fatalf("same-canon ref peer must defer, got %v", out.Canon())
	}
}

// RefVal.append raw-part branches and the VarVal rendering helpers.
func TestRefAppendAndVarPlumbing(t *testing.T) {
	rv := &RefVal{}
	rv.append("a")
	rv.append(2.0)
	rv.append(1.5)
	if strings.Join(func() []string {
		out := []string{}
		for _, p := range rv.peg {
			out = append(out, p.(string))
		}
		return out
	}(), "/") != "a/2/1.5" {
		t.Fatalf("append parts: %v", rv.peg)
	}
	vv := &VarVal{peg: "name"}
	if vv.Canon() != "$name" {
		t.Fatalf("var canon: %q", vv.Canon())
	}
	if _, ok := vv.superior().(*TopVal); !ok {
		t.Fatalf("var superior")
	}
	if varName(&VarVal{peg: 3}) != "" {
		t.Fatalf("varName non-string")
	}
	if varName(&VarVal{peg: newString("s")}) != "s" {
		t.Fatalf("varName scalar string")
	}
	v2, err := (&VarVal{peg: "x"}).Gen(nil)
	if v2 != nil || err != nil {
		t.Fatalf("VarVal.Gen must be silent")
	}
	g, err := (&RefVal{absolute: true, peg: []any{"q"}}).Gen(nil)
	if g != nil || err == nil {
		t.Fatalf("RefVal.Gen must error as residue")
	}
}

// pathEq and keyArgVal, direct.
func TestFuncHelpers(t *testing.T) {
	if pathEq([]string{"a"}, []string{"a", "b"}) || !pathEq([]string{"a"}, []string{"a"}) ||
		pathEq([]string{"a"}, []string{"b"}) {
		t.Fatalf("pathEq")
	}
	f := newFunc("key", []Val{newString("x")})
	if _, ok := keyArgVal(f); ok {
		t.Fatalf("keyArgVal non-integer")
	}
	f2 := newFunc("key", []Val{})
	if _, ok := keyArgVal(f2); ok {
		t.Fatalf("keyArgVal empty")
	}
}

// PlusOpVal.Gen is the no_gen residue contract (a root-level `1+$.x`
// that never resolves reports differently per port — the Gen itself is
// the Go classification site).
func TestPlusOpGen(t *testing.T) {
	o := newPlusOp(numberVal(1, "1", -1), numberVal(2, "2", -1))
	_, err := o.Gen(nil)
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "no_gen" {
		t.Fatalf("PlusOp.Gen: %v", err)
	}
	// primStr/primFloat defaults.
	if primStr(struct{}{}) != "" || primFloat(struct{}{}) != 0 {
		t.Fatalf("prim defaults")
	}
}

// An empty disjunct folds to nothing and reports |:empty.
func TestEmptyDisjunctGen(t *testing.T) {
	d := newDisjunct(nil)
	_, err := d.Gen(nil)
	ae, ok := err.(*AontuError)
	if !ok || ae.Code != "|:empty" {
		t.Fatalf("empty disjunct: %v", err)
	}
}

// unite's nil-operand arms and the recursion bound.
func TestUniteArms(t *testing.T) {
	ctx := &Ctx{}
	one := numberVal(1, "1", -1)
	if unite(ctx, nil, one) != Val(one) {
		t.Fatalf("nil a")
	}
	n := newNil("x")
	if unite(ctx, n, one) != Val(n) || unite(ctx, one, n) != Val(n) {
		t.Fatalf("nil operands short-circuit")
	}
	deep := &Ctx{depth: maxUniteDepth + 1}
	if out := unite(deep, one, one); !out.Nil() {
		t.Fatalf("depth bound must yield unify_cycle nil")
	}
}

// Check surfaces a parse error as a problem, and Spans is empty for
// unparseable source (the error arms of the tooling API).
func TestCheckParseError(t *testing.T) {
	a := New()
	probs := a.Check("a:number > 0")
	if len(probs) == 0 {
		t.Fatalf("parse error must be a problem")
	}
	if spans := a.Spans("a:number > 0"); len(spans) != 0 {
		t.Fatalf("spans of unparseable source must be empty")
	}
	// Deeper span walks: nested bags, junction residue, funcs, refs.
	spans := a.Spans("a:{b:[1,{c:2}]} d:$.a e:top f:1|$.zz g:upper($.zz)")
	if len(spans) == 0 {
		t.Fatalf("expected spans")
	}
}
