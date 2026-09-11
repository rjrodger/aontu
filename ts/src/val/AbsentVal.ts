/* Copyright (c) 2026 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import {
  Val as ValBase
} from './Val'


// Top with one difference (ADR-034): absence is GENERABLE, and
// generates nothing, so a bag drops it at a required key too.
class AbsentVal extends ValBase {
  isAbsent = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.dc = DONE
    this.mark.type = false
    this.mark.hide = false
  }

  // The unit of the meet: absence narrows nothing. `unite` calls this
  // for EITHER operand, which is what makes `&` commute.
  unify(peer: Val, _ctx: AontuContext): Val {
    return peer.isTop ? this : peer
  }

  get canon() { return 'maybe()' }

  /* node:coverage ignore next 4 */
  superior(): Val {
    return this
  }

  gen(_ctx?: AontuContext) {
    return undefined
  }

} /* node:coverage ignore next 6 */


export {
  AbsentVal,
}
