/* Copyright (c) 2025 Richard Rodger, MIT License */

/*
 * D9 -- THE EXACT JSON EMITTER.
 *
 * `generate()` returns NATIVE values, and once a document opts into the
 * exact leaves two of them are not things `JSON.stringify` can write: a
 * biginteger generates as a native `bigint`, and a bigdecimal generates
 * as a `Decimal`. `JSON.stringify` THROWS on a bigint ("Do not know how
 * to serialize a BigInt") and a `replacer` cannot rescue it, because a
 * replacer may only return another *value* -- everything it returns that
 * is not already a JSON primitive gets quoted, so the exact digits could
 * only come back as a JSON *string*, which is a different document.
 *
 * JSON itself was never the obstacle. A JSON number is arbitrary-
 * precision decimal TEXT: `{"x":9007199254740993}` is a perfectly legal
 * document that every conforming parser reads, and Go's `encoding/json`
 * already emits exactly that for a `*big.Int`. Only JavaScript's
 * serialiser stands in the way, so aontu ships its own.
 *
 * WHY THIS IS PUBLIC API and not a CLI internal: D9 promises that an
 * exact value reaches JSON as exact digits. A library consumer whose
 * document contains `0d9007199254740993` has no other supported way to
 * keep that promise -- hiding the only implementation behind the command
 * line would leave the contract unfulfillable from the library. The
 * `aontu` CLI consumes this same export (with `indent`), and so does the
 * shared suite's byte-exact `gens` mode, so there is exactly one set of
 * bytes to keep in step with the Go port.
 *
 * PARITY WITH GO. The output must match Go's
 * `json.Encoder` + `SetEscapeHTML(false)` (see specGens in
 * go/spec_test.go) byte for byte:
 *
 *   - Key order is the order `generate()` produced. Both ports already
 *     sort map keys (see the entries sort in BagVal.gen; Go's encoder
 *     sorts map keys), so neither has to sort again here.
 *   - Strings keep JavaScript's escaping, which is what the `gens` mode
 *     settled on when it turned Go's HTML escaping OFF so that `<`, `>`
 *     and `&` stay literal in both ports. U+2028/U+2029 are the one
 *     place JS and Go disagree by default -- Go escapes them, JS does
 *     not -- so they are escaped here too, which is both legal JSON and
 *     the safer output (it can be embedded in a JavaScript source).
 *   - Numbers keep JavaScript's `Number.prototype.toString` form, which
 *     is already what Go's encoder produces: fixed notation inside
 *     [1e-6, 1e21) and an unpadded, always-signed exponent outside it
 *     (`1e+21`, `1e-7`).
 *   - A bigint writes its digits; a Decimal writes its plain digit form
 *     (`1000.0`, `0.1`, `-1.5`) -- no `0d` marker, since that belongs to
 *     canon and is not JSON, but an integral bigdecimal keeps its `.0`
 *     so the JSON still shows a decimal. Go's `*Decimal.MarshalJSON`
 *     mirrors this.
 *
 * NOTE that byte-exact output CANNOT check the other half of D9: an
 * integral bigdecimal and a biginteger can serialise to different text,
 * but a biginteger and an ordinary integer serialise to the SAME text
 * while `generate()` returned the wrong runtime type. Canon pins the AST
 * kind, `gens` pins these bytes, and only the per-port API tests
 * (ts/test/exactjson.test.ts here) pin the returned object.
 */

import { Decimal } from './val/Decimal'
import { AontuError } from './err'


// JS leaves U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR)
// literal in a JSON string; Go's encoder escapes them. Byte parity wins.
const LSPS_RE = new RegExp('[\u2028\u2029]', 'g')


// JSON.stringify's `space` argument, normalised the way the spec does:
// a number is clamped to 0..10 spaces, a string is truncated to 10
// characters, anything else means "compact".
function indentUnit(indent: number | string | undefined): string {
  if ('number' === typeof indent) {
    const n = Math.min(10, Math.floor(indent))
    return 0 < n ? ' '.repeat(n) : ''
  }
  if ('string' === typeof indent) {
    return indent.slice(0, 10)
  }
  return ''
}


function quote(s: string): string {
  const out = JSON.stringify(s)
  // A raw separator can only appear as itself in the output (never
  // inside an escape), so a straight replace is safe.
  return out.replace(LSPS_RE, (c: string) =>
    '\u2028' === c ? '\\u2028' : '\\u2029')
}


