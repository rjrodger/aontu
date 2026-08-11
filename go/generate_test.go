/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"encoding/json"
	"math/big"
	"strings"
	"testing"
)

// The number tower's GENERATE contract (docs/design/number-tower.md, D9).
//
// These tests exist because byte-exact serialisation CANNOT see what
// they check. The three surfaces are deliberately separate:
//
//	canon  pins the AST kind        (0d1e3 canons as `0d1000.0`)
//	gens   pins the bytes           (it emits `1000.0`)
//	here   pins the runtime OBJECT  (it is a *Decimal, not a float64)
//
// The gap is real in both directions: an integral bigdecimal and a
// biginteger serialise to DIFFERENT text (`1000.0` vs `1000`) though
// both are exact, while a biginteger and an integer serialise to the
// SAME text (`5`) with completely different native types. Only an
// assertion on the concrete type can tell the second pair apart, so the
// spec suite alone would let generate return the wrong object and stay
// green.

// TestGenerateNativeExactTypes pins the concrete Go type generate
// returns for every scalar leaf — above all the two exact ones, whose
// types are the consumer-visible half of D9.
func TestGenerateNativeExactTypes(t *testing.T) {
	cases := []struct {
		name string
		src  string
		// check receives the generated value for key "x".
		check func(t *testing.T, got any)
	}{
		{"biginteger", "x:0d5", func(t *testing.T, got any) {
			n, ok := got.(*big.Int)
			if !ok {
				t.Fatalf("biginteger generated as %T, want *big.Int", got)
			}
			if n.Int64() != 5 {
				t.Fatalf("biginteger value = %v, want 5", n)
			}
		}},
		// The one an integer cannot be told apart from by its bytes: both
		// `x:5` and `x:0d5` serialise as {"x":5}.
		{"integer-is-not-biginteger", "x:5", func(t *testing.T, got any) {
			if _, isBig := got.(*big.Int); isBig {
				t.Fatalf("integer generated as *big.Int; the leaves are disjoint")
			}
			if _, ok := got.(int64); !ok {
				t.Fatalf("integer generated as %T, want int64", got)
			}
		}},
		{"float-is-not-exact", "x:1.5", func(t *testing.T, got any) {
			if _, ok := got.(float64); !ok {
				t.Fatalf("float generated as %T, want float64", got)
			}
		}},
		{"bigdecimal", "x:0d0.1", func(t *testing.T, got any) {
			d, ok := got.(*Decimal)
			if !ok {
				t.Fatalf("bigdecimal generated as %T, want *Decimal", got)
			}
			if d.digits() != "0.1" {
				t.Fatalf("bigdecimal digits = %q, want %q", d.digits(), "0.1")
			}
		}},
		// An INTEGRAL bigdecimal is still a *Decimal, not a *big.Int: the
		// `0d` prefix names the family, the source form names the leaf.
		{"bigdecimal-integral", "x:0d1e3", func(t *testing.T, got any) {
			d, ok := got.(*Decimal)
			if !ok {
				t.Fatalf("integral bigdecimal generated as %T, want *Decimal", got)
			}
			if d.digits() != "1000.0" {
				t.Fatalf("integral bigdecimal digits = %q, want %q", d.digits(), "1000.0")
			}
		}},
		// The value that motivated the whole tower: exact above 2^53,
		// where a float64 would silently hold …992.
		{"biginteger-above-pow53", "x:0d9007199254740993", func(t *testing.T, got any) {
			n, ok := got.(*big.Int)
			if !ok {
				t.Fatalf("biginteger generated as %T, want *big.Int", got)
			}
			if n.String() != "9007199254740993" {
				t.Fatalf("biginteger value = %v, want 9007199254740993", n)
			}
		}},
		{"negated-biginteger", "x:-0d5", func(t *testing.T, got any) {
			n, ok := got.(*big.Int)
			if !ok {
				t.Fatalf("negated biginteger generated as %T, want *big.Int", got)
			}
			if n.Int64() != -5 {
				t.Fatalf("negated biginteger = %v, want -5", n)
			}
		}},
		// An exact SUM keeps the leaf too: the native type follows the
		// value, not the syntax that produced it.
		{"exact-sum", "x:0d0.1+0d0.2", func(t *testing.T, got any) {
			d, ok := got.(*Decimal)
			if !ok {
				t.Fatalf("exact sum generated as %T, want *Decimal", got)
			}
			if d.digits() != "0.3" {
				t.Fatalf("exact sum digits = %q, want %q", d.digits(), "0.3")
			}
		}},
	}

	a := New()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			out, err := a.Generate(c.src)
			if err != nil {
				t.Fatalf("generate error: %v\n src: %q", err, c.src)
			}
			m, ok := out.(map[string]any)
			if !ok {
				t.Fatalf("generated %T, want map[string]any", out)
			}
			c.check(t, m["x"])
		})
	}
}

