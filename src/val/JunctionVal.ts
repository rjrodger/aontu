/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { FeatureVal } from './FeatureVal'


// Abstract base class for binary operations that work with arrays of Val objects
// (ConjunctVal and DisjunctVal)
abstract class JunctionVal extends FeatureVal {
  isJunction = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }

  // NOTE: mutation!
  append(peer: Val): JunctionVal {
    this.peg.push(peer)
    return this
  }

  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as JunctionVal)
    out.peg = this.peg.map((entry: Val) => entry.clone(ctx, spec?.mark ? { mark: spec.mark } : {}))
    return out
  }

  get canon() {
    return this.peg.map((v: Val) => {
      return (v as any).isJunction && Array.isArray(v.peg) && 1 < v.peg.length ?
        '(' + v.canon + ')' : v.canon
    }).join(this.getJunctionSymbol())
  }

  // Abstract method to be implemented by subclasses to define their junction symbol
  abstract getJunctionSymbol(): string
}


export {
  JunctionVal,
}
