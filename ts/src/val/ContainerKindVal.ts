/* Copyright (c) 2025 Richard Rodger, MIT License */


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

import { makeNilErr } from '../err'

import { FeatureVal } from './FeatureVal'
import { FuncBaseVal } from './FuncBaseVal'


class MapKindVal extends FeatureVal {
  isContainerKind = true
  isMapKind = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
    this.dc = DONE
  }

  unify(peer: Val, ctx: AontuContext): Val {
    const p: any = peer
    if (true === p.isMap) {
      return peer
    }
    if (true === p.isMapKind) {
      return this
    }
    return makeNilErr(ctx, 'map', this, peer)
  }

  get canon() {
    return 'map()'
  }

  same(peer: any): boolean {
    return true === peer?.isMapKind
  }

} /* node:coverage ignore next 4 */


class ListKindVal extends FeatureVal {
  isContainerKind = true
  isListKind = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
    this.dc = DONE
  }

  unify(peer: Val, ctx: AontuContext): Val {
    const p: any = peer
    if (true === p.isList) {
      return peer
    }
    if (true === p.isListKind) {
      return this
    }
    return makeNilErr(ctx, 'list', this, peer)
  }

  get canon() {
    return 'list()'
  }

  same(peer: any): boolean {
    return true === peer?.isListKind
  }

} /* node:coverage ignore next 4 */


class MapFuncVal extends FuncBaseVal {
  isMapFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new MapFuncVal(spec)
  }

  funcname() {
    return 'map'
  }

  resolve(ctx: AontuContext, _args: Val[]) {
    const out = new MapKindVal({}, ctx)
    out.site = this.site
    out.path = this.path
    return out
  }

} /* node:coverage ignore next 4 */


class ListFuncVal extends FuncBaseVal {
  isListFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new ListFuncVal(spec)
  }

  funcname() {
    return 'list'
  }

  resolve(ctx: AontuContext, _args: Val[]) {
    const out = new ListKindVal({}, ctx)
    out.site = this.site
    out.path = this.path
    return out
  }

} /* node:coverage ignore next 8 */


export {
  MapKindVal,
  ListKindVal,
  MapFuncVal,
  ListFuncVal,
}