// TestGenerateExactTypesNested pins the same types inside containers:
// generation is recursive, so a list element and a nested map value must
// carry the exact pointer types too.
func TestGenerateExactTypesNested(t *testing.T) {
	out, err := New().Generate("x:[0d1,0d2.5]\ny:{z:0d7}")
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	m := out.(map[string]any)

	list, ok := m["x"].([]any)
	if !ok {
		t.Fatalf("list generated as %T, want []any", m["x"])
	}
	if _, ok := list[0].(*big.Int); !ok {
		t.Fatalf("list element 0 is %T, want *big.Int", list[0])
	}
	if _, ok := list[1].(*Decimal); !ok {
		t.Fatalf("list element 1 is %T, want *Decimal", list[1])
	}

	inner, ok := m["y"].(map[string]any)
	if !ok {
		t.Fatalf("nested map generated as %T, want map[string]any", m["y"])
	}
	if _, ok := inner["z"].(*big.Int); !ok {
		t.Fatalf("nested value is %T, want *big.Int", inner["z"])
	}
}

// TestGeneratedBigIntegerIsACopy pins the immutability contract at the
// API boundary (D8): pegs are immutable and shared by clones, so the
// mutable *big.Int a consumer receives must not BE the peg. Without the
// copy, mutating a generated value would corrupt a $var bound to it and
// silently change the next generate.
func TestGeneratedBigIntegerIsACopy(t *testing.T) {
	a := New()
	vars := map[string]Val{"n": NewBigInteger(big.NewInt(5))}

	out, err := a.GenerateVars("x:$n", vars)
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	got := out.(map[string]any)["x"].(*big.Int)
	got.SetInt64(99)

	out2, err := a.GenerateVars("x:$n", vars)
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	again := out2.(map[string]any)["x"].(*big.Int)
	if again.Int64() != 5 {
		t.Fatalf("mutating a generated value changed the source value: got %v, want 5", again)
	}
}

// TestExactValuesMarshalAsRawDigits pins the JSON half of D9: an exact
// value reaches JSON as exact DIGITS in a raw JSON number, never as a
// string, an object, or a rounded float.
func TestExactValuesMarshalAsRawDigits(t *testing.T) {
	cases := []struct{ name, src, want string }{
		{"bigint", "x:0d5", `{"x":5}`},
		// 2^53+1 — the value a float64 cannot hold, and the reason the
		// exact leaves exist.
		{"bigint-above-pow53", "x:0d9007199254740993", `{"x":9007199254740993}`},
		{"bigint-huge", "x:0d123456789012345678901234567890",
			`{"x":123456789012345678901234567890}`},
		{"bigdecimal", "x:0d0.1", `{"x":0.1}`},
		// The `.0` survives into JSON. It is not canon's `0d` marker (that
		// is Aontu syntax and has no place in JSON), it is the digits the
		// value has: an integral bigdecimal is a decimal.
		{"bigdecimal-integral", "x:0d1e3", `{"x":1000.0}`},
		{"bigdecimal-negative", "x:-0d1.5", `{"x":-1.5}`},
	}

	a := New()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			out, err := a.Generate(c.src)
			if err != nil {
				t.Fatalf("generate error: %v\n src: %q", err, c.src)
			}
			b, err := json.Marshal(out)
			if err != nil {
				t.Fatalf("marshal error: %v", err)
			}
			if string(b) != c.want {
				t.Fatalf("marshal mismatch\n src:  %q\n want: %s\n got:  %s",
					c.src, c.want, string(b))
			}
		})
	}
}

// TestCLIMarshalIndentKeepsExactDigits runs the exact leaves through the
// encoder the CLI actually uses (json.MarshalIndent in
// go/cmd/aontu/main.go), so the command line cannot quietly lose what
// json.Marshal preserves.
func TestCLIMarshalIndentKeepsExactDigits(t *testing.T) {
	out, err := New().Generate("a:0d9007199254740993\nb:0d1e3\nc:0d0.1")
	if err != nil {
		t.Fatalf("generate error: %v", err)
	}
	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	want := "{\n  \"a\": 9007199254740993,\n  \"b\": 1000.0,\n  \"c\": 0.1\n}"
	if string(b) != want {
		t.Fatalf("CLI rendering mismatch\n want: %s\n got:  %s", want, string(b))
	}
}

