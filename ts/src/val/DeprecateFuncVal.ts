/* Copyright (c) 2025 Richard Rodger, MIT License */

// The deprecation mark (G3 phase 4,
// docs/capability-review/g3-subsumption-evolution.md): a function-form
// builtin, `deprecate(x, m)`, that unifies EXACTLY as `x` while the
// record `m` rides the result through meets. The record's keys are
// msg, use and since — all optional, all strings; `use` is a path
// spelled as a STRING, because a live reference would resolve and
// unify, which is not wanted. Boolean ValMarks cannot hold a record,
// so the Val carries one optional field (Val.deprecation), propagated
// by the same channel as the marks (propagateMarks) and rendered back
// reparseably by canon (canonRiders).

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { FuncBaseVal } from './FuncBaseVal'


// The record's whole vocabulary. Other keys are DROPPED, not carried:
// the record is a contract the tooling reads (vet, the LSP tag, the
// breaking downgrade), and a bag of free-form keys would be a second,
// unspecified metadata channel.
const DEPRECATION_KEYS = ['msg', 'use', 'since']


class DeprecateFuncVal extends FuncBaseVal {
  isDeprecateFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new DeprecateFuncVal(spec)
  }

  funcname() {
    return 'deprecate'
  }

  resolve(ctx: AontuContext, args: Val[]) {
    let out = args[0] ?? makeNilErr(ctx, 'arg', this)

    // A nil ARGUMENT is returned unchanged, never marked: marking it
    // makes the bag's marked-child skip drop it (the type()/hide()
    // lesson — refusal over corruption, D7).
    if (out.isNil) {
      return out
    }

    out = out.clone(ctx)

    const record: Record<string, string> = {}
    const m: any = args[1]
    if (true === m?.isMap && null != m.peg) {
      for (const key of DEPRECATION_KEYS) {
        const v = m.peg[key]
        if (true === v?.isScalar && 'string' === typeof v.peg) {
          record[key] = v.peg
        }
      }
    }
    out.deprecation = record

    return out
  }
} /* node:coverage ignore next 6 */


export {
  DeprecateFuncVal,
}
