/* Copyright (c) 2025 Richard Rodger, MIT License */

// GENERATION: `each(data, tmpl)` (G8 phase 1,
// docs/capability-review/g8-generation.md). One element of the result
// list per child of `data`, each of them that child met with `tmpl`.
// Written with one argument, `each(m)` is a map's children as a list.
//
//   ports: {http: 80, https: 443}
//   open: each($.ports, integer)   ->  [80, 443]
//
// ORDER IS FIXED, and fixed the way canon already fixes it: source
// order for a list, sorted-key order for a map (`cmpCodePoint`, the
// comparator `MapVal.canon` and the Go port's marshalling use). A
// generated list whose order depended on insertion history would differ
// between two runs of the same document, and between the two ports --
// the one thing the shared spec exists to prevent.
//
// The element is the source child CLONED, not shared: it is a second
// position holding that value, and a position is where path-dependent
// content resolves. What the clone keeps is the identity, if the child
// carries one (G4 phase 1) -- a listed entity is still that entity, and
// the merge that follows is the point.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { unite, withDepth } from '../unify'
import { makeNilErr } from '../err'
import { top } from './top'
import { ListVal } from './ListVal'
import { FuncBaseVal } from './FuncBaseVal'
import { cmpCodePoint } from '../keyorder'


// The children a data bag holds, in the order the result must carry
// them, or the code naming what is wrong with the argument.
function dataValues(data: Val | undefined): Val[] | string {
  const d: any = data

  if (true === d?.isMap) {
    return Object.keys(d.peg).sort(cmpCodePoint).map((k: string) => d.peg[k])
  }

  if (true === d?.isList) {
    return [...(d.peg as Val[])]
  }

  return 'each_data'
}


class EachFuncVal extends FuncBaseVal {
  isEachFunc = true

  // THE STAGING RULE, for the reason given in PackFuncVal.
  staged = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }



  funcname() {
    return 'each'
  }


  // The template is not an argument to drive (see PackFuncVal.prepare).
  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const data = this.peg?.[0]
    if (null != data && !data.done) {
      this.peg[0] = withDepth(ctx, data, top(), () => data.unify(top(), ctx))
    }

    if (!ctx.settle || true !== this.peg?.[0]?.done) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


  resolve(ctx: AontuContext, args: Val[]) {
    const vals = dataValues(args?.[0])
    if ('string' === typeof vals) {
      return makeNilErr(ctx, vals, this)
    }

    const tmpl: Val | undefined = args?.[1]
    const peg: Val[] = []

    for (let i = 0; i < vals.length; i++) {
      const elctx = ctx.descend(String(i))
      const el = vals[i].clone(elctx)
      // The template is CLONED per element, never shared: see
      // PackFuncVal.resolve.
      peg.push(undefined === tmpl ? el :
        unite(elctx, el, tmpl.clone(elctx), 'each'))
    }

    return new ListVal({ peg }, ctx)
  }

} /* node:coverage ignore next 7 */


export {
  dataValues,
  EachFuncVal,
}
