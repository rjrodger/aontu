/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// hints maps unification error codes to human-readable explanations.
// Since the #29 message-parity work the non-parameterised entries are
// VERBATIM copies of ts/src/hints.ts (worked examples included) --
// regenerate from there when the TS table changes, do not hand-edit.
// The exceptions, kept in the "Go-specific and parameterised" block at
// the end, are the entries whose TS text interpolates {placeholders}
// via strinject (Go has no details plumbing yet -- #29 phase 2) and
// decimal_syntax, which only Go raises.
var hints = map[string]string{
	"scalar_value":      "Literal scalar values of the same kind can only unify if they are\nexactly equal.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  a & a   -> a    # Does unify (equal Strings);\n  1 & 2   -> nil  # Does not unify (unequal Integers);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).",
	"scalar_kind":       "Literal scalar values of different kinds cannot unify.\n \nExamples:\n  1 & 1   -> 1    # Does unify (equal Integers);\n  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).",
	"nil_gen":           "The nil value was present after unification, and nil cannot be\ngenerated because nil is not a literal value.",
	"no_gen":            "This value was present after unification, and cannot be generated\nbecause it is not a literal value.",
	"mapval_required":   "This map value is required.",
	"mapval_no_gen":     "This value was present after unification, and cannot be generated\nbecause it is not a literal value.",
	"listval_required":  "This list element is required.",
	"listval_no_gen":    "This list element was present after unification, and cannot be generated\nbecause it is not a literal value.",
	"unknown_function":  "This function name is not recognized.",
	"literal_nil":       "A literal nil cannot unify with any other value.",
	"unify_cycle":       "Circular reference detected during unification.",
	"conjunct":          "This conjunction (& operator) could not be completed as some terms\ncould not be resolved.",
	"no_path":           "The path reference could not be found.\n \nExamples:\n  a:1 b:$.a  -> a:1,b:1  # $.a is a valid path reference as a is a key of root ($).\n  a:$.b      -> nil      # $.b is not a valid path reference as there is no key b in root ($).\n",
	"parse_bad_src":     "Invalid source provided for parsing. The source must be a non-empty string.",
	"unify_no_src":      "No source provided for unification. Cannot unify without source values.",
	"unify_no_res":      "Unification produced no result. The values could not be unified.",
	"unite":             "Failed to unite two values. The values are incompatible and cannot be unified.",
	"internal":          "Internal error during unification. This indicates an unexpected error in the unification process.",
	"decimal_budget":    "This exact decimal exceeds the exactness budget: at most 4096\ncoefficient digits and an absolute scale of at most 4096. The\nbudget applies to computed results as well as to literals.\nAontu never rounds, so a value beyond the budget is refused\nrather than approximated.\n \nExamples:\n  0d1e1000000000    -> nil  # Scale far beyond the budget;\n  0d1e4000+0d1e-4000 -> nil  # An exact sum too wide to hold;\n  0d1e-1            -> 0d0.1  # Well within it.",
	"scalar-type":       "Scalar kinds only unify when one contains the other. `number` is\nthe supertype of the numeric leaves (integer, float, biginteger,\nbigdecimal), so meeting it with a leaf gives that leaf; two distinct\nleaves describe disjoint sets of values and so have no common lower\nbound.\n \nExamples:\n  number & integer -> integer  # Does unify (integer is a number);\n  number & number  -> number   # Does unify (same kind);\n  float & integer  -> nil      # Does not unify (disjoint leaves).",
	"no_scalar_unify":   "Cannot unify scalar values. The scalar values have incompatible types.\n \nExamples:\n  number & 1    -> 1    # Does unify (1 is a number);\n  integer & 1   -> 1    # Does unify (1 is an integer);\n  float & 1     -> nil  # Does not unify (1 is an integer, not a float);\n  integer & 1.5 -> nil  # Does not unify (1.5 is a float, not an integer).",
	"not-scalar-type":   "Expected a scalar type but got a non-scalar type.",
	"map":               "Type mismatch: expected a map value but got a different type.",
	"list":              "Type mismatch: expected a list value but got a different type.",
	"arg":               "Missing required argument. A function requires an argument but none was provided.",
	"invalid-arg":       "Invalid argument provided. The argument does not match the expected type or format.",
	"key_level":         "The argument to key() is a LEVEL: how many steps up the path to look, where 0 is the key of the value itself and the default 1 is its parent. It must therefore be an integer -- `key(2)`, or `key(0d2)` for the exact leaf. A float, a decimal, a string, a boolean, a map or a list is not a level. A level beyond the top of the path is not an error; it yields the empty string.",
	"no_first_arg":      "Missing first argument. The function requires a first argument but none was provided.",
	"unknown_var":       "Unknown variable reference. The variable has not been defined.",
	"invalid_var_kind":  "Invalid variable kind. The variable type does not match the expected kind.",
	"path_cycle":        "Path cycle detected. The path contains a circular reference.",
	"ref":               "Reference resolution failed. Unable to resolve the reference to a value.",
	"closed":            "Cannot add to closed structure. The map or list is closed and does not accept new keys/elements.",
	"required_listelem": "Required list element is missing. A non-optional list element has no value.",
	"|:empty":           "Empty disjunction. The disjunction has no valid alternatives.",
	"|:empty-dist":      "Empty disjunction distribution. All alternatives in the disjunction are invalid.",
	"max_depth":         "Input nesting is too deep to process safely.",
	"func":              "Function operation failed. See the specific function name for details.",
	"make":              "Failed to create a new value. The make operation could not construct the value.",
	"resolve":           "Failed to resolve a value. The resolution process could not find or compute the value.",
	"operate":           "Operation failed. The operation could not be performed on the given values.",
	"op":                "Operator operation failed. See the specific operator name for details.",
	"close":             "Failed to close structure. The structure could not be closed.",
	"func:":             "Function error: ",
	"op:":               "Operator error: ",
	"var[":              "Variable type error: ",
	"ref[":              "Reference error: ",
	"op[":               "Operator value error: ",

	// -- Go-specific and parameterised entries (not yet verbatim TS) --

	"decimal_syntax": "This 0d literal is not a valid exact number.",
	// TS interpolates {src}; text kept local until details plumbing lands.
	"lossy_integer_literal": "This integer literal is not exactly representable as a " +
		"binary64 value, so storing it would silently round it to a different " +
		"number. Aontu never rounds a literal, so write it as `0d<digits>` \u2014 " +
		"the exact integer leaf holds it unchanged at any size.",
	// TS interpolates {left}/{right}.
	"exact_float_mix": "An exact value (biginteger, bigdecimal) and a binary float " +
		"cannot mix in arithmetic, in either operand order: a Big type never " +
		"silently becomes a binary float. Write both operands as exact `0d` " +
		"literals, or neither.",
	// TS interpolates {sum}.
	"inexact_integer_sum": "The exact sum of these integers is not exactly representable " +
		"as an integer: the integer leaf holds only int64-window values that a " +
		"binary64 carries exactly. Aontu never rounds a sum, so write the " +
		"operands as `0d<digits>` for an exact integer instead.",
	// TS interpolates {limit}/{paths}; the "evaluation budget" substring
	// is pinned per-port (TestBudgetPassesHint) until a shared row exists
	// (issue #26).
	"budget_passes": "The evaluation budget of fixpoint passes was spent before " +
		"the model converged. This is the evaluator giving up, not a " +
		"contradiction in the model: raising the budget helps only a model " +
		"that is still converging -- a genuine cycle never converges at any " +
		"budget.",
}

