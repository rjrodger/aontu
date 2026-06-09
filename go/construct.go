/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "sort"

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
func NewInteger(i int64) Val { return newInteger(i) }

// NewNumber returns a floating-point number scalar value.
func NewNumber(f float64) Val { return newNumber(f) }

// NewBoolean returns a boolean scalar value.
func NewBoolean(b bool) Val { return newBoolean(b) }

// NewNull returns a null scalar value.
func NewNull() Val { return newNull() }

// NewScalarKind returns a scalar-kind (type constraint) value — the
// equivalent of bare `string`, `number`, `integer` or `boolean` in
// source. Use the exported Kind constants (KindString, KindNumber,
// KindInteger, KindBoolean).
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
