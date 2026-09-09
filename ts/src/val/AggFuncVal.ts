/* Copyright (c) 2025 Richard Rodger, MIT License */

// AGGREGATION, PROJECTION AND THE STRING FOLD: `sum(d)`, `least(d)`,
// `greatest(d)`, `pick(d, k)` and `join(d, sep?)`.
//
// The review's finding I: "No aggregation. `length()` counts but
// nothing sums: an invoice total, a fleet-wide resource budget, a quota
// roll-up -- all inexpressible." Use case 10 had to write totals by
// hand and spot-check them with `must()`, which is a model asserting
// what it should be able to COMPUTE.
//
//   total:   sum($.lines)                 # an invoice total
//   cheapest: least($.quotes)             # ... and the extremes
//   peak:    greatest($.hourly)
//
// A FOLD OVER A FINITE, SETTLED BAG IS AS TOTAL AS `form`. There is no
// recursion here and no user-supplied step: the bag is the one the
// model already holds, the operation is fixed, and the walk visits each
// child exactly once. That is the whole reason these are built-ins
// rather than a `fold` combinator -- a fold takes a function, and a
// language with no user functions has none to take.
//
// THE NAMES ARE `least` AND `greatest`, NOT `min` AND `max`, because
// those two are already the constraint atoms for a LOWER and UPPER
// BOUND (`min(3)` means "at least 3"). An aggregate over a bag and a
// bound on a value are different things and must not share a spelling;
// least and greatest are the lattice's own words for the extremes of a
// set, which is exactly what these compute.
//
// `sum` FOLDS WITH `add`, so the number tower's whole law comes with it
// (arith.ts): the exact ladder, R5 contagion, the refusal to mix a
// binary float with an exact leaf, and the refusal to store a result
// that will not fit. A bag of integers sums to an integer; one integer
// float among them makes the total a float; `0d` operands keep it
// exact. And `sum([])` is `0` -- addition has an identity, which is
// what makes the empty case answerable.
//
// `least`/`greatest` have NO identity to answer an empty bag with: the
// least element of nothing is not a value, it is a question with no
// answer, so an empty bag is a located `aggregate_empty` rather than an
// invented zero or infinity. They compare with the tower's EXACT
// comparator (numcmp), so an integer and a bigdecimal in one bag order
// correctly rather than through binary64, and the winner is returned
// with its own kind intact.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'
import { IntegerVal } from './IntegerVal'
import { ListVal } from './ListVal'
import { StringVal } from './StringVal'
import { FuncBaseVal } from './FuncBaseVal'
import { arith } from './arith'
import { cmpNumeric } from './numcmp'
import { memberVals } from './members'
import { plusText } from './PlusOpVal'


type AggOp = 'sum' | 'least' | 'greatest'


// The children of a bag, in the order the aggregate sees them: source
// order for a list, sorted-key order for a map -- `form`'s order, and
// for the same reason (a map has no order of its own, so the language
// picks one and states it).
// The members of the bag a fold reads: what generation would emit
// (./members.ts, BUGS.md §79), in the one map-key order (BUGS.md §62).
function bagChildren(data: any, ctx: AontuContext): Val[] | undefined {
  return memberVals(data, ctx)
}


class AggFuncVal extends FuncBaseVal {
  isAggFunc = true

  // THE STAGING RULE (G8 phase 0). A total over a bag that is still
  // being merged into is a total of the wrong bag -- the same reason
  // `filter` and `form` wait.
  staged = true

  op: AggOp

  constructor(
    spec: ValSpec,
    ctx: AontuContext | undefined,
    op: AggOp
  ) {
    super(spec, ctx)
    this.op = op
  }


  // NO `make` OVERRIDE, matching the other STAGED funcs (pack, each,
  // filter, match): a staged call returns `residuate` before `unify`
  // ever reaches the rebuild branch, so an override there would be
  // unreachable code pretending to be a contract. The base's `make`
  // raises `func:<name>` if that ever stops being true, which is the
  // loud answer rather than a value that silently lost its operation.

  funcname() {
    return this.op
  }


  // The base does not drive the argument: `unify` drives it by hand,
  // because a staged func must advance what it is waiting on every
  // pass rather than only on the pass it fires.
  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const ready = this.driveStagedArgs(ctx, 1)

    if (!ready || !ctx.settle) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


