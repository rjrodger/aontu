/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr, AontuError } from '../err'

import { ScalarVal } from './ScalarVal'
import { Float } from './ScalarKindVal'

import {
  explainOpen,
  explainClose,
} from '../utility'



// The IEEE-754 binary64 leaf of the number tower. Its KIND is Float (the
// keyword `float`), not the `number` supertype: `number` names the family
// of numeric leaves and never tags a concrete value. The class name is
// historical -- `number` used to name this leaf.
class NumberVal extends ScalarVal {
  isNumber = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    // Number.isFinite (not the coercing global isNaN, which lets null/''
    // through as "numbers") — only an actual finite number is valid.
    if (!Number.isFinite(spec.peg)) {
      // TODO: use Nil?
      throw new AontuError('not-number: ' + spec.peg)
    }

    super({ ...spec, kind: Float }, ctx)
  }


  unify(peer: any, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Number', this, peer)

    let out: Val = this

    if (null != peer) {
      if (peer.isScalarKind) {
        out = peer.unify(this, ctx)
      }
      else if (
        peer.isScalar &&
        peer.kind === this.kind &&
        peer.peg === this.peg
      ) {
        // Same kind (both Float) and equal value: integer/float no
        // longer cross-unify, so peer is necessarily a NumberVal here.
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


  // Canon must round-trip kind: reparsing the canon of a float-kind
  // value has to yield a float-kind value again. A rendering with no
  // '.' and no exponent (1 -> "1") would reparse as an integer, so it
  // gains a ".0" suffix. Renderings that already carry a fraction, an
  // exponent, or are NaN/Infinity are left alone.
  //
  // This is the CANON path only. String coercion inside `+` keeps plain
  // JS parity ("a"+1.0 is "a1"), so it must not pick up the suffix.
  get canon() {
    const s = super.canon
    return (s.includes('.') ||
      s.includes('e') ||
      s.includes('E') ||
      s.includes('N') ||
      s.includes('I')) ? s : s + '.0'
  }
}


export {
  NumberVal,
}
