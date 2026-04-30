/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
	"testing"
)

func TestTopVal(t *testing.T) {
	tv := top()
	if !tv.IsTop() {
		t.Fatal("TopVal.IsTop() should be true")
	}
	if !tv.Done() {
		t.Fatal("TopVal.Done() should be true")
	}
	if tv.Canon() != "top" {
		t.Fatalf("TopVal.Canon() = %q, want %q", tv.Canon(), "top")
	}
	// Same singleton
	tv2 := top()
	if tv != tv2 {
		t.Fatal("top() should return singleton")
	}
	// Unify with top returns peer
	sv := NewStringVal(&ValSpec{Peg: "hello"})
	result := tv.Unify(sv, nil)
	if result != sv {
		t.Fatal("top.Unify(sv) should return sv")
	}
}

func TestScalarUnify(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Same string values unify
	s1 := NewStringVal(&ValSpec{Peg: "hello"})
	s2 := NewStringVal(&ValSpec{Peg: "hello"})
	result := s1.Unify(s2, ctx)
	if result.IsNil() {
		t.Fatal("same string values should unify")
	}
	if result.GetPeg() != "hello" {
		t.Fatalf("same string unify peg = %v, want hello", result.GetPeg())
	}

	// Different string values fail
	s3 := NewStringVal(&ValSpec{Peg: "world"})
	result = s1.Unify(s3, ctx)
	if !result.IsNil() {
		t.Fatal("different string values should produce nil")
	}

	// Same number values unify
	n1 := NewNumberVal(&ValSpec{Peg: float64(42)})
	n2 := NewNumberVal(&ValSpec{Peg: float64(42)})
	result = n1.Unify(n2, ctx)
	if result.IsNil() {
		t.Fatal("same number values should unify")
	}

	// Different number values fail
	n3 := NewNumberVal(&ValSpec{Peg: float64(99)})
	result = n1.Unify(n3, ctx)
	if !result.IsNil() {
		t.Fatal("different number values should produce nil")
	}

	// Boolean unify
	b1 := NewBooleanVal(&ValSpec{Peg: true})
	b2 := NewBooleanVal(&ValSpec{Peg: true})
	result = b1.Unify(b2, ctx)
	if result.IsNil() {
		t.Fatal("same boolean values should unify")
	}

	// Null unify
	null1 := NewNullVal(&ValSpec{})
	null2 := NewNullVal(&ValSpec{})
	result = null1.Unify(null2, ctx)
	if result.IsNil() {
		t.Fatal("null values should unify")
	}

	// Scalar with Top
	result = s1.Unify(top(), ctx)
	if result.IsNil() || result.IsTop() {
		t.Fatal("scalar.Unify(top) should return scalar")
	}
}

func TestScalarKindUnify(t *testing.T) {
	ctx := NewAontuContext(nil)

	// String kind matches string scalar
	sk := NewScalarKindVal(&ValSpec{}, KindString)
	sv := NewStringVal(&ValSpec{Peg: "hello"})
	result := sk.Unify(sv, ctx)
	if result.IsNil() {
		t.Fatal("string kind should match string scalar")
	}
	if result != sv {
		t.Fatal("kind.Unify(scalar) should return the scalar")
	}

	// String kind does not match number scalar
	nv := NewNumberVal(&ValSpec{Peg: float64(42)})
	result = sk.Unify(nv, ctx)
	if !result.IsNil() {
		t.Fatal("string kind should not match number scalar")
	}

	// Number kind matches integer scalar
	nk := NewScalarKindVal(&ValSpec{}, KindNumber)
	iv := NewIntegerVal(&ValSpec{Peg: 42})
	result = nk.Unify(iv, ctx)
	if result.IsNil() {
		t.Fatal("number kind should match integer scalar")
	}

	// Integer kind does not match number kind
	ik := NewScalarKindVal(&ValSpec{}, KindInteger)
	result = ik.Unify(nk, ctx)
	if result.IsNil() {
		t.Fatal("integer kind unify with number kind should produce number kind")
	}
}

