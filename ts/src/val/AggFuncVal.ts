/* Copyright (c) 2025 Richard Rodger, MIT License */


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


function bagChildren(data: any, ctx: AontuContext): Val[] | undefined {
  return memberVals(data, ctx)
}


class AggFuncVal extends FuncBaseVal {
  isAggFunc = true

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


  funcname() {
    return this.op
  }


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


type MemberVerdict = 'text' | 'never' | 'notyet'


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
    const ready = this.driveStagedArgs(ctx, 2)

    if (!ready || !ctx.settle) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


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

    let sep = ''
    if (1 < args.length) {
      sep = unpref(args[1]).peg
    }

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

    return this.place(new StringVal({ peg: parts.join(sep) }))
  }
}


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
