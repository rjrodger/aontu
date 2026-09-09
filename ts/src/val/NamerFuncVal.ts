/* Copyright (c) 2026 Richard Rodger, MIT License */

// `namer` -- NAME TRANSFORMATION, THE GENERAL CASE (SPIKE,
// docs/design/JOSTRACA.0.md).
//
// Generated code is mostly names, and no two targets spell them the
// same way: one model field is `user_id` in SQL, `userId` in
// TypeScript, `UserID` in Go, `USER_ID` in an environment variable and
// `user-id` in a URL. Before this, aontu had whole-string `upper` and
// `lower` and nothing else, so the spike's own worked example wrote
// `Planet` out by hand rather than deriving it -- `upper("planet")` is
// `PLANET`.
//
//   namer(s)                  every spelling, as a map
//   namer(s, style)           one spelling
//   namer(s, acronyms)        every spelling, with an acronym set
//   namer(s, style, acronyms) one spelling, with an acronym set
//
// THE SOURCE FORMAT IS NOT DECLARED, and that is what makes this the
// general case rather than a family of pairwise converters. A name is
// SPLIT INTO WORDS first -- `user_id`, `userId`, `UserID`, `USER_ID`,
// `user-id`, `user.id` and `user/id` all split to `[user, id]` -- and
// then rendered in the target style. N formats in and M out is one
// splitter and M renderers, not N*M.
//
// THE SPLITTER IS THE RENDERER'S OWN (`splitWords`, ts/src/lower.ts):
// the same one `aontu:profile`'s `%case` uses to lower a declaration,
// so a name derived here and a name the renderer derives cannot
// disagree. It breaks at `_`, `-` and space, at a lower-to-upper
// boundary, at a letter-to-digit boundary either way, and before the
// last capital of a capital run a lower case letter follows
// (`HTTPServer` is HTTP, Server).
//
// `.` AND `/` ARE NORMALISED HERE, not in the splitter. A dotted path
// and a slash path are name formats an author converts FROM, but the
// splitter's behaviour is pinned in cross-port parity by the
// renderer's rows, so the extra separators are this function's
// vocabulary and are folded to `_` before it is asked. The same
// boundary applies to the four styles below that `caseName` does not
// serve: `title`, `human`, `dot` and `path` are namer's, and
// `aontu:profile`'s `%case` set is unchanged.
//
// THE ACRONYM SET is the reason a style alone is not enough. `ledgerId`
// is `LedgerID` in Go and `ledgerId` in TypeScript, which is a fact
// about the TARGET and not about the name -- so it is an argument, and
// a document generating for two targets passes a different one to each.
//
// SPIKE SCOPE. TypeScript only, so -- as with the component primitives
// -- deliberately absent from test/spec/signature.tsv, BUILTIN_FUNCS
// and grammar/, all pinned in cross-port parity. Arity and argument
// shape are refused here rather than by the parse-time table or the
// signature gate, and every refusal is `invalid-arg`, because a new
// code needs a row in test/spec/errcodes.tsv and an entry in BOTH
// ports' tables.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import {
  splitWords,
  caseName,
  lowerASCII,
  capitalise,
} from '../lower'

import { MapVal } from './MapVal'
import { StringVal } from './StringVal'
import { FuncBaseVal } from './FuncBaseVal'


// The styles, and the map's keys. The first five are `caseName`'s --
// `aontu:profile`'s `%case` vocabulary, shared with the renderer --
// and the last four are namer's own (see the note above). `as-is` is
// not among them: it is the profile's way of saying "do nothing",
// which is not a spelling anyone asks a namer for.
const NAMER_STYLES = [
  'camel',      // userId
  'dot',        // user.id
  'human',      // User id
  'kebab',      // user-id
  'pascal',     // UserId
  'path',       // user/id
  'screaming',  // USER_ID
  'snake',      // user_id
  'title',      // User Id
]

const CASENAME_STYLES = ['camel', 'kebab', 'pascal', 'screaming', 'snake']


