/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type { Val } from './type'

import { AontuContext } from './ctx'

import { DONE } from './type'

import { makeNilErr } from './err'

import { NilVal } from './val/NilVal'

import {
  Lang
} from './lang'


import {
  explainOpen, ec, explainClose,
} from './utility'


import {
  top
} from './val/top'


// The evaluation budgets live on the context (ctx.budget: passes,
// revisits, depth), defaulted there to the shared spec-visible
// constants test/spec/budget.tsv pins in both ports (9 / 999 / 1000)
// and configurable through the trust profile (G5, docs/trust.md) —
// deterministically: a budget is an integer count of engine events,
// never wall-clock.
//
// Why the revisit default is 999: how many times one (Val, path) pair
// may be re-unified within a single fixpoint pass before the evaluator
// calls it non-convergence (`unify_cycle`). The old false positive here
// -- a legal model with many sibling conjunct terms at one path, each
// re-running the TOP self-unify -- is fixed by the per-pass memo below
// (_tcc/_tpi); test/spec/budget.tsv drives 1200 sibling terms through
// both engines as the regression guard.
//
// Why the depth default is 1000: the whole shared suite peaks at 603
// (the deliberately extreme 1200-sibling-term fixture; ordinary
// documents are two orders below), and V8 exhausts its call stack
// somewhere past depth ~1500 in this evaluator. 1000 sits above every
// real document and below the host limit, so the budget -- not the
// host -- decides the verdict.

// Charge a DIRECT `Val.unify` recursion to the same depth budget that
// `unite` enforces. Function and operator arguments evaluate through
// `arg.unify(top(), ...)` rather than through the dispatcher, so without
// this the counter stays flat while the JavaScript stack keeps growing:
// a 1500-deep `upper(upper(...))` resolved in TypeScript while Go — which
// routes its arguments through the counted dispatcher — reported
// `unify_cycle`. Returns the budget nil instead of running when the
// budget is spent.
const withDepth = (
  ctx: AontuContext, a: any, b: any, run: () => any
): any => {
  if (ctx.budget.depth <= ctx._depth.n) {
    return makeNilErr(ctx, 'unify_cycle', a, b)
  }
  ctx._depth.n++
  try {
    return run()
  }
  finally {
    ctx._depth.n--
  }
}


// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx: AontuContext, a: any, b: any, whence: string) => {
  // Fast paths that don't recurse and so don't need cycle-detection:
  // short-circuit before the saw-key build and seen-map lookup (which
  // together cost ~2.5µs per call). Only return early when the result
  // is already `done` — a non-done result would need the trailing
  // top() unify below.
  //
  //   A6a: same ref, already done
  //   A6b: different ref but same id + both done
  //   P1:  exact-equal scalars that are already done (14% of calls
  //        in foo-sdk, ~100% with a.done=true)
  if (a !== undefined && a !== null) {
    if (a === b) {
      if (a.done) return a
    }
    else if (b !== undefined && b !== null) {
      if (a.done && b.done) {
        if (a.id === b.id) return a
        if (a.constructor === b.constructor && a.peg === b.peg
            && !a.isNil && !b.isNil
            && !a.isMap && !a.isList
            && !a.isConjunct && !a.isDisjunct
            && !a.isRef && !a.isPref && !a.isFunc && !a.isExpect) {
          return a
        }
      }
    }
  }

  const te = ctx.explain && explainOpen(ctx, ctx.explain, 'unite', a, b)

  let out = a
  let why = 'u'

  // Cycle-detection key. Use numeric path index for speed; fall back to
  // full string key when debug is enabled so the saw value is human-readable.
  const saw = ctx.opts.debug
    ? (a ? a.id + (a.done ? '' : '*') : '') + '~' +
      (b ? b.id + (b.done ? '' : '*') : '') + '@' + ctx.pathstr
    : (a ? a.id + (a.done ? 'd' : '') : 0) + '~' +
      (b ? b.id + (b.done ? 'd' : '') : 0) + '~' + ctx.pathidx

  // NOTE: if this error occurs "unreasonably", attemp to avoid unnecesary unification
  // See for example PrefVal peg.id equality inspection.
  const sawCount = ctx.seen[saw] ?? 0
  if (ctx.budget.depth <= ctx._depth.n) {
    // Structural recursion budget. Without it, deep nesting exhausts the
    // V8 call stack and the catch-all below reports a RangeError as
    // `internal` — a verdict that depends on the host's stack size
    // rather than on the document, which is exactly what the
    // determinism clause forbids (docs/trust.md). Tripping here instead
    // makes it a stated budget error, like the pass budget.
    out = makeNilErr(ctx, 'unify_cycle', a, b)
  }
  else if (ctx.budget.revisits < sawCount) {
    // console.log('SAW', sawCount, saw, a?.id, a?.canon, b?.id, b?.canon, ctx.cc)
    out = makeNilErr(ctx, 'unify_cycle', a, b)
  }
  else {
    ctx.seen[saw] = sawCount + 1
    ctx._depth.n++

    try {
      let unified = false

      // Dispatch ladder. Structure note:
      //   - `a == null` is degenerate (shouldn't happen in practice:
      //     the top-level call seeds with a real Val). Kept for safety.
      //   - TOP is the unit element: unifying with it returns the
      //     other side. Handle both sides.
      //   - Otherwise route by Val type. Complex Vals (Conjunct,
      //     Disjunct, Ref, Pref, Func, Expect) have their own unify
      //     that knows how to absorb the peer; prefer `a.unify` when
      //     `a` is complex, else `b.unify` when `b` is complex. If
      //     neither is complex and it's not a plain-scalar match, fall
      //     through to the generic `a.unify` (concrete Val classes
      //     each handle their own peer case).
      if (a == null) {
        out = b
        why = 'b'
      }
      else if (b == null || b.isTop) {
        out = a
        why = 'a'
      }
      else if (a.isTop) {
        out = b
        why = 'b'
      }
      else if (a.isNil) {
        out = update(a, b)
        why = 'an'
      }
      else if (b.isNil) {
        out = update(b, a)
        why = 'bn'
      }
      else if (a.isConjunct || a.isExpect) {
        out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'AC') }) : ctx)
        unified = true
        why = 'a*'
      }
      else if (
        b.isConjunct
        || b.isDisjunct
        || b.isRef
        || b.isPref
        || b.isVar
        || b.isFunc
        || b.isExpect
      ) {
        out = b.unify(a, te ? ctx.clone({ explain: ec(te, 'BW') }) : ctx)
        unified = true
        why = 'bv'
      }
      // Exactly equal scalars (not caught by early fast-path — e.g.
      // because a or b isn't .done yet).
      else if (a.constructor === b.constructor && a.peg === b.peg) {
        out = update(a, b)
        why = 'up'
      }
      else {
        out = a.unify(b, te ? ctx.clone({ explain: ec(te, 'GN') }) : ctx)
        unified = true
        why = 'ab'
      }

      if (!out || !out.unify) {
        out = makeNilErr(ctx, 'unite', a, b, whence + '/nil')
        why += 'N'
      }

      // Any non-done top-level result self-unifies with TOP to ensure
      // its children finish converging. Skipped when `unified` is true
      // because the branch that set `out = X.unify(Y, ctx)` already
      // ran that Val's own unify logic.
      if (!out.done && !unified) {
        // Once per pass per (Val, path): within a single fixpoint pass
        // nothing external to the subtree changes, so repeating the TOP
        // self-unify — which conjunct folds otherwise trigger once per
        // fold term — is pure re-work, and on large models (hundreds of
        // sibling terms) the repeats trip the MAXCYCLE guard as a false
        // positive. The path is part of the key: a shared Val can
        // resolve path-dependent content differently per location.
        if (undefined !== ctx.cc
          && (out as any)._tcc === ctx.cc && (out as any)._tpi === ctx.pathidx) {
          why += 't'
        }
        else {
          out = out.unify(top(), te ? ctx.clone({ explain: ec(te, 'ND') }) : ctx)
          if (!out.done && undefined !== ctx.cc) {
            ; (out as any)._tcc = ctx.cc
            ; (out as any)._tpi = ctx.pathidx
          }
          why += 'T'
        }
      }
    }
    catch (err: any) {
      // This catch-all converts an unexpected exception into an 'internal'
      // Nil so one bad node doesn't crash a whole unify. To avoid fully
      // masking regressions, preserve the original error message (and a
      // RangeError flag — i.e. stack overflow from runaway recursion) on
      // the Nil's details so it surfaces in the formatted error rather
      // than vanishing. See err.ts (descErr) for how details render.
      out = makeNilErr(ctx, 'internal', a, b, undefined, {
        error: String(err?.message ?? err),
        ...(err instanceof RangeError ? { overflow: true } : {}),
      })
    }
    finally {
      ctx._depth.n--
    }
  }

  ctx.explain && explainClose(te, out)

  return out
}


function update(x: Val, _y: Val) {
  // TODO: update x with y.site
  return x
}


// The still-refining paths named by a budget_passes error: the first
// `max` non-done nodes of the residue, as `$.dotted.paths`. Depth-first
// over bag children only -- this feeds an error message, not a report,
// so a small deterministic sample beats completeness.
function residuePaths(v: Val, max: number): string[] {
  const out: string[] = []
  const visit = (n: any, isroot: boolean) => {
    if (null == n || max <= out.length) {
      return
    }
    if (!isroot && !n.done) {
      out.push('$' + (0 < (n.path?.length ?? 0) ? '.' + n.path.join('.') : ''))
    }
    if (n.isMap || n.isList) {
      for (const k in n.peg) {
        visit(n.peg[k], false)
      }
    }
  }
  visit(v, true)
  return out
}