  resolve(ctx: AontuContext, args: Val[]) {
    const children = bagChildren(args?.[0], ctx)

    if (undefined === children) {
      return this.place(makeNilErr(ctx, 'aggregate_data', this, undefined,
        this.op))
    }

    if ('sum' === this.op) {
      // Zero is addition's identity, so an empty bag has an answer and
      // it is an integer -- the narrowest kind, which the first real
      // operand then widens under R5 exactly as `add(0, x)` would.
      let total: Val = new IntegerVal({ peg: 0 })
      for (const child of children) {
        total = arith(ctx, 'add', this, total, child, this.op)
        // A refusal inside the fold IS the answer: adding on past a
        // non-numeric child or an overflow would report the wrong
        // reason, or none.
        if (true === (total as any).isNil) {
          return this.place(total)
        }
      }
      return this.place(total)
    }

    if (0 === children.length) {
      return this.place(makeNilErr(ctx, 'aggregate_empty', this, undefined,
        this.op))
    }

    const want = 'least' === this.op ? -1 : 1
    let best: any = undefined
    for (const child of children) {
      const c: any = unpref(child)
      if (!(c?.isVal && c.isScalar && 'string' !== typeof c.peg &&
        'boolean' !== typeof c.peg && !c.isNull)) {
        return this.place(makeNilErr(ctx, 'invalid-arg', this, undefined,
          this.op))
      }
      // The EXACT comparator (numcmp), never binary64: a bigdecimal and
      // an integer in one bag must order by their values and not by
      // whatever their float images happen to be.
      if (undefined === best || want === cmpNumeric(c, best)) {
        best = c
      }
    }
    // The winner is returned as itself, so it keeps its own kind: the
    // least of a bag of bigdecimals is a bigdecimal.
    return this.place(best.clone(ctx))
  }
}


// A pref child contributes its preferred value, and therefore that
// value's kind too -- the rule `+` and the arithmetic family apply to
// operands, applied here to bag members.
function unpref(v: any): any {
  while (v?.isPref) {
    v = v.peg
  }
  return v
}


// PROJECTION: `pick(d, k)` -- one element per child of `d`, being that
// child's `k`.
//
// The other half of the review's finding I: "`_.field` is unspellable,
// `filter` cannot see into lists, `unique()`-by-field is reserved but
// absent -- so 'no two services share a port' and 'unique event ids'
// cannot be said." Without it the aggregates above cannot reach the
// case that motivated them, because `sum` needs a bag of NUMBERS and a
// model holds a bag of RECORDS:
//
//   total: sum(pick($.lines, amountCents))
//
// IT IS NOT `form` WITH A CLEVER TEMPLATE. `form(d, _ & t)` MEETS each
// child with `t`, and a meet cannot select: `form($.lines, _ & _.amount)`
// asks for a child that is simultaneously the whole record and one of
// its fields, which is why every spelling of it answers `no_path`.
// Selection is a different operation and gets its own verb.
//
// A CHILD MISSING THE KEY IS AN ERROR, not a silently shorter list.
// Skipping would make `sum(pick(...))` quietly total the wrong set of
// records -- the failure mode an aggregate exists to prevent -- so the
// refusal names the child (`pick_key`).
class PickFuncVal extends FuncBaseVal {
  isPickFunc = true

  // The bag must settle before it is projected, exactly as it must
  // before it is folded.
  staged = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  funcname() {
    return 'pick'
  }


  // The base drives neither argument: the DATA is driven by hand below
  // (a staged func must advance what it waits on every pass), and the
  // KEY is a bare word, which the parser has already made a string.
  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const ready = this.driveStagedArgs(ctx, 1)

    if (!ready || !ctx.settle) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


  resolve(ctx: AontuContext, args: Val[]) {
    const children = bagChildren(args?.[0], ctx)
    const key: any = args?.[1]

    if (undefined === children) {
      return this.place(makeNilErr(ctx, 'aggregate_data', this, undefined,
        'pick'))
    }

    // The key is a STRING for a map child and the decimal spelling of an
    // index for a list child -- the same rule a reference segment
    // follows, so `pick(d, 0)` and `$.d.0.x` agree about what `0` names.
    const name = null == key?.peg ? undefined :
      'string' === typeof key.peg ? key.peg :
        'number' === typeof key.peg && key.isInteger ? String(key.peg) :
          undefined

    if (undefined === name) {
      return this.place(makeNilErr(ctx, 'invalid-arg', this, undefined,
        'pick'))
    }

    const peg: Val[] = []
    for (const child of children) {
      const c: any = child
      const got =
        true === c?.isMap ? c.peg[name] :
          true === c?.isList ? c.peg[Number(name)] :
            undefined
      if (null == got) {
        return this.place(makeNilErr(ctx, 'pick_key', this, undefined, 'pick',
          { key: name }))
      }
      peg.push(got.clone(ctx.descend(String(peg.length))))
    }
    return this.place(new ListVal({ peg }, ctx))
  }
}



