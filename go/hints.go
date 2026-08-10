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
		"the supertype of the numeric leaves (integer, float), so meeting it " +
		"with a leaf gives that leaf; two distinct leaves describe disjoint " +
		"sets of values and so have no common lower bound.",
	"no_path":          "The path reference could not be found.",
	"path_cycle":       "Path cycle detected. The path contains a circular reference.",
	"closed":           "Cannot add to closed structure. The map or list is closed and does not accept new keys/elements.",
	"map":              "Type mismatch: expected a map value but got a different type.",
	"list":             "Type mismatch: expected a list value but got a different type.",
	"unify_cycle":      "Circular reference detected during unification.",
	"unknown_function": "This function name is not recognized.",
	"max_depth":        "Input nesting is too deep to process safely.",
}