func TestNilVal(t *testing.T) {
	ctx := NewAontuContext(&AontuOptions{Collect: true})

	nil_ := makeNilErr(ctx, "test_error", nil, nil)
	if !nil_.IsNil() {
		t.Fatal("NilVal.IsNil() should be true")
	}
	if !nil_.Done() {
		t.Fatal("NilVal should be done")
	}
	if nil_.Why() != "test_error" {
		t.Fatalf("NilVal.Why() = %q, want %q", nil_.Why(), "test_error")
	}

	// Nil propagates through unify
	sv := NewStringVal(&ValSpec{Peg: "hello"})
	result := nil_.Unify(sv, ctx)
	if result != nil_ {
		t.Fatal("nil.Unify should return self")
	}
}

func TestContext(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Descend
	child := ctx.Descend("a")
	if len(child.path) != 1 || child.path[0] != "a" {
		t.Fatalf("descended path = %v, want [a]", child.path)
	}

	grandchild := child.Descend("b")
	if len(grandchild.path) != 2 || grandchild.path[0] != "a" || grandchild.path[1] != "b" {
		t.Fatalf("descended path = %v, want [a b]", grandchild.path)
	}

	// Descend cache
	child2 := ctx.Descend("a")
	if child != child2 {
		t.Fatal("descend cache should return same instance")
	}
}

func TestMapValUnify(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Two maps with same key unify
	m1 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(1)}),
	}}, nil)
	m2 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(1)}),
	}}, nil)
	result := unite(ctx, m1, m2, "test")
	if result.IsNil() {
		t.Fatalf("same maps should unify, got nil: %s", result.Canon())
	}
	g, err := result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	gm, ok := g.(map[string]interface{})
	if !ok {
		t.Fatalf("gen result type = %T, want map", g)
	}
	if gm["a"] != float64(1) {
		t.Fatalf("gen a = %v, want 1", gm["a"])
	}

	// Maps merge keys
	m3 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(1)}),
	}}, nil)
	m4 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"b": NewNumberVal(&ValSpec{Peg: float64(2)}),
	}}, nil)
	result = unite(ctx, m3, m4, "test")
	if result.IsNil() {
		t.Fatalf("disjoint maps should unify, got nil: %s", result.Canon())
	}
	g, err = result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	gm, ok = g.(map[string]interface{})
	if !ok {
		t.Fatalf("gen result type = %T, want map", g)
	}
	if gm["a"] != float64(1) || gm["b"] != float64(2) {
		t.Fatalf("gen = %v, want {a:1, b:2}", gm)
	}

	// Maps with conflicting values produce a map with nil child
	m5 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(1)}),
	}}, nil)
	m6 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(2)}),
	}}, nil)
	result = unite(ctx, m5, m6, "test")
	if result.IsMap() {
		rm := result.(*MapVal).PegMap()
		if rm["a"] == nil || !rm["a"].IsNil() {
			t.Fatalf("conflicting key 'a' should be nil, got: %s", result.Canon())
		}
	} else if !result.IsNil() {
		t.Fatalf("conflicting maps should produce map-with-nil or nil, got: %s", result.Canon())
	}
}

func TestMapValGen(t *testing.T) {
	ctx := NewAontuContext(nil)

	m := NewMapVal(&ValSpec{Peg: map[string]Val{
		"x": NewStringVal(&ValSpec{Peg: "hello"}),
		"y": NewNumberVal(&ValSpec{Peg: float64(42)}),
		"z": NewBooleanVal(&ValSpec{Peg: true}),
	}}, nil)
	m.dc = DONE

	g, err := m.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	gm := g.(map[string]interface{})
	if gm["x"] != "hello" {
		t.Fatalf("x = %v, want hello", gm["x"])
	}
	if gm["y"] != float64(42) {
		t.Fatalf("y = %v, want 42", gm["y"])
	}
	if gm["z"] != true {
		t.Fatalf("z = %v, want true", gm["z"])
	}
}

func TestListValUnify(t *testing.T) {
	ctx := NewAontuContext(nil)

	l1 := NewListVal(&ValSpec{Peg: []Val{
		NewNumberVal(&ValSpec{Peg: float64(1)}),
		NewNumberVal(&ValSpec{Peg: float64(2)}),
	}}, nil)

	result := unite(ctx, l1, top(), "test")
	if result.IsNil() {
		t.Fatalf("list + top should unify, got nil: %s", result.Canon())
	}
	g, err := result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	ga, ok := g.([]interface{})
	if !ok {
		t.Fatalf("gen result type = %T, want slice", g)
	}
	if len(ga) != 2 || ga[0] != float64(1) || ga[1] != float64(2) {
		t.Fatalf("gen = %v, want [1 2]", ga)
	}
}

