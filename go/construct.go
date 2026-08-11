/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"math/big"
	"regexp"
	"sort"
)

// Public value constructors.
//
// These build Val values from Go code. Their primary use is supplying
// $name variables to UnifyVars / GenerateVars, e.g.:
//
//	vars := map[string]aontu.Val{
//		"port": aontu.NewInteger(8080),
//		"host": aontu.NewString("localhost"),
//		"obj":  aontu.NewMap(map[string]aontu.Val{"x": aontu.NewInteger(1)}),
//	}
//	out, err := aontu.New().GenerateVars("server: { host: $host, port: $port }", vars)
//
// They are thin wrappers over the package-internal constructors so the
// public surface stays small and the internals can keep mirroring the
// canonical TypeScript implementation.

// NewString returns a string scalar value.
func NewString(s string) Val { return newString(s) }

// NewInteger returns an integer scalar value.
//
// D8 — PROGRAMMATIC CONSTRUCTION OBEYS THE SAME STORAGE CONTRACT AS A
// LITERAL. An int64 that a binary64 cannot carry exactly (9007199254740993,
// 2^63-1, …) is REFUSED rather than stored, exactly as the equivalent
// literal is refused by D7. Without this the API is a hole straight
// through the tower's storage rule: Go's integer leaf is an int64 and the
// canonical TypeScript port's is a double, so `NewInteger(9007199254740993)`
// would be exact here and silently `…992` there — a parity divergence no
// parse-time rule can see, because no literal can express it.
//
// THE RULE IS EXACTNESS, NOT MAGNITUDE. Every power of two in the window
// is fine however large, math.MinInt64 (-2^63) among them; what fails is
// an int64 that would have to CHANGE to be stored.
//
// A refusal is a nil VALUE, not a panic and not a second return: aontu
// errors are values, so the refusal flows through unification and
// surfaces at Generate with the same "not exactly representable" hint the
// literal gets. That also keeps the signature — this is a narrowing of
// what the function accepts, not a change to how it is called.
//
// Use NewBigInteger for an exact integer of any size.
func NewInteger(i int64) Val {
	if !isExactInBinary64(big.NewInt(i)) {
		return newNil("lossy_integer_literal")
	}
	return newInteger(i)
}

// NewNumber returns a scalar value of the `float` kind — the IEEE-754
// binary64 leaf of the number lattice. (The name is kept for API
// compatibility; the kind it builds is KindFloat, not the KindNumber
// supertype, which no concrete value carries.)
func NewNumber(f float64) Val { return newFloat(f) }

// NewBigInteger returns a biginteger scalar value — the tower's
// unbounded exact integer leaf, the same leaf a `0d123` literal builds.
//
// The argument is COPIED, and the copy is never mutated afterwards, so a
// caller may keep using (and mutating) the big.Int it passed in. A nil
// argument is zero. This is the exact-input construction contract of D8:
// exact values above 2^53 enter through this constructor or through a
// `0d` literal, never by rounding an inexact one.
func NewBigInteger(n *big.Int) Val {
	c := new(big.Int)
	if n != nil {
		c.Set(n)
	}
	return newBigInteger(c)
}

// bigDecimalTextRe is the API's accepted input, mirroring
// Decimal.fromString in ts/src/val/Decimal.ts: an optional sign, an
// optional `0d` marker, digits, an optional fraction and an optional
// exponent — and NO `_` separators, which are literal syntax rather than
// part of a number's text.
var bigDecimalTextRe = regexp.MustCompile(
	`^([-+]?)(?:0[dD])?([0-9]+)(?:\.([0-9]+))?(?:[eE]([-+]?[0-9]+))?$`)

// NewBigDecimal returns a bigdecimal scalar value — the tower's exact
// base-10 decimal leaf — from an exact decimal STRING: an optional sign,
// an optional `0d` marker, digits, an optional fraction and an optional
// exponent ("1.5", "-0.10", "0d1e3", "5"). The value is normalised
// exactly as a literal is (D4), so NewBigDecimal("0.10") and
// NewBigDecimal("1e-1") are the same value, and an integral one keeps
// its single decimal place — NewBigDecimal("5") canons as `0d5.0`, a
// bigdecimal, because here the CONSTRUCTOR picks the leaf where a
// literal's source text would.
//
// A string is the argument type on purpose: a Go float64 has already
// rounded before the library can inspect it, so accepting one would
// smuggle an inexact value into an exact leaf (D8).
//
// It returns an error for a malformed string, and for one outside the
// exactness budget (D6: at most 4096 coefficient digits and an absolute
// scale of at most 4096) — the same refusal a literal gets, since
// programmatic construction obeys the same contract.
func NewBigDecimal(s string) (Val, error) {
	m := bigDecimalTextRe.FindStringSubmatch(s)
	if m == nil {
		return nil, &AontuError{Msg: "Not an exact decimal: " + s}
	}
	d, why := exactDecimal(m[1] == "-", m[2], m[3], m[4])
	if why != "" {
		return nil, &AontuError{Msg: "Not an exact decimal: " + s + "\n" + hints[why]}
	}
	return newBigDecimal(d), nil
}

// NewBoolean returns a boolean scalar value.
func NewBoolean(b bool) Val { return newBoolean(b) }

// NewNull returns a null scalar value.
func NewNull() Val { return newNull() }

// NewScalarKind returns a scalar-kind (type constraint) value — the
// equivalent of bare `string`, `number`, `integer`, `float`,
// `biginteger`, `bigdecimal` or `boolean` in source. Use the exported
// Kind constants: KindString, KindBoolean, KindNull, and the numeric
// lattice KindNumber (the supertype, admitting any numeric leaf) with
// its leaves KindInteger, KindFloat, KindBigInteger and KindBigDecimal.
func NewScalarKind(k Kind) Val { return newScalarKind(k) }

// NewMap returns a map value built from fields. Keys are inserted in
// sorted order so canonical output is deterministic (Go map iteration
// order is otherwise unspecified). A nil or empty map yields an empty
// map value.
func NewMap(fields map[string]Val) Val {
	m := newMap()
	keys := make([]string, 0, len(fields))
	for k := range fields {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		m.set(k, fields[k])
	}
	return m
}

// NewList returns a list value from the given elements.
func NewList(elems []Val) Val { return newList(elems) }
