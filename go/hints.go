/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// hints maps unification error codes to human-readable explanations,
// mirroring ts/src/hints.ts. The hint is appended to the error message
// so callers (and the shared spec) can match on it.
var hints = map[string]string{
	"scalar_value":     "Literal scalar values of the same kind can only unify if they are exactly equal.",
	"scalar_kind":      "Literal scalar values of different kinds cannot unify.",
	"no_scalar_unify":  "Cannot unify scalar values. The scalar values have incompatible types.",
	"scalar-type":      "Scalar type mismatch. The scalar types are incompatible.",
	"no_path":          "The path reference could not be found.",
	"path_cycle":       "Path cycle detected. The path contains a circular reference.",
	"closed":           "Cannot add to closed structure. The map or list is closed and does not accept new keys/elements.",
	"map":              "Type mismatch: expected a map value but got a different type.",
	"list":             "Type mismatch: expected a list value but got a different type.",
	"unify_cycle":      "Circular reference detected during unification.",
	"unknown_function": "This function name is not recognized.",
	"max_depth":        "Input nesting is too deep to process safely.",
}