// THE FOLD TO A STRING: `join(coll, sep?)` -- G9 phase 2.
//
// The one primitive between a model and a generated file. A spread can
// put a separator AFTER each element; putting one BETWEEN N elements is
// a reduction over strings, and the language had none: `sum` is numeric,
// `+` does not reduce a list, and indexed concatenation needs the arity
// known in advance. So a generated SQL column list carried a trailing
// comma and did not parse (use-cases/15-code-generation).
//
// IT FOLDS WITH `+` SEEDED WITH `""`, exactly as `sum` folds with `add`
// seeded with `0`. That is not a figure of speech: the members are
// rendered by `plusText`, which IS the function `+`'s string branch
// calls, so the language keeps exactly one answer to "how does a number
// become text" and the two cannot drift. `join(coll)` is therefore
// concatenation and no `concat` is needed; `join(coll, "\n")` is lines
// and no `lines` is needed. ONE BUILTIN, NOT A FAMILY.
//
// `split`/`words` is the inverse -- an input-PARSING operation with no
// generation use -- and is deliberately absent.
//
// EMPTY IS `""`, concatenation's identity, the exact parallel of
// `sum([]) == 0` and the opposite of `least([])`: a fold with an
// identity can answer the empty bag, and one without has to refuse it.
//
// MEMBERS ARE VALIDATED BEFORE THE FOLD, which is the whole reason this
// is not three lines. `+` with a string on the left RESIDUATES on a
// container or a null rather than refusing (`"" + {b:1}` and `"x" +
// null` both reach generation as `mapval_no_gen`), so folding blindly
// would turn a bad member into a useless late error pointing at the
// wrong thing. The three verdicts below are that check.
type MemberVerdict = 'text' | 'never' | 'notyet'


// Which of the three a value is.
//
// `text` -- `+` would take it, so the fold can.
//
// `never` -- a SETTLED value that will never become text: a map, a
// list, a null. This is `join_member`, class `conflict`, and it names
// the member rather than the call, because "one of these is not a
// string" is only actionable if you are told which.
//
// `notyet` -- an unresolved kind, a top, a stable residue. NOT a join
// failure at all: the call stays residual and generation reports
// `mapval_no_gen`, class `incomplete`, exactly as docs/trust.md
// requires ("a stable residue ... is ordinary incompleteness"). Getting
// this split wrong in either direction is the defect that matters here:
// refusing a residue makes `join` unusable inside a schema, and
// deferring on a map makes a real error arrive as a shrug.
function memberVerdict(v: any): MemberVerdict {
  const u = unpref(v)
  if (undefined !== plusText(u)) {
    return 'text'
  }
  if (true === u?.isMap || true === u?.isList || true === u?.isNull) {
    return 'never'
  }
  return 'notyet'
}


// The separator is a STRING or it is nothing.
//
// A number would render perfectly well through `+`, and is still
// refused: the separator is not a member of the fold, it is the
// parameter naming the text between members, and `join(x, 5)` is far
// likelier a mistake than an intent to separate with "5". `pick`'s key
// argument draws the same line for the same reason. This is the
// direction that can be loosened later without breaking a document;
// the other direction cannot.
function sepVerdict(v: any): MemberVerdict {
  const u = unpref(v)
  if (u?.isVal && u.isScalar) {
    return 'string' === typeof u.peg ? 'text' : 'never'
  }
  if (true === u?.isMap || true === u?.isList || true === u?.isNull) {
    return 'never'
  }
  return 'notyet'
}


class JoinFuncVal extends FuncBaseVal {
  isJoinFunc = true