// codeClasses assigns every error code a CLASS: conflict | incomplete |
// reference | parse | budget | internal. The contract lives in
// test/spec/errcodes.tsv (mode `errcode`): the spec suite executes one
// row per code against this table and asserts SET EQUALITY between the
// file and these keys, in both implementations (ts/src/hints.ts mirrors
// this map exactly). Codes are append-only and never renamed; a class
// change is a breaking change. Class rulings (why decimal_budget and
// lossy_integer_literal are conflict, not budget; why unknown_function
// is reference) are documented in the tsv header.
var codeClasses = map[string]string{
	// parse -- the source text is malformed or unusable
	"parse":                 "parse",
	"syntax":                "parse",
	"parse_unknown":         "parse",
	"parse_bad_src":         "parse",
	"unify_no_src":          "parse",
	"incomplete_expression": "parse",
	"not_number":            "parse",
	"negative":              "parse",
	"decimal_syntax":        "parse",

	// conflict -- no common lower bound, or a value refused by a rule
	"scalar_value":          "conflict",
	"scalar_kind":           "conflict",
	"no_scalar_unify":       "conflict",
	"scalar-type":           "conflict",
	"not-scalar-type":       "conflict",
	"map":                   "conflict",
	"list":                  "conflict",
	"closed":                "conflict",
	"literal_nil":           "conflict",
	"nil_gen":               "conflict",
	"unite":                 "conflict",
	"|:empty":               "conflict",
	"|:empty-dist":          "conflict",
	"exact_float_mix":       "conflict",
	"inexact_integer_sum":   "conflict",
	"decimal_budget":        "conflict",
	"lossy_integer_literal": "conflict",
	"arg":                   "conflict",
	"invalid-arg":           "conflict",
	"no_first_arg":          "conflict",
	"key_level":             "conflict",
	"func":                  "conflict",
	"func:":                 "conflict",
	"op":                    "conflict",
	"op:":                   "conflict",
	"op[":                   "conflict",
	"make":                  "conflict",
	"resolve":               "conflict",
	"operate":               "conflict",
	"close":                 "conflict",

	// incomplete -- residue: the truth requires more than was supplied
	"no_gen":                  "incomplete",
	"conjunct":                "incomplete",
	"mapval_no_gen":           "incomplete",
	"mapval_required":         "incomplete",
	"mapval_spread_required":  "incomplete",
	"listval_no_gen":          "incomplete",
	"listval_required":        "incomplete",
	"listval_spread_required": "incomplete",
	"required_listelem":       "incomplete",

	// reference -- a name or path that does not resolve
	// (path_cycle is a PROVEN structural cycle -- a defect of the
	// model, not a spent evaluation bound: raising a budget never
	// fixes it, so it is class reference, not budget; G5's ruling.)
	"no_path":               "reference",
	"path_cycle":            "reference",
	"ref":                   "reference",
	"ref[":                  "reference",
	"var":                   "reference",
	"var[":                  "reference",
	"unknown_var":           "reference",
	"invalid_var_kind":      "reference",
	"unknown_function":      "reference",
	"multisource_not_found": "reference",

	// budget -- an evaluation bound was exceeded
	"unify_cycle":   "budget",
	"max_depth":     "budget",
	"budget_passes": "budget",

	// internal -- the engine reached a state it should not reach
	"internal":     "internal",
	"unify_no_res": "internal",
	"unknown_op":   "internal",
}

// codePrefixes are the dynamic-prefix families: the engine appends a
// name or value to these (e.g. `func:upper`, `op[+]`), so class lookup
// falls back to the registered prefix.
var codePrefixes = []string{"func:", "op:", "op[", "var[", "ref["}

// codeClass is the class of an error code: an exact registry entry,
// else the registered dynamic prefix it extends, else `internal` -- an
// unregistered code is an engine defect, not a user error. A why-less
// nil classifies as its eventual gen-time code, nil_gen (mirrors the
// NilVal.class getter in ts/src/val/NilVal.ts).
func codeClass(code string) string {
	if code == "" {
		code = "nil_gen"
	}
	if cls, ok := codeClasses[code]; ok {
		return cls
	}
	for _, prefix := range codePrefixes {
		if strings.HasPrefix(code, prefix) {
			return codeClasses[prefix]
		}
	}
	return "internal"
}