class Unify {
  root: Val
  res: Val
  // err: Omit<NilVal[], "push">
  err: any[]
  explain: any[] | null
  cc: number
  lang: Lang

  constructor(root: Val | string, lang?: Lang, ctx?: AontuContext | any, src?: any) {
    this.lang = lang || new Lang()
    if ('string' === typeof root) {
      root = this.lang.parse(root)
    }

    if ('string' !== typeof src) {
      src = ''
    }

    this.cc = 0
    this.root = root
    this.res = root
    // Always use a fresh array for mutable error collection to avoid
    // mutating the shared EMPTY_ERR singleton on Val instances.
    this.err = ctx?.err ?? (root.err.length > 0 ? root.err : [])
    this.explain = ctx?.explain ?? root.explain ?? null

    let res = root
    let uctx: AontuContext

    // Only unify if no syntax errors
    if (!(root as NilVal).isNil) {
      if (ctx instanceof AontuContext) {
        uctx = ctx
      }
      else {
        uctx = new AontuContext({
          ...(ctx || {}),
          root: res,
          err: this.err,
          explain: this.explain,
          src,
        })
      }

      // TODO: messy
      // uctx.seterr(this.err)
      uctx.err = this.err
      uctx.explain = this.explain

      // Ref-spread snapshot store (see snapshotRefSpread in MapVal):
      // keyed by ref canon + source site, shared across all passes.
      ; (uctx as any).snapmap = new Map()

      const explain = null == ctx?.explain ? undefined : ctx?.explain
      const te = explain && explainOpen(uctx, explain, 'root', res)

      // NOTE: if true === res.done already, then this loop never needs to run.
      let maxcc = uctx.budget.passes
      let prevCanon: string | undefined = undefined
      for (; this.cc < maxcc && DONE !== res.dc; this.cc++) {
        // console.log('CC', this.cc, res.canon)
        uctx.cc = this.cc
        uctx.seen = {}

        // Snapshot BEFORE the final pass (the loop condition has
        // already established the tree is not done), so exhaustion can
        // tell "still refining" from "stable residue" below. Taken at
        // the final pass's ENTRY rather than the previous pass's exit
        // — the same value when the budget allows two passes, and the
        // only possible value when the trust profile sets passes to 1,
        // where the old placement (cc === maxcc - 2, never true) made
        // exhaustion silent, exactly the truncation docs/trust.md
        // forbids.
        if (this.cc === maxcc - 1) {
          prevCanon = res.canon
        }

        res = unite(te ? uctx.clone({ explain: ec(te, 'run') }) : uctx, res, top(), 'unify')

        // MULTI-ERROR COLLECTION (G2 phase 6): the pass loop CONTINUES
        // past an erroring pass, so independent failures a later pass
        // would reach are collected in the same run — the break that
        // stood here made every multi-error report truncated at the
        // first erroring pass.
        //
        // What controls the cascade the design feared: a nil is
        // ABSORBING (unite's isNil arms return the existing nil, no new
        // error), so one failure stays ONE NilVal however many later
        // meets touch it — a reference resolving to a failed target
        // takes the same nil identity, which is exactly what lets the
        // report layer dedup by identity. The probes that established
        // this (fan-in refs, spread templates, disjunct trials, nested
        // conjuncts) are pinned as vet.tsv's multi-* rows in both
        // ports.

        uctx = uctx.clone({ root: res })
      }

      // The pass budget is spent AND the final pass still made
      // progress: the model was cut off while converging, and no other
      // error explains why. Silent truncation would surface later as
      // ordinary incompleteness, so exhaustion is a semantic error of
      // its own (class budget, docs/trust.md clause 2) -- retrying with
      // a larger budget is a valid response to THIS code and useless
      // for path_cycle or no_path. A STABLE residue (the final pass
      // changed nothing -- e.g. a stuck `1+true`) is not a budget
      // failure: it is ordinary incompleteness and stays silent here,
      // surfacing at generate exactly as before.
      if (maxcc <= this.cc && DONE !== res.dc && 0 === uctx.err.length
        && undefined !== prevCanon && prevCanon !== res.canon) {
        makeNilErr(uctx, 'budget_passes', undefined, undefined, 'resolve', {
          budget: 'passes',
          limit: maxcc,
          paths: residuePaths(res, 4).join(' ') || '$',
        })
      }

      uctx.explain && explainClose(te, res)
    }

    this.res = res
  }
} /* node:coverage ignore next 9 */




export {
  Unify,
  unite,
  withDepth,
}