// True for a value JSON.stringify omits from an object and writes as
// `null` inside an array. generate() never produces one, but a consumer
// splicing its own data into the result might.
function skipped(v: any): boolean {
  return undefined === v || 'function' === typeof v || 'symbol' === typeof v
}


// `seen` tracks the containers on the CURRENT path only (added on entry,
// removed on exit), so a shared subtree -- which unification can easily
// produce -- serialises fine and only a true cycle is refused, exactly
// as JSON.stringify does it.
function emit(v: any, unit: string, pad: string, seen: Set<any>): string {
  if (null === v) {
    return 'null'
  }

  const t = typeof v

  if ('string' === t) {
    return quote(v)
  }
  if ('number' === t) {
    // JSON has no NaN, no Infinity and no negative zero: JSON.stringify
    // writes `null` for the first two and `0` for the last, and gen()
    // has already normalised -0 away (R2).
    return JSON.stringify(v) as string
  }
  if ('bigint' === t) {
    // THE POINT OF THIS MODULE: exact digits, as a raw JSON number.
    return v.toString()
  }
  if ('boolean' === t) {
    return v ? 'true' : 'false'
  }
  if (skipped(v)) {
    return 'null'
  }

  // Before any other object handling: a Decimal is a value, not a
  // structure, and its plain digit form is the JSON number.
  if (v instanceof Decimal) {
    return v.toString()
  }

  if ('object' === t && 'function' === typeof v.toJSON) {
    return emit(v.toJSON(), unit, pad, seen)
  }

  if (seen.has(v)) {
    throw new AontuError('aontu: cannot convert circular structure to JSON')
  }
  seen.add(v)

  const inner = pad + unit
  const nl = '' === unit ? '' : '\n'
  let out: string

  if (Array.isArray(v)) {
    if (0 === v.length) {
      out = '[]'
    }
    else {
      const parts = v.map((e: any) =>
        inner + emit(skipped(e) ? null : e, unit, inner, seen))
      out = '[' + nl + parts.join(',' + nl) + nl + pad + ']'
    }
  }
  else {
    const colon = '' === unit ? ':' : ': '
    const parts: string[] = []
    // OWN enumerable keys, SORTED. A `for ... in` here would additionally
    // walk the prototype chain.
    //
    // WHY THE SORT IS HERE AND NOT IN gen(). BagVal.gen already sorts map
    // entries lexicographically -- and then writes them into a plain JS
    // object, where ECMAScript throws that sort away. OrdinaryOwnPropertyKeys
    // lists canonical ARRAY-INDEX keys first, in ascending NUMERIC order,
    // and only then the remaining string keys in insertion order. So
    // `{9:1,10:2}` came back out as 9 before 10, and `{"!":1,9:2}` put the
    // digit key ahead of the punctuation one.
    //
    // This is not a V8 quirk and not a JSON.stringify quirk; it is the
    // object's own key order, and it CANNOT be fixed upstream, because no
    // JavaScript object can hold "10" before "9". The emitter is the last
    // point that still has the freedom to choose, so it chooses here.
    //
    // The giveaway that it was never a design rule: only indices up to
    // 2^32-2 are hoisted, so `{4294967295:1,4294967296:2,5:3}` emitted as
    // 5, 4294967295, 4294967296 -- and TypeScript's own CANON, which builds
    // text from a sorted list rather than from an object, was lexicographic
    // all along. The port contradicted itself.
    //
    // Lexicographic by UTF-16 code unit, which is what `<` on JS strings
    // does and what MapVal.canon/BagVal.gen already sort by. Go sorts map
    // keys by UTF-8 byte, and the two orders agree on every key that stays
    // inside the BMP; astral-plane keys are a separate, tracked divergence.
    for (const k of Object.keys(v).sort()) {
      const cv = v[k]
      if (skipped(cv)) {
        continue
      }
      parts.push(inner + quote(k) + colon + emit(cv, unit, inner, seen))
    }
    out = 0 === parts.length ? '{}' :
      '{' + nl + parts.join(',' + nl) + nl + pad + '}'
  }

  seen.delete(v)

  return out
}


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
function exactJSON(value: any, indent?: number | string): string {
  return emit(value, indentUnit(indent), '', new Set())
}


export {
  exactJSON,
}
