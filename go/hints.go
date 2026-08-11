/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// hints maps unification error codes to human-readable explanations,
// mirroring ts/src/hints.ts (which additionally carries worked examples;
// this port keeps the summary sentences). The hint is appended to the
// error message so callers (and the shared spec) can match on it.
var hints = map[string]string{
	"scalar_value":    "Literal scalar values of the same kind can only unify if they are exactly equal.",
	"scalar_kind":     "Literal scalar values of different kinds cannot unify.",
	"no_scalar_unify": "Cannot unify scalar values. The scalar values have incompatible types.",
	// The numeric kinds are a lattice (docs/design/number-tower.md): a
	// supertype meets a kind below it to give that lower kind, and two
	// distinct leaves are disjoint.
	"scalar-type": "Scalar kinds only unify when one contains the other. `number` is " +
		"the supertype of the numeric leaves (integer, float, biginteger, " +
		"bigdecimal), so meeting it with a leaf gives that leaf; two distinct " +
		"leaves describe disjoint sets of values and so have no common lower " +
		"bound.",
	// D6's exactness budget, applied to literals and to computed results
	// alike. The exact leaves never round and never silently expand, so
	// a value outside the budget is refused.
	"decimal_budget": "This exact decimal exceeds the exactness budget: at most " +
		"4096 coefficient digits and an absolute scale of at most 4096. " +
		"Aontu never rounds, so a literal or result beyond the budget is " +
		"refused rather than approximated.",
	"decimal_syntax": "This 0d literal is not a valid exact number.",
	// D6's arithmetic. `float` is off the exact ladder
	// (integer < biginteger < bigdecimal): an exact leaf and the binary64
	// leaf have no common exact value, so `+` refuses the pair in BOTH
	// operand orders rather than promoting one of them.
	"exact_float_mix": "An exact value (biginteger, bigdecimal) and a binary float " +
		"cannot mix in arithmetic, in either operand order: a Big type never " +
		"silently becomes a binary float. Write both operands as exact `0d` " +
		"literals, or neither.",
	// D6's exact integer sums. The addition itself is exact; what fails
	// is holding the answer in the integer leaf.
	"inexact_integer_sum": "The exact sum of these integers is not exactly representable " +
		"as an integer: the integer leaf holds only int64-window values that a " +
		"binary64 carries exactly. Aontu never rounds a sum, so write the " +
		"operands as `0d<digits>` for an exact integer instead.",
	// D7's lossy literals. The rule is EXACTNESS, not magnitude: a huge
	// literal that lands exactly on a binary64 value (2^124, 10^20, 1e21)
	// is still a value; what is refused is a literal that would have to
	// CHANGE to be stored (2^53+1, 2^63-1, 2^64-1).
	"lossy_integer_literal": "This integer literal is not exactly representable as a " +
		"binary64 value, so storing it would silently round it to a different " +
		"number. Aontu never rounds a literal, so write it as `0d<digits>` — " +
		"the exact integer leaf holds it unchanged at any size.",
	"key_level":        "The argument to key() is a LEVEL: how many steps up the path to look, where 0 is the key of the value itself and the default 1 is its parent. It must therefore be an integer -- `key(2)`, or `key(0d2)` for the exact leaf. A float, a decimal, a string, a boolean, a map or a list is not a level. A level beyond the top of the path is not an error; it yields the empty string.",
	"invalid-arg":      "Invalid argument provided. The argument does not match the expected type or format.",
	"arg":              "Missing required argument. A function requires an argument but none was provided.",
	"no_path":          "The path reference could not be found.",
	"path_cycle":       "Path cycle detected. The path contains a circular reference.",
	"closed":           "Cannot add to closed structure. The map or list is closed and does not accept new keys/elements.",
	"map":              "Type mismatch: expected a map value but got a different type.",
	"list":             "Type mismatch: expected a list value but got a different type.",
	"unify_cycle":      "Circular reference detected during unification.",
	"unknown_function": "This function name is not recognized.",
	"max_depth":        "Input nesting is too deep to process safely.",
}