  // The bag must settle before it is folded, exactly as it must before
  // it is summed or projected.
  staged = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  // A `make` OVERRIDE, WHERE ITS AggFuncVal SIBLINGS HAVE NONE, and the
  // difference is worth stating because it is not arbitrary. `sum`,
  // `pick` and the rest are staged and nothing more: they residuate
  // before `unify` reaches the rebuild branch, so a `make` there would
  // be unreachable code pretending to be a contract, and the base's
  // `func:<name>` refusal is the loud answer if that ever changes.
  //
  // `join` is the first builtin that is BOTH staged AND defers its
  // resolution (see `deferResolve`). A deferred call has settled
  // arguments, so it does reach the rebuild branch, and without this it
  // raised `func:join` on the first document with an unresolved member
  // — where the Go port residuated and reported `mapval_no_gen`.
  // Opposite answers on `join($.m, ",")` with `m: [string]`, caught by
  // running both engines rather than by either test suite. `super` and
  // bare `id`, the two other deferring calls, each carry the same
  // override for the same reason.
  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new JoinFuncVal(spec)
  }


  funcname() {
    return 'join'
  }


  // The base does not drive: `unify` drives by hand, because a staged
  // func must advance what it is waiting on every pass rather than only
  // on the pass it fires.
  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    // BOTH arguments, unlike `pick`, which drives only its bag: `pick`'s
    // key is a bare word the parser has already made a string, while a
    // separator is an ordinary expression and `join($.rows, $.sep)` has
    // to wait for it.
    const ready = this.driveStagedArgs(ctx, 2)

    if (!ready || !ctx.settle) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


  // The `notyet` half of the verdict, taken before `resolve` runs: with
  // arguments settled but a member still a kind, the call rides the
  // ordinary args-not-done path and residuates, which is what makes an
  // unresolved member ordinary incompleteness rather than a refusal.
  deferResolve(ctx: AontuContext, args?: Val[]): boolean {
    const children = bagChildren(args?.[0], ctx)
    if (undefined === children) {
      // Not a bag at all: let `resolve` say so rather than waiting for
      // a settling that has already happened.
      return false
    }
    const sep = args?.[1]
    if (undefined !== sep && 'notyet' === sepVerdict(sep)) {
      return true
    }
    return children.some((c) => 'notyet' === memberVerdict(c))
  }


  resolve(ctx: AontuContext, args: Val[]) {
    const children = bagChildren(args?.[0], ctx)

    if (undefined === children) {
      return this.place(makeNilErr(ctx, 'aggregate_data', this, undefined,
        'join'))
    }

    // Arity is [1,2], so a second argument is present or the separator
    // is the empty string -- which makes `join(coll)` concatenation.
    // The separator's SHAPE is settled before resolve runs: the
    // signature gate refuses every concrete non-string
    // (docs/design/SIGNATURES.0.md; join(d: map|list, sep?: string)),
    // and deferResolve holds the call while sepVerdict answers notyet
    // -- so a present separator here is text.
    let sep = ''
    if (1 < args.length) {
      sep = unpref(args[1]).peg
    }

    // NO NIL-MEMBER GUARD, WHERE `sum` HAS ONE, and the difference is
    // the fold's shape rather than an oversight. `sum` folds with
    // `arith`, which MINTS a nil part-way through — a non-numeric child
    // or an overflow — so it has to stop and return it. `join` folds
    // already-unified values, and a nil among a list's elements
    // collapses the list before this call resolves: `join([least([])],
    // ",")` reports `aggregate_empty` at the member's own path,
    // `$.o.0`, and never reaches here. A guard was written, the
    // ADR-002 gate found it unexecuted, and probing confirmed no
    // spelling reaches it, so it is removed rather than excused.
    const parts: string[] = []
    for (const child of children) {
      const u: any = unpref(child)
      const text = plusText(u)
      if (undefined === text) {
        return this.place(makeNilErr(ctx, 'join_member', this, undefined,
          'join', { member: String(u?.canon) }))
      }
      parts.push(text)
    }

    // Every part is already a string, so this IS the `+` fold seeded
    // with `""` -- written as one concatenation because a loop of `+`
    // over settled strings cannot differ from it, and because the Go
    // twin's strings.Join must produce the same bytes.
    return this.place(new StringVal({ peg: parts.join(sep) }))
  }
}


// The three the registry names. Each is its operation and nothing else.
class SumFuncVal extends AggFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'sum') }
}

class LeastFuncVal extends AggFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'least') }
}

class GreatestFuncVal extends AggFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx, 'greatest')
  }
} /* node:coverage ignore next 10 */


export {
  AggFuncVal,
  JoinFuncVal,
  PickFuncVal,
  SumFuncVal,
  LeastFuncVal,
  GreatestFuncVal,
}