// TestNonPointerBigIntMarshalsAsObject is the negative control for the
// pointer requirement in D9 — the reason ScalarVal.Gen must hand out a
// *big.Int and not a big.Int. A value big.Int in an `any` has no
// MarshalJSON in its method set, so encoding/json falls back to the
// struct encoder and emits `{}` for it: an exact number silently
// replaced by an empty object, which is precisely the class of failure
// the exact leaves exist to eliminate. If this test ever fails because
// the standard library changed, the pointer is still correct — but the
// comment explaining why can be relaxed.
func TestNonPointerBigIntMarshalsAsObject(t *testing.T) {
	b, err := json.Marshal(map[string]any{"x": *big.NewInt(5)})
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	if string(b) != `{"x":{}}` {
		t.Fatalf("expected a non-pointer big.Int to marshal as an empty object, got %s", string(b))
	}
}

// TestDecimalMarshalJSONIsPlainDigits pins the emitter itself: plain
// digits at every magnitude, never scientific notation, no `0d` marker
// (that is canon's business, not JSON's), and the single decimal place
// kept for an integral value so the JSON still shows a decimal.
func TestDecimalMarshalJSONIsPlainDigits(t *testing.T) {
	cases := []struct {
		coeff int64
		scale int32
		want  string
	}{
		{15, 1, "1.5"},
		{-15, 1, "-1.5"},
		{1, 1, "0.1"},
		{1, -3, "1000.0"}, // integral: the .0 stays
		{0, 1, "0.0"},
		{1, 20, "0.00000000000000000001"}, // plain form, not 1e-20
	}
	for _, c := range cases {
		d := newDecimal(big.NewInt(c.coeff), c.scale)
		b, err := d.MarshalJSON()
		if err != nil {
			t.Fatalf("MarshalJSON error: %v", err)
		}
		if string(b) != c.want {
			t.Fatalf("MarshalJSON(%d,%d) = %s, want %s", c.coeff, c.scale, string(b), c.want)
		}
		if strings.ContainsAny(string(b), "eE") {
			t.Fatalf("MarshalJSON(%d,%d) = %s, want plain form", c.coeff, c.scale, string(b))
		}
		// A raw JSON number, not a string and not an object: it must
		// decode as a number.
		var back any
		if err := json.Unmarshal(b, &back); err != nil {
			t.Fatalf("emitted %s is not valid JSON: %v", string(b), err)
		}
		if _, ok := back.(float64); !ok {
			t.Fatalf("emitted %s decodes as %T, want a JSON number", string(b), back)
		}
	}
}

// TestLossyIntegerLiteralRefused pins D7 at the API level, alongside the
// spec rows: the refusal is about EXACTNESS, not magnitude.
func TestLossyIntegerLiteralRefused(t *testing.T) {
	refused := []struct{ name, src string }{
		{"pow53-plus-one", "x:9007199254740993"},
		// 0x7fffffffffffffff LOOKS like the largest int64, and is: it is
		// refused because a binary64 rounds it UP to 2^63.
		{"int64-max-hex", "x:0x7fffffffffffffff"},
		{"pow64-minus-one-hex", "x:0xffffffffffffffff"},
		// The separator rule and D7 are independent: stripping the
		// separators leaves the same lossy value.
		{"separated-hex", "x:0xff_ffffffffffffff"},
		{"octal", "x:0o777777777777777777777"},
		{"decimal-exponent", "x:1e23"},
	}
	for _, c := range refused {
		t.Run("refused/"+c.name, func(t *testing.T) {
			_, err := New().Generate(c.src)
			if err == nil {
				t.Fatalf("expected a refusal for %q", c.src)
			}
			// The two substrings the shared spec rows assert: the reason,
			// and the escape.
			if !strings.Contains(err.Error(), "exactly representable") {
				t.Fatalf("error does not give the reason: %v", err)
			}
			if !strings.Contains(err.Error(), "0d") {
				t.Fatalf("error does not name the 0d escape: %v", err)
			}
		})
	}

	// Exact literals of any size are still values. 2^124 is the case the
	// design got wrong before the arithmetic was checked: it is a power
	// of two, so a binary64 holds it exactly however long it looks.
	kept := []struct{ name, src string }{
		{"pow53", "x:9007199254740992"},
		{"pow124-hex", "x:0x10000000000000000000000000000000"},
		{"pow20-decimal", "x:100000000000000000000"},
		{"exp21", "x:1e21"},
		{"underflow", "x:1e-400"},
		{"escape-hatch", "x:0d9007199254740993"},
	}
	for _, c := range kept {
		t.Run("kept/"+c.name, func(t *testing.T) {
			if _, err := New().Generate(c.src); err != nil {
				t.Fatalf("expected %q to stay a value, got: %v", c.src, err)
			}
		})
	}
}

