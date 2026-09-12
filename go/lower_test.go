package aontu

import (
	"reflect"
	"strings"
	"testing"
)


func lowerTestCtx(family string, profile map[string]any) *lowerCtx {
	p := map[string]any{"lang": family}
	for k, v := range profile {
		p[k] = v
	}
	lossy := []RenderLoss{}
	return &lowerCtx{profile: p, family: family, unit: "u", lossy: &lossy}
}

func TestLowerWordsAndCases(t *testing.T) {
	for _, c := range []struct {
		name string
		want []string
	}{
		{"HTTPServer2Go", []string{"HTTP", "Server", "2", "Go"}},
		{"utf8_string-value", []string{"utf", "8", "string", "value"}},
		{"naïveName", []string{"naïve", "Name"}},
		{"a b", []string{"a", "b"}},
		{"__", []string{}},
	} {
		if got := lowerSplitWords(c.name); !reflect.DeepEqual(got, c.want) {
			t.Fatalf("%q: want %v, got %v", c.name, c.want, got)
		}
	}
	// A code point at or above U+0080 is never split and never
	// converted: it rides into its word, whatever the style.
	for _, c := range []struct{ name, style, want string }{
		{"crème_brûlée", "pascal", "CrèmeBrûlée"},
		{"über2Go", "snake", "über_2_go"},
		{"a-b c", "kebab", "a-b-c"},
		{"a-b c", "screaming", "A_B_C"},
		{"__", "pascal", "__"},
		{"AsIs_x", "as-is", "AsIs_x"},
	} {
		if got := lowerCaseName(c.name, c.style, nil); got != c.want {
			t.Fatalf("%q %s: want %q, got %q", c.name, c.style, c.want, got)
		}
	}
	if got := lowerCaseName("ledgerId", "camel", []string{"ID"}); "ledgerID" != got {
		t.Fatalf("camel acronym: %q", got)
	}
	if got := lowerCaseName("id", "camel", []string{"ID"}); "id" != got {
		t.Fatalf("camel first word: %q", got)
	}
}

func TestLowerQuote(t *testing.T) {
	profile := map[string]any{"str": map[string]any{
		"quote": "'", "escape": map[string]any{"10": "\\n"},
	}}
	if got := lowerQuote("it's \"x\"\n\x02", profile); "'it\\u0027s \"x\"\\n\\u0002'" != got {
		t.Fatalf("quote: %q", got)
	}
	// No str at all: the double quote, and a bare table.
	if got := lowerQuote("a\"b\\c", map[string]any{}); "\"a\\u0022b\\u005cc\"" != got {
		t.Fatalf("bare: %q", got)
	}
}

func TestLowerLiterals(t *testing.T) {
	goCtx := lowerTestCtx("go", nil)
	tsCtx := lowerTestCtx("typescript", nil)
	for _, c := range []struct {
		v    any
		ctx  *lowerCtx
		want string
	}{
		{1.5, goCtx, "1.5"},
		{int64(3), goCtx, "3"},
		{nil, goCtx, "nil"},
		{nil, tsCtx, "null"},
		{false, tsCtx, "false"},
		{true, tsCtx, "true"},
		{"s", tsCtx, "\"s\""},
	} {
		if got := lowerLiteral(c.v, c.ctx); got != c.want {
			t.Fatalf("%v: want %q, got %q", c.v, c.want, got)
		}
	}
}

func TestLowerLitPrimInGo(t *testing.T) {
	ctx := lowerTestCtx("go", nil)
	for _, c := range []struct {
		of   []any
		want string
	}{
		{[]any{1.5, int64(2)}, "float"},
		{[]any{int64(1), 2.0}, "int"},
		{[]any{true}, "bool"},
		{[]any{nil}, "null"},
		{[]any{"a", int64(1)}, "any"},
	} {
		got := lowerTypeExpr(map[string]any{"k": "lit", "n": c.of}, ctx, "$").text
		if got != c.want {
			t.Fatalf("%v: want %q, got %q", c.of, c.want, got)
		}
	}
	if 5 != len(*ctx.lossy) {
		t.Fatalf("losses: %d", len(*ctx.lossy))
	}
}

func TestLowerFallbacksWithoutTypeForms(t *testing.T) {
	// A supplied profile may name a lowering and no forms: the
	// primitive is its own name, and a form is open-less and close-less.
	ctx := lowerTestCtx("typescript", nil)
	prim := func(p string) map[string]any { return map[string]any{"k": "prim", "prim": p} }
	for _, c := range []struct {
		t    map[string]any
		want string
	}{
		{prim("int"), "int"},
		{map[string]any{"k": "list", "n": prim("int")}, "int"},
		{map[string]any{"k": "map", "key": prim("string"), "n": prim("int")}, "string, int"},
		{map[string]any{"k": "union", "n": []any{prim("a"), prim("b")}}, "a | b"},
	} {
		if got := lowerTypeExpr(c.t, ctx, "$").text; got != c.want {
			t.Fatalf("%v: want %q, got %q", c.t, c.want, got)
		}
	}
}

func TestLowerParenRule(t *testing.T) {
	// The vocabulary keeps a container to leaves, so a list of a
	// nullable reaches the fold only through RenderValue -- where the
	// TypeScript forms say (string | null)[] and not string | null[].
	profile := bundledProfile("typescript")
	report := RenderValue(map[string]any{
		"aontu": map[string]any{"Code": map[string]any{
			"units": []any{map[string]any{
				"path": "a.ts", "lang": "typescript",
				"decls": []any{map[string]any{
					"k": "record", "name": "T", "open": false, "check": []any{},
					"fields": []any{map[string]any{
						"name": "a", "optional": false,
						"type": map[string]any{"k": "list", "n": map[string]any{
							"k": "opt", "n": map[string]any{"k": "prim", "prim": "string"},
						}},
					}},
				}},
			}},
		}},
	}, &RenderOptions{Profiles: []map[string]any{profile}})
	if "ok" != report.Verdict {
		t.Fatalf("verdict: %+v", report)
	}
	if want := "export interface T {\n  a: (string | null)[];\n}\n"; want != report.Units[0].Text {
		t.Fatalf("text: %q", report.Units[0].Text)
	}
}

func TestLowerBodyPieceWithoutDepth(t *testing.T) {
	profile := bundledProfile("typescript")
	unit := func(piece any) map[string]any {
		return map[string]any{"aontu": map[string]any{"Code": map[string]any{"units": []any{map[string]any{
			"path": "a.ts", "lang": "typescript",
			"decls": []any{map[string]any{
				"k": "func", "name": "f", "params": []any{},
				"body": map[string]any{"k": "frag", "n": []any{
					piece, map[string]any{"k": "blank"}, "done()",
				}},
			}},
		}}}}}
	}
	opts := &RenderOptions{Profiles: []map[string]any{profile}}
	bare := RenderValue(unit(map[string]any{"k": "line", "n": []any{"go()"}}), opts)
	at0 := RenderValue(unit(map[string]any{"k": "line", "at": int64(0), "n": []any{"go()"}}), opts)
	if bare.Verdict != at0.Verdict || 1 != len(bare.Units) || 1 != len(at0.Units) {
		t.Fatalf("bare: %+v\nat0: %+v", bare, at0)
	}
	if bare.Units[0].Text != at0.Units[0].Text {
		t.Fatalf("bare: %q\nat0: %q", bare.Units[0].Text, at0.Units[0].Text)
	}
	if !strings.Contains(bare.Units[0].Text, "\n  go()\n\n  done()\n") {
		t.Fatalf("text: %q", bare.Units[0].Text)
	}
}
