"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeClasses = exports.hints = void 0;
exports.codeClass = codeClass;
/**
 * Error code hints for Aontu unification errors.
 *
 * Each key is an error code that can be passed to makeNilErr.
 * Each value is a human-readable explanation of what the error means.
 */
const hints = {
    scalar_value: 'Literal scalar values of the same kind can only unify if they are\n' +
        'exactly equal.' +
        '\n \nExamples:\n' +
        '  1 & 1   -> 1    # Does unify (equal Integers);\n' +
        '  a & a   -> a    # Does unify (equal Strings);\n' +
        '  1 & 2   -> nil  # Does not unify (unequal Integers);\n' +
        '  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).',
    scalar_kind: 'Literal scalar values of different kinds cannot unify.' +
        '\n \nExamples:\n' +
        '  1 & 1   -> 1    # Does unify (equal Integers);\n' +
        '  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n' +
        '  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Float).',
    nil_gen: 'The nil value was present after unification, and nil cannot be\n' +
        'generated because nil is not a literal value.',
    no_gen: 'This value was present after unification, and cannot be generated\n' +
        'because it is not a literal value.',
    // TODO: extend errors to have details so we can name the key
    mapval_required: 'This map value is required.',
    mapval_no_gen: 'This value was present after unification, and cannot be generated\n' +
        'because it is not a literal value.',
    mapval_spread_required: 'The value for key {key} is required (defined in spread).',
    listval_required: 'This list element is required.',
    listval_no_gen: 'This list element was present after unification, and cannot be generated\n' +
        'because it is not a literal value.',
    listval_spread_required: 'The value for key {key} is required (defined in spread).',
    unknown_function: 'This function name is not recognized.',
    literal_nil: 'A literal nil cannot unify with any other value.',
    unify_cycle: 'Circular reference detected during unification.',
    constraint: 'This value does not satisfy the constraint. A constraint is the\n' +
        'meet of bound atoms (min, max, above, below) and exclusions (neq)\n' +
        'over one domain; the expected form shown is the normalised\n' +
        'residual the value must satisfy.' +
        '\n \nExamples:\n' +
        '  min(0) & 3                    -> 3    # Admitted (3 >= 0);\n' +
        '  min(0) & 0d5                  -> 0d5  # Bounds are leaf-agnostic;\n' +
        '  max(65535) & 99999            -> nil  # Above the bound;\n' +
        '  min(5) & max(3)               -> nil  # Empty at composition time;\n' +
        '  integer & above(1) & below(2) -> nil  # No integer in the gap;\n' +
        '  neq(1) & 1.0                  -> 1.0  # neq excludes leaf AND value.',
    budget_passes: 'The evaluation budget of {limit} fixpoint passes was spent before\n' +
        'the model converged; still refining: {paths}.\n' +
        'This is the evaluator giving up, not a contradiction in the model:\n' +
        'raising the budget helps only a model that is still converging --\n' +
        'a genuine cycle never converges at any budget.',
    conjunct: 'This conjunction (& operator) could not be completed as some terms\n' +
        'could not be resolved.',
    no_path: 'The path reference could not be found.' +
        '\n \nExamples:\n' +
        '  a:1 b:$.a  -> a:1,b:1  # $.a is a valid path reference as a is a key of root ($).\n' +
        '  a:$.b      -> nil      # $.b is not a valid path reference as there is no key b in root ($).\n',
    // Parsing errors
    'parse_bad_src': 'Invalid source provided for parsing. The source must be a non-empty string.',
    // Unification errors
    'unify_no_src': 'No source provided for unification. Cannot unify without source values.',
    'unify_no_res': 'Unification produced no result. The values could not be unified.',
    'unite': 'Failed to unite two values. The values are incompatible and cannot be unified.',
    'internal': 'Internal error during unification. This indicates an unexpected error in the unification process.',
    // Type mismatch errors
    decimal_budget: 'This exact decimal exceeds the exactness budget: at most 4096\n' +
        'coefficient digits and an absolute scale of at most 4096. The\n' +
        'budget applies to computed results as well as to literals.\n' +
        'Aontu never rounds, so a value beyond the budget is refused\n' +
        'rather than approximated.' +
        '\n \nExamples:\n' +
        '  0d1e1000000000    -> nil  # Scale far beyond the budget;\n' +
        '  0d1e4000+0d1e-4000 -> nil  # An exact sum too wide to hold;\n' +
        '  0d1e-1            -> 0d0.1  # Well within it.',
    lossy_integer_literal: 'This integer literal, {src}, is not exactly representable in\n' +
        'binary64, so storing it would silently round it to a DIFFERENT\n' +
        'number. Aontu refuses rather than corrupts: write it as a `0d`\n' +
        'literal to get the exact integer.\n' +
        'The rule is exactness, not magnitude -- a literal far outside the\n' +
        'int64 window is still a value when it lands exactly on a binary64.' +
        '\n \nExamples:\n' +
        '  9007199254740992   -> 9007199254740992    # 2^53, exact;\n' +
        '  9007199254740993   -> nil                 # 2^53+1 is not;\n' +
        '  0d9007199254740993 -> 0d9007199254740993  # ... the exact escape;\n' +
        '  0x7fffffffffffffff -> nil    # 2^63-1 rounds up to 2^63;\n' +
        '  100000000000000000000 -> 1e20 # 10^20 is huge and exact.',
    exact_float_mix: 'Aontu cannot mix an exact number with a binary float.\n' +
        'Here the operands are {left} and {right}, in that order.\n' +
        'A big type never silently becomes a binary float, in either\n' +
        'operand order -- binary64 cannot hold every exact value, so the\n' +
        'promotion would throw away the exactness the `0d` leaves exist to\n' +
        'guarantee. Write both operands in the same family (`0d1.0` for the\n' +
        'float, or a plain integer for the big).' +
        '\n \nExamples:\n' +
        '  0d2 + 0d0.5 -> 0d2.5  # Exact with exact (widest leaf wins);\n' +
        '  1 + 0d0.5   -> 0d1.5  # integer is on the exact ladder;\n' +
        '  1 + 2.0     -> 3.0    # ... and float still mixes with integer;\n' +
        '  1.0 + 0d2   -> nil    # float with biginteger;\n' +
        '  0d0.5 + 1.0 -> nil    # ... and the same the other way round.',
    inexact_integer_sum: 'The `integer` leaf holds a value only when it is integral, within\n' +
        'the int64 range, and exactly representable in binary64. This sum\n' +
        'is not: {sum}.\n' +
        'Aontu adds integers exactly and refuses to store a rounded answer\n' +
        '-- write `0d<digits>` for an exact integer beyond that window.' +
        '\n \nExamples:\n' +
        '  4503599627370496 + 4503599627370496 -> 9007199254740992  # Exact;\n' +
        '  4503599627370496 + 4503599627370497 -> nil    # 2^53+1 is not;\n' +
        '  0d4503599627370496 + 0d4503599627370497 -> 0d9007199254740993.',
    'scalar-type': 'Scalar kinds only unify when one contains the other. `number` is\n' +
        'the supertype of the numeric leaves (integer, float, biginteger,\n' +
        'bigdecimal), so meeting it with a leaf gives that leaf; two distinct\n' +
        'leaves describe disjoint sets of values and so have no common lower\n' +
        'bound.' +
        '\n \nExamples:\n' +
        '  number & integer -> integer  # Does unify (integer is a number);\n' +
        '  number & number  -> number   # Does unify (same kind);\n' +
        '  float & integer  -> nil      # Does not unify (disjoint leaves).',
    'no_scalar_unify': 'Cannot unify scalar values. The scalar values have incompatible types.' +
        '\n \nExamples:\n' +
        '  number & 1    -> 1    # Does unify (1 is a number);\n' +
        '  integer & 1   -> 1    # Does unify (1 is an integer);\n' +
        '  float & 1     -> nil  # Does not unify (1 is an integer, not a float);\n' +
        '  integer & 1.5 -> nil  # Does not unify (1.5 is a float, not an integer).',
    'not-scalar-type': 'Expected a scalar type but got a non-scalar type.',
    'map': 'Type mismatch: expected a map value but got a different type.',
    'list': 'Type mismatch: expected a list value but got a different type.',
    // Argument errors
    'arg': 'Missing required argument. A function requires an argument but none was provided.',
    'invalid-arg': 'Invalid argument provided. The argument does not match the expected type or format.',
    'key_level': 'The argument to key() is a LEVEL: how many steps up the path to look, where 0 is the key of the value itself and the default 1 is its parent. It must therefore be an integer -- `key(2)`, or `key(0d2)` for the exact leaf. A float, a decimal, a string, a boolean, a map or a list is not a level. A level beyond the top of the path is not an error; it yields the empty string.',
    'no_first_arg': 'Missing first argument. The function requires a first argument but none was provided.',
    // Variable errors
    'unknown_var': 'Unknown variable reference. The variable has not been defined.',
    'invalid_var_kind': 'Invalid variable kind. The variable type does not match the expected kind.',
    // Path and reference errors
    path_cycle: 'Path cycle detected. The path contains a circular reference.',
    'ref': 'Reference resolution failed. Unable to resolve the reference to a value.',
    // Closure and state errors
    'closed': 'Cannot add to closed structure. The map or list is closed and does not accept new keys/elements.',
    'required_listelem': 'Required list element is missing. A non-optional list element has no value.',
    // Junction errors (disjunction/conjection)
    '|:empty': 'Empty disjunction. The disjunction has no valid alternatives.',
    '|:empty-dist': 'Empty disjunction distribution. All alternatives in the disjunction are invalid.',
    'max_depth': 'Input nesting is too deep to process safely.',
    // Function errors (dynamic patterns)
    'func': 'Function operation failed. See the specific function name for details.',
    'make': 'Failed to create a new value. The make operation could not construct the value.',
    'resolve': 'Failed to resolve a value. The resolution process could not find or compute the value.',
    'operate': 'Operation failed. The operation could not be performed on the given values.',
    // Operator errors (dynamic patterns)
    'op': 'Operator operation failed. See the specific operator name for details.',
    // Close operation
    'close': 'Failed to close structure. The structure could not be closed.',
    // Dynamic patterns (these serve as prefixes)
    'func:': 'Function error: ',
    'op:': 'Operator error: ',
    'var[': 'Variable type error: ',
    'ref[': 'Reference error: ',
    'op[': 'Operator value error: ',
};
exports.hints = hints;
// codeClasses assigns every error code a CLASS: conflict | incomplete |
// reference | parse | budget | internal. The contract lives in
// test/spec/errcodes.tsv (mode `errcode`): the spec suite executes one
// row per code against this table and asserts SET EQUALITY between the
// file and these keys, in both implementations (go/hints.go mirrors
// this map exactly). Codes are append-only and never renamed; a class
// change is a breaking change. Class rulings (why decimal_budget and
// lossy_integer_literal are conflict, not budget; why unknown_function
// is reference) are documented in the tsv header.
const codeClasses = {
    // parse -- the source text is malformed or unusable
    parse: 'parse',
    syntax: 'parse',
    parse_unknown: 'parse',
    parse_bad_src: 'parse',
    unify_no_src: 'parse',
    incomplete_expression: 'parse',
    not_number: 'parse',
    negative: 'parse',
    decimal_syntax: 'parse',
    // conflict -- no common lower bound, or a value refused by a rule
    // (constraint covers the whole algebra family: membership failure,
    // empty meets at composition time, and domain/kind mixing.)
    constraint: 'conflict',
    scalar_value: 'conflict',
    scalar_kind: 'conflict',
    no_scalar_unify: 'conflict',
    'scalar-type': 'conflict',
    'not-scalar-type': 'conflict',
    map: 'conflict',
    list: 'conflict',
    closed: 'conflict',
    literal_nil: 'conflict',
    nil_gen: 'conflict',
    unite: 'conflict',
    '|:empty': 'conflict',
    '|:empty-dist': 'conflict',
    exact_float_mix: 'conflict',
    inexact_integer_sum: 'conflict',
    decimal_budget: 'conflict',
    lossy_integer_literal: 'conflict',
    arg: 'conflict',
    'invalid-arg': 'conflict',
    no_first_arg: 'conflict',
    key_level: 'conflict',
    func: 'conflict',
    'func:': 'conflict',
    op: 'conflict',
    'op:': 'conflict',
    'op[': 'conflict',
    make: 'conflict',
    resolve: 'conflict',
    operate: 'conflict',
    close: 'conflict',
    // incomplete -- residue: the truth requires more than was supplied
    no_gen: 'incomplete',
    conjunct: 'incomplete',
    mapval_no_gen: 'incomplete',
    mapval_required: 'incomplete',
    mapval_spread_required: 'incomplete',
    listval_no_gen: 'incomplete',
    listval_required: 'incomplete',
    listval_spread_required: 'incomplete',
    required_listelem: 'incomplete',
    // reference -- a name or path that does not resolve
    no_path: 'reference',
    // A PROVEN structural cycle is a defect of the model, not a spent
    // evaluation bound: raising a budget never fixes it (G5's ruling --
    // class budget means "retry with more may help", path_cycle means
    // "fix the model").
    path_cycle: 'reference',
    ref: 'reference',
    'ref[': 'reference',
    var: 'reference',
    'var[': 'reference',
    unknown_var: 'reference',
    invalid_var_kind: 'reference',
    unknown_function: 'reference',
    multisource_not_found: 'reference',
    // budget -- an evaluation bound was exceeded
    unify_cycle: 'budget',
    max_depth: 'budget',
    budget_passes: 'budget',
    // internal -- the engine reached a state it should not reach
    internal: 'internal',
    unify_no_res: 'internal',
    unknown_op: 'internal',
};
exports.codeClasses = codeClasses;
// Dynamic-prefix families: the engine appends a name or value to these
// (e.g. `func:upper`, `op:+`, `var[string]`, `ref[$.x]`, `op[+]`), so
// class lookup falls back to the registered prefix.
const CODE_PREFIXES = ['func:', 'op:', 'op[', 'var[', 'ref['];
// The class of an error code: an exact registry entry, else the
// registered dynamic prefix it extends, else `internal` -- an
// unregistered code is an engine defect, not a user error.
function codeClass(code) {
    const cls = codeClasses[code];
    if (null != cls) {
        return cls;
    }
    for (const prefix of CODE_PREFIXES) {
        if (code.startsWith(prefix)) {
            return codeClasses[prefix];
        }
    }
    return 'internal';
}
//# sourceMappingURL=hints.js.map