func TestMapCanon(t *testing.T) {
	m := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(1)}),
		"b": NewStringVal(&ValSpec{Peg: "hello"}),
	}}, nil)

	canon := m.Canon()
	// Keys are sorted
	if canon != "{a:1,b:'hello'}" {
		t.Fatalf("MapVal.Canon() = %q, want %q", canon, "{a:1,b:'hello'}")
	}
}

func TestListCanon(t *testing.T) {
	l := NewListVal(&ValSpec{Peg: []Val{
		NewNumberVal(&ValSpec{Peg: float64(1)}),
		NewStringVal(&ValSpec{Peg: "two"}),
	}}, nil)

	canon := l.Canon()
	if canon != "[1,'two']" {
		t.Fatalf("ListVal.Canon() = %q, want %q", canon, "[1,'two']")
	}
}

func TestUnite(t *testing.T) {
	ctx := NewAontuContext(nil)

	// nil + val
	sv := NewStringVal(&ValSpec{Peg: "hello"})
	result := unite(ctx, nil, sv, "test")
	if result != sv {
		t.Fatal("unite(nil, sv) should return sv")
	}

	// val + nil
	result = unite(ctx, sv, nil, "test")
	if result.GetPeg() != "hello" {
		t.Fatal("unite(sv, nil) should return sv")
	}

	// val + top
	result = unite(ctx, sv, top(), "test")
	if result.GetPeg() != "hello" {
		t.Fatal("unite(sv, top) should return sv")
	}

	// top + val
	result = unite(ctx, top(), sv, "test")
	if result != sv {
		t.Fatal("unite(top, sv) should return sv")
	}

	// nil propagation
	nilv := makeNilErr(ctx, "test", nil, nil)
	result = unite(ctx, nilv, sv, "test")
	if !result.IsNil() {
		t.Fatal("unite(nil, sv) should propagate nil")
	}
}

func TestConjunctVal(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Conjunct of two maps merges keys
	m1 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"a": NewNumberVal(&ValSpec{Peg: float64(1)}),
	}}, nil)
	m2 := NewMapVal(&ValSpec{Peg: map[string]Val{
		"b": NewNumberVal(&ValSpec{Peg: float64(2)}),
	}}, nil)
	cj := NewConjunctVal(&ValSpec{Peg: []Val{m1, m2}}, nil)
	result := cj.Unify(top(), ctx)
	if result.IsNil() {
		t.Fatalf("conjunct should unify, got: %s", result.Canon())
	}
	g, err := result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	gm := g.(map[string]interface{})
	if gm["a"] != float64(1) || gm["b"] != float64(2) {
		t.Fatalf("gen = %v, want {a:1, b:2}", gm)
	}
}

func TestDisjunctVal(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Disjunct with matching peer resolves to single value
	s1 := NewStringVal(&ValSpec{Peg: "hello"})
	s2 := NewStringVal(&ValSpec{Peg: "world"})
	dj := NewDisjunctVal(&ValSpec{Peg: []Val{s1, s2}}, nil)

	// Unify with "hello" — only s1 matches
	peer := NewStringVal(&ValSpec{Peg: "hello"})
	result := dj.Unify(peer, ctx)
	if result.IsNil() {
		t.Fatalf("disjunct should match, got nil")
	}
	if result.GetPeg() != "hello" {
		t.Fatalf("disjunct result = %v, want hello", result.GetPeg())
	}
}

func TestPrefVal(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Pref with number default
	inner := NewNumberVal(&ValSpec{Peg: float64(1)})
	pref := NewPrefVal(&ValSpec{Peg: inner}, nil)

	// Pref with TOP returns the pref (preserves default)
	result := pref.Unify(top(), ctx)
	if result.IsNil() {
		t.Fatalf("pref+top should not fail")
	}
	g, err := result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	if g != float64(1) {
		t.Fatalf("pref gen = %v, want 1", g)
	}

	// Pref with concrete peer — peer wins if type matches
	peer := NewNumberVal(&ValSpec{Peg: float64(42)})
	result = pref.Unify(peer, ctx)
	if result.IsNil() {
		t.Fatalf("pref+peer should not fail, got: %s", result.Canon())
	}
	g, err = result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	if g != float64(42) {
		t.Fatalf("pref+peer gen = %v, want 42", g)
	}
}

