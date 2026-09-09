/* Copyright (c) 2025 Richard Rodger, MIT License */

// TRANSFORMATION: `form(data, tmpl)` (G9 §4; docs/design/RENDER.0.md
// D11 and P6). One element of the result list per child of `data`,
// being `tmpl` instantiated at that position with `_` bound to the
// source child. It REPLACES; it does not meet.
//
//   names: [web, auth]
//   units: form($.names, {path: _ + ".ts"})  ->  [{path: "web.ts"}, {path: "auth.ts"}]
//
// IT IS ALSO THE BOUND, because a meet is a template away.
// `form(d, _ & t)` puts the source child back into what it builds, so
// the element is that child MET with `t` rather than `t` alone:
//
//   form($.ports, _ & integer)   every element is an integer
//   form($.m, _)                 a map's members as a list
//
// That is what `each(d, t)` and `each(d)` used to spell, and why
// `each` was retired (ADR-026): one operation had two spellings, and
// the derived one carried the whole surface -- order, the member rule,
// staging, the hole's owner, and the identity a link inside a
// generated element is reported from (the graph being path-native,
// ADR-014). test/spec/gen-each.tsv holds the rows that proved it
// before the removal.
//
// WHY IT EXISTS AT ALL: ORDER. `pick(pack(d, {f: t}), f)` maps too,
// but it goes through a map and re-sorts to code-point order, and it
// refuses a list of records outright (pack_key). A struct's fields, a
// DDL's columns and a file's imports are lists whose order is the
// model's, and silently alphabetising them is wrong output. `form`
// reads its members through the one ordering helper every bag reader
// uses (members.ts), so no two can disagree about order -- source
// order for a list, sorted-key order for a map -- and it skips what
// generation would not emit: a hidden child, an unfilled optional.
//
// It joins `boundArgStart` (PlaceVal.ts): a `_` inside its template
// is ITS hole to bind, never an outer generator's. Forgetting that is
// BUGS.md §34's silent failure -- every existing test passes and the
// new combinator captures an outer generator's hole -- which is why
// the shared spec's nesting rows exist.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'
import { ListVal } from './ListVal'
import { FuncBaseVal } from './FuncBaseVal'
import { repathInstance } from './Val'
import { fillPlace } from './PlaceVal'
import { memberVals } from './members'


class FormFuncVal extends FuncBaseVal {
  isFormFunc = true

  // THE STAGING RULE, for the reason given in PackFuncVal: the data
  // is not settled merely by being `done` once.
  staged = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  funcname() {
    return 'form'
  }


  // The template is not an argument to drive (see PackFuncVal.prepare).
  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    // ONE argument is driven: the data. The template is not (see
    // prepare above).
    if (!this.stagedReady(peer, ctx, 1)) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


  resolve(ctx: AontuContext, args: Val[]) {
    const vals = memberVals(args?.[0], ctx)
    if (undefined === vals) {
      return makeNilErr(ctx, 'form_data', this)
    }

    // Arity is checked at parse (funcArity), so the template is here.
    const tmpl: Val = args[1]
    const peg: Val[] = []

    for (let i = 0; i < vals.length; i++) {
      const elctx = ctx.descend(String(i))
      // A FULL INSTANCE per element, to the leaves (`dup`, ADR-005),
      // at the element's own position -- see PackFuncVal.resolve --
      // with `_` bound to the source child and NOTHING met into it.
      const inst = tmpl.clone(elctx, { dup: true })
      repathInstance(inst, inst.path)
      peg.push(fillPlace(inst, vals[i], elctx))
    }

    return new ListVal({ peg }, ctx)
  }

} /* node:coverage ignore next 6 */


export {
  FormFuncVal,
}
