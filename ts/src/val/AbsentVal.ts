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

import { FeatureVal } from './FeatureVal'


// Top with one difference (ADR-034): absence is GENERABLE, and
// generates nothing, so a bag drops it at a required key too.
class AbsentVal extends FeatureVal {
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
  // for EITHER operand, which is what makes `&` commute, and never
  // with top: the fast paths above it answer that pair.
  unify(peer: Val, _ctx: AontuContext): Val {
    return peer
  }

  get canon() { return 'maybe()' }

  gen(_ctx?: AontuContext) {
    return undefined
  }

} /* node:coverage ignore next 6 */


export {
  AbsentVal,
}