func TestSpreadVal(t *testing.T) {
	ctx := NewAontuContext(nil)

	// Spread with map constraint applied to a map
	spreadMap := NewMapVal(&ValSpec{Peg: map[string]Val{
		"x": NewNumberVal(&ValSpec{Peg: float64(1)}),
	}}, nil)
	spread := NewSpreadVal(&ValSpec{Peg: spreadMap}, nil)

	target := NewMapVal(&ValSpec{Peg: map[string]Val{
		"b": NewMapVal(&ValSpec{Peg: map[string]Val{
			"y": NewNumberVal(&ValSpec{Peg: float64(2)}),
		}}, nil),
	}}, nil)

	result := spread.Unify(target, ctx)
	if result.IsNil() {
		t.Fatalf("spread should apply, got nil: %s", result.Canon())
	}
	if !result.IsMap() {
		t.Fatalf("spread result should be map, got: %T", result)
	}
}

func TestUpperLower(t *testing.T) {
	ctx := NewAontuContext(nil)

	// upper("hello") = "HELLO"
	arg := NewStringVal(&ValSpec{Peg: "hello"})
	upper := NewUpperFuncVal(&ValSpec{Peg: []Val{arg}}, nil)
	result := upper.Unify(top(), ctx)
	if result.IsNil() {
		t.Fatal("upper should resolve")
	}
	g, err := result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	if g != "HELLO" {
		t.Fatalf("upper gen = %v, want HELLO", g)
	}

	// lower("HELLO") = "hello"
	arg2 := NewStringVal(&ValSpec{Peg: "HELLO"})
	lower := NewLowerFuncVal(&ValSpec{Peg: []Val{arg2}}, nil)
	result = lower.Unify(top(), ctx)
	g, err = result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	if g != "hello" {
		t.Fatalf("lower gen = %v, want hello", g)
	}
}

func TestPlusOp(t *testing.T) {
	ctx := NewAontuContext(nil)

	// 1 + 2 = 3
	a := NewNumberVal(&ValSpec{Peg: float64(1)})
	b := NewNumberVal(&ValSpec{Peg: float64(2)})
	plus := NewPlusOpVal(&ValSpec{Peg: []Val{a, b}}, nil)
	result := plus.Unify(top(), ctx)
	if result.IsNil() {
		t.Fatal("plus should resolve")
	}
	g, err := result.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	if g != float64(3) {
		t.Fatalf("plus gen = %v, want 3", g)
	}
}

func TestFixpointUnify(t *testing.T) {
	// Build a simple map and unify through the fixpoint loop
	m := NewMapVal(&ValSpec{Peg: map[string]Val{
		"x": NewNumberVal(&ValSpec{Peg: float64(1)}),
		"y": NewStringVal(&ValSpec{Peg: "hello"}),
	}}, nil)

	a := NewAontu(nil)
	result, err := a.UnifyVal(m, nil)
	if err != nil {
		t.Fatalf("unify error: %v", err)
	}
	if result.Res == nil || result.Res.IsNil() {
		t.Fatal("unify should produce result")
	}
	if !result.Res.Done() {
		t.Fatalf("result should be done, dc=%d", result.Res.GetDC())
	}

	ctx := NewAontuContext(&AontuOptions{Collect: true})
	g, err := result.Res.Gen(ctx)
	if err != nil {
		t.Fatalf("gen error: %v", err)
	}
	gm := g.(map[string]interface{})
	if gm["x"] != float64(1) || gm["y"] != "hello" {
		t.Fatalf("gen = %v, want {x:1, y:hello}", gm)
	}
}

func TestParseSimple(t *testing.T) {
	a := NewAontu(nil)

	// Simple map
	g, err := a.Generate("a:1,b:2")
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	gm, ok := g.(map[string]interface{})
	if !ok {
		t.Fatalf("result type = %T, want map", g)
	}
	// jsonic produces float64 for numbers
	if gm["a"] != float64(1) && gm["a"] != 1 {
		t.Fatalf("a = %v (%T), want 1", gm["a"], gm["a"])
	}
	if gm["b"] != float64(2) && gm["b"] != 2 {
		t.Fatalf("b = %v (%T), want 2", gm["b"], gm["b"])
	}
}

func TestParseString(t *testing.T) {
	a := NewAontu(nil)

	g, err := a.Generate("x:hello")
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	gm := g.(map[string]interface{})
	if gm["x"] != "hello" {
		t.Fatalf("x = %v, want hello", gm["x"])
	}
}