// TestLiteralAndSumAgreeOnExactness pins the shared predicate: a literal
// and a computed sum must refuse the SAME values, or a document could
// write a number one way and have it accepted, and the other way and
// have it refused.
func TestLiteralAndSumAgreeOnExactness(t *testing.T) {
	// 4503599627370496 + 4503599627370497 is 2^53+1 exactly — the sum
	// binary64 addition used to round to …992 in silence.
	sumErr := func(src string) error {
		_, err := New().Generate(src)
		return err
	}
	if err := sumErr("x:4503599627370496+4503599627370497"); err == nil {
		t.Fatalf("expected the inexact sum to be refused")
	}
	if err := sumErr("x:9007199254740993"); err == nil {
		t.Fatalf("expected the same value as a literal to be refused")
	}

	// And the predicate itself, at the boundary. Storable adds the int64
	// window to the exactness test; the literal rule asks only for
	// exactness, which is why 10^20 (outside int64) is still a value.
	pow53 := big.NewInt(9007199254740992)
	pow53Plus1 := new(big.Int).Add(pow53, big.NewInt(1))
	pow20, _ := new(big.Int).SetString("100000000000000000000", 10)
	pow124 := new(big.Int).Lsh(big.NewInt(1), 124)
	int64Max := big.NewInt(9223372036854775807)

	if !isExactInBinary64(pow53) || !isIntegerStorable(pow53) {
		t.Fatalf("2^53 must be exact and storable")
	}
	if isExactInBinary64(pow53Plus1) || isIntegerStorable(pow53Plus1) {
		t.Fatalf("2^53+1 must be neither exact nor storable")
	}
	if isExactInBinary64(int64Max) || isIntegerStorable(int64Max) {
		t.Fatalf("2^63-1 rounds up to 2^63, so it is not exact")
	}
	if !isExactInBinary64(pow20) {
		t.Fatalf("10^20 must be exact")
	}
	if isIntegerStorable(pow20) {
		t.Fatalf("10^20 is exact but outside the int64 window, so not storable")
	}
	if !isExactInBinary64(pow124) {
		t.Fatalf("2^124 is a power of two, so it must be exact")
	}
}

// TestIntegerGeneratesAsInt64AtEveryMagnitude is the Go half of issue
// #21, and it records a DELIBERATE cross-port asymmetry in the native
// type — the one place D9's generate contract cannot be identical in
// both ports, because the leaf's storage is not.
//
// Go's integer leaf IS an int64: exact across the whole window, at every
// magnitude, and encoding/json writes its digits. So there is nothing to
// do here and no threshold to place — an integer generates as an int64
// whether it is 1 or 2^60.
//
// TypeScript's integer leaf is a double, which above Number.MAX_SAFE_INTEGER
// stops rendering its own digits (JSON.stringify(2**60) is
// 1152921504606847000, a different integer). So the canonical port
// generates a `bigint` beyond that line to keep the value exact —
// see IntegerVal.gen and ts/test/exactjson.test.ts.
//
// The BYTES agree either way, which is what the shared gens rows pin
// (number-tower.tsv, gens-exact-int-*). Only the runtime type differs,
// and only in the port whose storage forced it.
func TestIntegerGeneratesAsInt64AtEveryMagnitude(t *testing.T) {
	cases := []struct {
		src  string
		want int64
		json string
	}{
		{"x:1", 1, `{"x":1}`},
		{"x:9007199254740991", 9007199254740991, `{"x":9007199254740991}`}, // 2^53-1
		{"x:9007199254740992", 9007199254740992, `{"x":9007199254740992}`}, // 2^53
		{"x:1152921504606846976", 1152921504606846976, `{"x":1152921504606846976}`},
		{"x:9223372036854774784", 9223372036854774784, `{"x":9223372036854774784}`},
		{"x:-1152921504606846976", -1152921504606846976, `{"x":-1152921504606846976}`},
		// D6's exact sum, the second route into the window above 2^53.
		{"x:576460752303423488+576460752303423488", 1152921504606846976,
			`{"x":1152921504606846976}`},
	}

	a := New()
	for _, c := range cases {
		t.Run(c.src, func(t *testing.T) {
			out, err := a.Generate(c.src)
			if err != nil {
				t.Fatalf("generate error: %v", err)
			}
			got := out.(map[string]any)["x"]
			n, ok := got.(int64)
			if !ok {
				t.Fatalf("integer generated as %T, want int64", got)
			}
			if n != c.want {
				t.Fatalf("value = %d, want %d", n, c.want)
			}
			b, err := json.Marshal(out)
			if err != nil {
				t.Fatalf("marshal: %v", err)
			}
			if string(b) != c.json {
				t.Fatalf("json = %s, want %s", b, c.json)
			}
		})
	}
}
