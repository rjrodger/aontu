/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

import { inspect } from 'node:util'

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
  BaseVal
} from './BaseVal'


// There can be only one.
class TopVal extends BaseVal {
  isTop = true

  id = 0
  dc = DONE

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)

    // TOP is always DONE, by definition.
    this.dc = DONE
    this.mark.type = false
    this.mark.hide = false
  }

  same(peer: Val): boolean {
    // return this === peer
    return peer.isTop
  }

  unify(peer: Val, _ctx?: AontuContext): Val {
    return peer
  }

  get canon() { return 'top' }

  clone(_ctx: AontuContext, _spec?: ValSpec) {
    return this
  }

  gen(_ctx?: AontuContext) {
    return undefined
  }

}


export {
  TopVal,
}
