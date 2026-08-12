/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr, AontuError } from '../err'

import { ScalarVal } from './ScalarVal'
import { Integer } from './ScalarKindVal'
import { isIntegerKind, integerDigits } from './numkind'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


class IntegerVal extends ScalarVal {
  isInteger = true


  // Canon renders the EXACT digits of the value, not JavaScript's
  // shortest round-tripping form.
  //
  // A JS number's toString emits the shortest decimal that parses back
  // to the same double — at most 17 significant digits — so 2^60 printed
  // as `1152921504606847000`, a DIFFERENT integer that merely rounds to
  // the same double, while the Go port printed the true
  // `1152921504606846976` from its int64. That was the one entry in the
  // parity ledger (issue #21).
  //
  // Neither rendering was "the wrong number" while lossy literals were
  // still accepted, which is why the ledger deferred to the Phase 6
  // refusal — but Phase 6 refuses INEXACT literals, and every value in
  // this window (2^60, 2^63-1024, …) is exactly representable and so is
  // accepted. The divergence was never about exactness; it was about
  // rendering. Once the value is exactly what the source asked for,
  // there IS a right answer, and it is the exact digits.
  //
  // BigInt is exact here by construction: an IntegerVal's peg is
  // integral and inside the int64 window (isIntegerKind, enforced in the
  // constructor), so the bigint conversion cannot lose anything.
  get canon() {
    return integerDigits(this.peg as number)
  }


  // The same exactness in GENERATED output -- the other half of #21, and
  // the half canon cannot reach.
  //
  // `generate()` returns NATIVE values, and the emitter sees only those:
  // by the time exactJSON has a JS number it can no longer tell an
  // integer-kind 2^60 (whose exact digits are the answer) from a
  // float-kind 1e21 (whose shortest form `1e+21` is the answer, and is
  // what Go prints too). The kind has to travel WITH the value, so above
  // the safe-integer range an integer-kind value generates as a `bigint`,
  // which the emitter already writes as exact digits.
  //
  // WHY Number.isSafeInteger IS THE LINE. It is precisely "this double is
  // an integer that renders its own exact digits": inside the range the
  // integers are contiguous, so toString round-trips exactly and a
  // `number` loses nothing. Outside it they are not, and JS itself
  // declares the value untrustworthy -- so handing back a `number` there
  // would give a consumer something that prints wrong AND does
  // arithmetic wrong, silently. A bigint makes both explicit: mixing it
  // with a number throws rather than quietly rounding.
  //
  // The line is deliberately the WELL-KNOWN one rather than the tightest
  // possible one. Some doubles above the range do still render exactly
  // (2^54, say), so a predicate of `BigInt(peg).toString() === String(peg)`
  // would keep marginally more values as `number` -- at the cost of a
  // contract no consumer could evaluate in their head, and of handing
  // back unsafe numbers for arithmetic. "Integers up to
  // Number.MAX_SAFE_INTEGER are numbers; beyond that, bigints" is a rule
  // that can be stated once and relied on.
  //
  // This is a BREAKING change for a consumer reading integers above 2^53
  // out of generate() -- but those were the values that were already
  // silently wrong, and a TypeError on `out.x + 1` is the better failure.
  // Go needs none of this: its integer leaf is an int64, exact across the
  // whole window, and encoding/json writes its digits.
  //
  // The BYTES are unchanged below the line, and the values that cross it
  // with 17 or fewer significant digits (2^53 itself) serialise the same
  // either way -- only their runtime type moves, which is why the `gens`
  // rows cannot see it and ts/test/exactjson.test.ts pins it instead.
  gen(_ctx?: AontuContext) {
    const peg = this.peg as number
    return Number.isSafeInteger(peg) ? peg : BigInt(peg)
  }

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    // An IntegerVal must hold a value of *integer kind*: integral AND
    // within the int64 range, so it can never hold something the Go
    // port's int64 storage could not (see isIntegerKind). Every
    // construction site pre-checks with the same helper, so reaching
    // here is a programming error, not user input — hence a throw.
    if (!isIntegerKind(spec.peg)) {
      throw new AontuError('not-integer-kind: ' + spec.peg)
    }
    // super({ peg: spec.peg, kind: Integer }, ctx)
    super({ ...spec, kind: Integer }, ctx)
  }

  unify(peer: any, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Integer', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind || (peer as any).isConstraint) {
        out = peer.unify(this, te ? ctx.clone({ explain: ec(te, 'KND') }) : ctx)
      }
      else if (
        peer.isScalar &&
        peer.kind === this.kind &&
        peer.peg === this.peg
      ) {
        out = this
      }
      else if (peer.isTop) {
        out = this
      }
      else {
        out = makeNilErr(ctx, 'scalar_' +
          ((peer as any).kind === this.kind ? 'value' : 'kind'), this, peer)
      }
    }
    else {
      out = super.unify(peer, ctx)
    }

    explainClose(te, out)

    return out
  }
} /* node:coverage ignore next 6 */


export {
  IntegerVal,
}
