/* Copyright (c) 2021-2023 Richard Rodger, MIT License */

// TODO: infinite recursion protection


// NOTES
// - Vals are immutable
// - each Val must handle all parent and child unifications explicitly
// - performance is not considered yet



/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer 
    -> Scalar/Integer -> IntegerVal

*/



import type {
  Val,
  ValSpec,
} from './type'

import {
  DONE,
} from './type'

import {
  Context,
} from './unify'


import {
  Site
} from './lang'


import { Nil } from './val/Nil'
import { RefVal } from './val/RefVal'
import { ValBase } from './val/ValBase'


// There can be only one.
class TopVal extends ValBase {
  isTop = true

  id = 0
  top = true
  peg = undefined
  done = DONE
  path = []
  row = -1
  col = -1
  url = ''

  constructor() {
    super(null)

    // TOP is always DONE, by definition.
    this.done = DONE
  }

  unify(peer: Val, _ctx?: Context): Val {
    return peer
  }

  get canon() { return 'top' }

  get site(): Site { return new Site(this) }

  same(peer: Val): boolean {
    return this === peer
  }

  clone() {
    return this
  }

  gen(_ctx?: Context) {
    return undefined
  }
}



const TOP = new TopVal()


// A ScalarType for integers. Number includes floats.
class Integer { }



type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarTypeVal extends ValBase {
  isScalarTypeVal = true

  constructor(
    spec: {
      peg: ScalarConstructor
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    this.done = DONE
  }

  unify(peer: any, ctx?: Context): Val {
    if (peer?.isScalarVal) {
      if (peer.type === this.peg) {
        return peer
      }
      else if (Number === this.peg && Integer === peer.type) {
        return peer
      }
      return Nil.make(ctx, 'no-scalar-unify', this, peer)
    }
    else {
      if (peer?.isScalarTypeVal) {
        if (Number === this.peg && Integer === peer.peg) {
          return peer
        }
        else if (Number === peer.peg && Integer === this.peg) {
          return this
        }
      }
      return Nil.make(ctx, 'scalar-type', this, peer)
    }
  }

  get canon() {
    let ctor = (this.peg as any)
    return ctor.name.toLowerCase()
  }

  same(peer: any): boolean {
    return peer?.isScalarTypeVal ? this.peg === peer.peg : super.same(peer)
  }

  gen(_ctx?: Context) {
    return undefined
  }

}



class ScalarVal<T> extends ValBase {
  type: any
  isScalarVal = true

  constructor(
    spec: {
      peg: T,
      type: ScalarConstructor
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    this.type = spec.type
    this.done = DONE
  }

  clone(spec?: ValSpec, ctx?: Context): Val {
    let out = (super.clone({
      peg: this.peg,
      type: this.type,
      ...(spec || {})
    }, ctx) as RefVal)
    return out
  }

  unify(peer: any, ctx?: Context): Val {
    // Exactly equal scalars are handled in op/unite
    if (peer?.isScalarTypeVal) {
      return peer.unify(this, ctx)
    }
    else if (peer.top) {
      return this
    }
    return Nil.make(ctx, 'scalar', this, peer)
  }

  get canon() {
    return (this.peg as any).toString()
  }

  same(peer: any): boolean {
    return peer?.isScalarVal ? peer.peg === this.peg : super.same(peer)
  }

  gen(_ctx?: Context) {
    return this.peg
  }
}


class NumberVal extends ScalarVal<number> {
  isNumberVal = true

  constructor(
    spec: {
      peg: number
    },
    ctx?: Context
  ) {
    super({ peg: spec.peg, type: Number }, ctx)
  }

  unify(peer: any, ctx?: Context): Val {
    if (null != peer) {
      if (peer.isScalarTypeVal && peer.type === Number) {
        return this
      }
      else if (
        peer.isScalarVal &&
        peer.peg === this.peg
      ) {
        return peer.isIntegerVal ? peer : this
      }
    }

    return super.unify(peer, ctx)
  }
}


class IntegerVal extends ScalarVal<number> {
  isIntegerVal = true

  constructor(
    spec: {
      peg: number
    },
    ctx?: Context
  ) {
    if (!Number.isInteger(spec.peg)) {
      // TODO: use Nil?
      throw new Error('not-integer')
    }
    super({ peg: spec.peg, type: Integer }, ctx)
  }

  unify(peer: any, ctx?: Context): Val {
    if (null != peer) {
      if (peer.isScalarTypeVal && (peer.peg === Number || peer.peg === Integer)) {
        return this
      }
      else if (
        peer.isScalarVal &&
        // peer.type === Number &&
        peer.peg === this.peg
      ) {
        return this
      }
    }

    return super.unify(peer, ctx)
  }
}


class StringVal extends ScalarVal<string> {
  isStringVal = true

  constructor(
    spec: {
      peg: string
    },
    ctx?: Context
  ) {
    super({ peg: spec.peg, type: String }, ctx)
  }
  unify(peer: Val, ctx?: Context): Val {
    return super.unify(peer, ctx)
  }
  get canon() {
    return JSON.stringify(this.peg)
  }

}


class BooleanVal extends ScalarVal<boolean> {
  isBooleanVal = true

  constructor(
    spec: {
      peg: boolean
    },
    ctx?: Context
  ) {
    super({ peg: spec.peg, type: Boolean }, ctx)
  }
  unify(peer: Val, ctx?: Context): Val {
    return super.unify(peer, ctx)
  }

  static TRUE = new BooleanVal({ peg: true }, new Context({ vc: 1, root: TOP }))
  static FALSE = new BooleanVal({ peg: false }, new Context({ vc: 2, root: TOP }))
}



export {
  TOP,
  Integer,
  ScalarTypeVal,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
}
