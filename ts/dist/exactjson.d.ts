/**
 * Serialise a value produced by `Aontu.generate()` as JSON text,
 * preserving EXACT numbers.
 *
 * Use this instead of `JSON.stringify` on generated output. A document
 * that uses the `0d` exact leaves generates native `bigint` and
 * `Decimal` values; `JSON.stringify` throws on the first and mangles the
 * second, while this emitter writes both as raw JSON numbers with their
 * exact digits -- which is what the D9 generate contract promises, and
 * what the Go port's marshallers produce for the same document.
 *
 * ```ts
 * import { Aontu, exactJSON } from 'aontu'
 *
 * const out = new Aontu().generate('x:0d9007199254740993')
 * typeof out.x           // 'bigint'
 * exactJSON(out)         // '{"x":9007199254740993}'
 * exactJSON(out, 2)      // '{\n  "x": 9007199254740993\n}'
 * JSON.stringify(out)    // TypeError: Do not know how to serialize a BigInt
 * ```
 *
 * @param value   The value to serialise -- normally `generate()` output:
 *                `null`, booleans, numbers, strings, `bigint`,
 *                `Decimal`, arrays and plain objects. An object with a
 *                `toJSON` method is asked for its replacement first
 *                (`Decimal` is handled as a number before that check).
 * @param indent  Optional indentation, with `JSON.stringify`'s `space`
 *                semantics: a number of spaces (clamped to 0..10) or a
 *                literal string. Omitted or `0` gives COMPACT output
 *                (no spaces, no newlines) -- the form the shared spec
 *                suite's `gens` mode compares byte for byte.
 * @returns       The JSON text. Unlike `JSON.stringify` this always
 *                returns a string: a top-level `undefined` is `null`.
 * @throws        {AontuError} if the value contains a reference cycle.
 */
declare function exactJSON(value: any, indent?: number | string): string;
export { exactJSON, };
