/* Copyright (c) 2026 Richard Rodger, MIT License */

// `translate` -- PER-CHARACTER SUBSTITUTION AND DELETION (SPIKE,
// docs/design/JOSTRACA.0.md), after the `tr` command.
//
//   translate(s, from, to)   each character of `from` becomes the one
//                            at the same position in `to`
//   translate(s, from)       each character of `from` is deleted
//
// WHY IT IS NOT `rep`. `rep(s, pattern, sub)` matches a REGION and
// substitutes text for it, so a per-character map is N calls over N
// passes, each seeing the previous one's output -- and that composition
// is wrong, not merely slow: `rep(rep(x, "a", "b"), "b", "a")` maps
// every original `a` to `a` again. `translate` reads the source once
// and consults a table, so `translate(x, "ab", "ba")` SWAPS them, which
// is the operation `tr` exists for and the one a generator wants when
// it rewrites a delimiter set or strips a character class.
//
// RANGES, as `tr` has them: `a-z` is every code point from `a` to `z`
// inclusive, in both sets. A `-` first or last in a set is itself,
// which is the only way to mean a literal one -- the sets take no
// escape, because an aontu string literal has already processed its
// own and a second escape layer over the first is a trap rather than a
// feature. A descending range (`z-a`) is refused rather than read as
// empty: it is always a mistake, and answering nothing for it hides it.
//
// A SHORT `to` PADS WITH ITS LAST CHARACTER, which is `tr`'s rule:
// `translate(s, "abc", "x")` maps all three to `x`. An EMPTY or absent
// `to` deletes instead, which is `tr -d`. Those are the same rule read
// two ways -- there is no last character to pad with -- so the second
// argument alone is deletion and needs no flag.
//
// A CHARACTER NAMED TWICE IN `from` TAKES ITS LAST MAPPING, because the
// table is built left to right and a later entry overwrites an earlier.
// `tr` does the same.
//
// CODE POINTS, NOT UTF-16 UNITS: one entry is one code point, so an
// astral character maps as a unit and cannot be half-matched.
//
// NOT DONE, and deliberately: `tr`'s `-s` (squeeze repeats), `-c`
// (complement) and its character classes (`[:alpha:]`). Each is a
// second vocabulary on top of the sets, and none is needed by anything
// the spike found. `re()` already spells a class for `rep`.
//
// SPIKE SCOPE. TypeScript only, so -- as with `nom` and the component
// primitives -- deliberately absent from test/spec/signature.tsv,
// BUILTIN_FUNCS and grammar/, all pinned in cross-port parity. Arity
// and argument shape are refused here, and every refusal is
// `invalid-arg`.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { StringVal } from './StringVal'
import { FuncBaseVal } from './FuncBaseVal'


// A set with its ranges expanded, or undefined when a range descends.
// `-` first or last is a literal.
function expandSet(set: string): string[] | undefined {
  const cps = Array.from(set)
  const out: string[] = []

  for (let i = 0; i < cps.length; i++) {
    const c = cps[i]
    const next = cps[i + 1]
    const after = cps[i + 2]

    if ('-' === next && undefined !== after && 0 < i + 2) {
      const lo = c.codePointAt(0) as number
      const hi = after.codePointAt(0) as number
      if (hi < lo) {
        return undefined
      }
      for (let cp = lo; cp <= hi; cp++) {
        out.push(String.fromCodePoint(cp))
      }
      i += 2
      continue
    }

    out.push(c)
  }

  return out
}


// The text a value carries, when it is a concrete string.
function textOf(v: Val | undefined): string | undefined {
  const s: any = v
  return (true === s?.isScalar && 'string' === typeof s.peg) ? s.peg : undefined
}


class TranslateFuncVal extends FuncBaseVal {
  isTranslateFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new TranslateFuncVal(spec)
  }

  funcname() {
    return 'translate'
  }


  resolve(ctx: AontuContext, args: Val[]): Val {
    if (args.length < 2 || 3 < args.length) {
      return makeNilErr(ctx, 'invalid-arg', this, undefined, 'arity')
    }

    const src = textOf(args[0])
    if (undefined === src) {
      return makeNilErr(ctx, 'invalid-arg', this, args[0], 'src')
    }

    const fromText = textOf(args[1])
    if (undefined === fromText) {
      return makeNilErr(ctx, 'invalid-arg', this, args[1], 'from')
    }
    const from = expandSet(fromText)
    if (undefined === from) {
      return makeNilErr(ctx, 'invalid-arg', this, args[1], 'from')
    }

    let to: string[] = []
    if (3 === args.length) {
      const toText = textOf(args[2])
      if (undefined === toText) {
        return makeNilErr(ctx, 'invalid-arg', this, args[2], 'to')
      }
      const expanded = expandSet(toText)
      if (undefined === expanded) {
        return makeNilErr(ctx, 'invalid-arg', this, args[2], 'to')
      }
      to = expanded
    }

    // The table, built left to right so a character named twice takes
    // its last mapping. An empty `to` maps to nothing, which is the
    // deletion: there is no last character to pad with.
    const pad = 0 < to.length ? to[to.length - 1] : undefined
    const table = new Map<string, string | undefined>()
    for (let i = 0; i < from.length; i++) {
      table.set(from[i], i < to.length ? to[i] : pad)
    }

    let out = ''
    for (const c of Array.from(src)) {
      if (table.has(c)) {
        const sub = table.get(c)
        if (undefined !== sub) {
          out += sub
        }
        continue
      }
      out += c
    }

    return this.place(new StringVal({ peg: out }, ctx))
  }

} /* node:coverage ignore next 6 */


export {
  expandSet,
  TranslateFuncVal,
}