func TestParseNested(t *testing.T) {
	a := NewAontu(nil)

	g, err := a.Generate("a:{x:1,y:2}")
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	gm := g.(map[string]interface{})
	inner, ok := gm["a"].(map[string]interface{})
	if !ok {
		t.Fatalf("a type = %T, want map", gm["a"])
	}
	if inner["x"] != float64(1) && inner["x"] != 1 {
		t.Fatalf("a.x = %v, want 1", inner["x"])
	}
}

func TestCanon(t *testing.T) {
	sv := NewStringVal(&ValSpec{Peg: "hello"})
	if sv.Canon() != "'hello'" {
		t.Fatalf("StringVal.Canon() = %q, want %q", sv.Canon(), "'hello'")
	}

	nv := NewNumberVal(&ValSpec{Peg: float64(42)})
	if nv.Canon() != "42" {
		t.Fatalf("NumberVal.Canon() = %q, want %q", nv.Canon(), "42")
	}

	nv2 := NewNumberVal(&ValSpec{Peg: float64(3.14)})
	if nv2.Canon() != "3.14" {
		t.Fatalf("NumberVal.Canon() = %q, want %q", nv2.Canon(), "3.14")
	}

	bv := NewBooleanVal(&ValSpec{Peg: true})
	if bv.Canon() != "true" {
		t.Fatalf("BooleanVal.Canon() = %q, want %q", bv.Canon(), "true")
	}

	null := NewNullVal(&ValSpec{})
	if null.Canon() != "null" {
		t.Fatalf("NullVal.Canon() = %q, want %q", null.Canon(), "null")
	}
}

// --- TSV Spec Test Harness ---

type specEntry struct {
	input    string
	genJSON  string
}

func loadGenSpec(t *testing.T, name string) []specEntry {
	t.Helper()
	_, filename, _, _ := runtime.Caller(0)
	specDir := filepath.Join(filepath.Dir(filename), "..", "test", "spec")
	specPath := filepath.Join(specDir, name)

	f, err := os.Open(specPath)
	if err != nil {
		t.Fatalf("failed to open spec file %s: %v", specPath, err)
	}
	defer f.Close()

	var entries []specEntry
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "\t", 4)
		if len(parts) < 4 {
			continue
		}
		entries = append(entries, specEntry{
			input:   parts[0],
			genJSON: parts[3],
		})
	}
	return entries
}

func runGenSpec(t *testing.T, name string) {
	t.Helper()
	entries := loadGenSpec(t, name)
	a := NewAontu(nil)

	for _, e := range entries {
		t.Run(e.input, func(t *testing.T) {
			g, err := a.Generate(e.input)
			if err != nil {
				t.Fatalf("generate error for %q: %v", e.input, err)
			}

			// Normalize: marshal to JSON and compare
			gotJSON, err := json.Marshal(g)
			if err != nil {
				t.Fatalf("marshal error: %v", err)
			}

			// Parse expected JSON for structural comparison
			var expected interface{}
			if err := json.Unmarshal([]byte(e.genJSON), &expected); err != nil {
				t.Fatalf("bad expected JSON %q: %v", e.genJSON, err)
			}

			var got interface{}
			if err := json.Unmarshal(gotJSON, &got); err != nil {
				t.Fatalf("bad got JSON %q: %v", string(gotJSON), err)
			}

			if !reflect.DeepEqual(got, expected) {
				t.Errorf("input: %q\n  got:  %s\n  want: %s", e.input, gotJSON, e.genJSON)
			}
		})
	}
}

func TestSpecBasic(t *testing.T)      { runGenSpec(t, "basic.tsv") }
func TestSpecRef(t *testing.T)        { runGenSpec(t, "ref.tsv") }
func TestSpecConjunct(t *testing.T)   { runGenSpec(t, "conjunct.tsv") }
func TestSpecKeyEdge(t *testing.T)    { runGenSpec(t, "key-edge.tsv") }
func TestSpecLangParity(t *testing.T) { runGenSpec(t, "lang-parity.tsv") }
func TestSpecParityEdge(t *testing.T)   { runGenSpec(t, "parity-edge.tsv") }
func TestSpecRelativePath(t *testing.T) { runGenSpec(t, "relative-path.tsv") }