// One name in one style, or undefined when the style is not one, or
// when the name holds no words at all.
function styleName(name: string, style: string, acronyms: string[]):
  string | undefined {
  // `.` and `/` are namer's separators, folded before the shared
  // splitter is asked (see the note above). Everything else that is
  // not a separator is word content: a `$` or a `@` rides into the
  // word it sits in, which is why `namer` renames a spelled path's
  // text and does not tidy it.
  const src = name.replace(/[./]/g, '_')

  // A NAME WITH NO WORDS IS NOT A NAME, and it is refused in every
  // style. `caseName` answers its INPUT for one (it is lowering a
  // declaration, where the name has already been vetted), so
  // `namer("_", pascal)` came back as `"_"` while `namer("_")`
  // refused -- the same argument, accepted by one spelling of the
  // call and refused by the other.
  const words = splitWords(src)
  if (0 === words.length) {
    return undefined
  }

  if (CASENAME_STYLES.includes(style)) {
    return caseName(src, style, acronyms)
  }

  if ('dot' === style) {
    return words.map(lowerASCII).join('.')
  }
  if ('path' === style) {
    return words.map(lowerASCII).join('/')
  }
  if ('title' === style) {
    return words.map((w) => capitalise(w, acronyms)).join(' ')
  }
  if ('human' === style) {
    // Sentence case: the first word capitalised, the rest lower --
    // EXCEPT an acronym, which stays one, because `ledger id` loses
    // what `ID` was. Membership in the set decides that, not how the
    // input happened to spell the word: asking whether `capitalise`
    // changed it made `namer("ledgerId", human, [ID])` answer
    // `Ledger id` while `namer("ledgerID", human, [ID])` answered
    // `Ledger ID` -- the same name, two answers, decided by its
    // source spelling, which is the one thing a namer must not do.
    const isAcronym = (w: string) =>
      acronyms.some((a) => lowerASCII(a) === lowerASCII(w))
    return [capitalise(words[0], acronyms)]
      .concat(words.slice(1).map((w) =>
        isAcronym(w) ? capitalise(w, acronyms) : lowerASCII(w)))
      .join(' ')
  }

  return undefined
}


// The text a value carries, when it is a concrete string. A path is a
// string too (ScalarKindVal's Path sits under String), so a spelled
// address may be renamed like any other text.
function textOf(v: Val | undefined): string | undefined {
  const s: any = v
  return (true === s?.isScalar && 'string' === typeof s.peg) ? s.peg : undefined
}


// An acronym set: a list of concrete strings, or undefined when the
// value is not one.
function acronymsOf(v: Val | undefined): string[] | undefined {
  const l: any = v
  if (true !== l?.isList) {
    return undefined
  }
  const out: string[] = []
  for (const el of l.peg as Val[]) {
    const t = textOf(el)
    if (undefined === t || '' === t) {
      return undefined
    }
    out.push(t)
  }
  return out
}


class NamerFuncVal extends FuncBaseVal {
  isNamerFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new NamerFuncVal(spec)
  }

  funcname() {
    return 'namer'
  }


  resolve(ctx: AontuContext, args: Val[]): Val {
    if (args.length < 1 || 3 < args.length) {
      return makeNilErr(ctx, 'invalid-arg', this, undefined, 'arity')
    }

    const name = textOf(args[0])
    if (undefined === name || '' === name) {
      return makeNilErr(ctx, 'invalid-arg', this, args[0], 'name')
    }

    // THE SECOND ARGUMENT SAYS WHICH OF THE FOUR CALLS THIS IS, by
    // its shape rather than by its position: a STRING is the style, a
    // LIST is the acronym set. The same rule the component primitives
    // read their spec by, and it is what keeps the acronym set
    // reachable from the map form without a placeholder argument.
    let style: string | undefined
    let acronyms: string[] = []

    if (2 <= args.length) {
      const second: any = args[1]
      if (true === second?.isList) {
        if (3 === args.length) {
          return makeNilErr(ctx, 'invalid-arg', this, args[2], 'arity')
        }
        const acr = acronymsOf(second)
        if (undefined === acr) {
          return makeNilErr(ctx, 'invalid-arg', this, second, 'acronyms')
        }
        acronyms = acr
      }
      else {
        style = textOf(second)
        if (undefined === style) {
          return makeNilErr(ctx, 'invalid-arg', this, second, 'style')
        }
        if (3 === args.length) {
          const acr = acronymsOf(args[2])
          if (undefined === acr) {
            return makeNilErr(ctx, 'invalid-arg', this, args[2], 'acronyms')
          }
          acronyms = acr
        }
      }
    }

    // One style: the string.
    if (undefined !== style) {
      const out = styleName(name, style, acronyms)
      if (undefined === out) {
        return makeNilErr(ctx, 'invalid-arg', this, args[1], 'style')
      }
      return this.place(new StringVal({ peg: out }, ctx))
    }

    // Every style: the map. Closed, because the nine keys ARE the
    // vocabulary and a tenth is a typo -- `namer($.n).pascel` is
    // refused where every other mistake in an aontu document is.
    const peg: Record<string, Val> = {}
    for (const s of NAMER_STYLES) {
      const out = styleName(name, s, acronyms)
      if (undefined === out) {
        return makeNilErr(ctx, 'invalid-arg', this, args[0], 'name')
      }
      peg[s] = new StringVal({ peg: out }, ctx)
    }
    const map = new MapVal({ peg }, ctx)
    map.closed = true

    return this.place(map)
  }

} /* node:coverage ignore next 6 */


export {
  NAMER_STYLES,
  NamerFuncVal,
}
