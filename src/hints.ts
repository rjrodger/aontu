/* Copyright (c) 2025 Richard Rodger, MIT License */

/**
 * Error code hints for Aontu unification errors.
 *
 * Each key is an error code that can be passed to makeNilErr.
 * Each value is a human-readable explanation of what the error means.
 */

const hints: Record<string, string> = {

  scalar_value:
    'Literal scalar values of the same kind can only unify if they are\n' +
    'exactly equal.' +
    '\n \nExamples:\n' +
    '  1 & 1   -> 1    # Does unify (equal Integers);\n' +
    '  a & a   -> a    # Does unify (equal Strings);\n' +
    '  1 & 2   -> nil  # Does not unify (unequal Integers);\n' +
    '  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Number).',

  scalar_kind:
    'Literal scalar values of different kinds cannot unify.' +
    '\n \nExamples:\n' +
    '  1 & 1   -> 1    # Does unify (equal Integers);\n' +
    '  1 & a   -> nil  # Does not unify (Kinds: Integer & String);\n' +
    '  1 & 1.0 -> nil  # Does not unify (kinds: Integer & Number).',

  nil_gen:
    'The nil value was present after unification, and nil cannot be\n' +
    'generated because nil is not a literal value.',

  no_gen:
    'This value was present after unification, and cannot be generated\n' +
    'because it is not a literal value.',


  // TODO: extend errors to have details so we can name the key
  mapval_required: 'This map value is required.',

  mapval_no_gen:
    'This value was present after unification, and cannot be generated\n' +
    'because it is not a literal value.',

  listval_required: 'This list element is required.',

  listval_no_gen:
    'This list element was present after unification, and cannot be generated\n' +
    'because it is not a literal value.',

  unknown_function:
    'This function name is not recognized.',

  literal_nil:
    'A literal nil cannot unify with any other value.',


  // Parsing errors
  'parse_bad_src': 'Invalid source provided for parsing. The source must be a non-empty string.',

  // Unification errors
  'unify_no_src': 'No source provided for unification. Cannot unify without source values.',
  'unify_no_res': 'Unification produced no result. The values could not be unified.',
  'unite': 'Failed to unite two values. The values are incompatible and cannot be unified.',
  'cycle': 'Circular reference detected during unification. The unification process encountered a cycle.',
  'internal': 'Internal error during unification. This indicates an unexpected error in the unification process.',

  // Type mismatch errors

  'scalar-type': 'Scalar type mismatch. The scalar types are incompatible.',
  'no-scalar-unify': 'Cannot unify scalar values. The scalar values have incompatible types.',
  'not-scalar-type': 'Expected a scalar type but got a non-scalar type.',
  'map': 'Type mismatch: expected a map value but got a different type.',
  'list': 'Type mismatch: expected a list value but got a different type.',

  // Argument errors
  'arg': 'Missing required argument. A function requires an argument but none was provided.',
  'invalid-arg': 'Invalid argument provided. The argument does not match the expected type or format.',
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
}


export {
  hints,
}
