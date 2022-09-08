/* Copyright (c) 2021 Richard Rodger, MIT License */

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
} from './type'

import {
  DONE,
  TOP,
} from './type'

import {
  Context,
} from './unify'


import {
  Site
} from './lang'



import { Nil } from './val/Nil'

import {
  ValBase,
} from './val/ValBase'








// A ScalarType for integers. Number includes floats.
class Integer { }



type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarTypeVal extends ValBase {
  constructor(peg: ScalarConstructor, ctx?: Context) {
    super(peg, ctx)
    this.done = DONE
  }

  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarVal) {
      if (peer.type === this.peg) {
        return peer
      }
      else if (Number === this.peg && Integer === peer.type) {
        return peer
      }
      return Nil.make(ctx, 'no-scalar-unify', this, peer)
    }
    else {
      if (peer instanceof ScalarTypeVal) {
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

  same(peer: Val): boolean {
    return peer instanceof ScalarTypeVal ? this.peg === peer.peg : super.same(peer)
  }

  gen(_ctx?: Context) {
    return undefined
  }

}


class ScalarVal<T> extends ValBase {
  type: any
  constructor(peg: T, type: ScalarConstructor, ctx?: Context) {
    super(peg, ctx)
    this.type = type
    this.done = DONE
  }
  unify(peer: Val, ctx: Context): Val {
    // Exactly equal scalars are handled in op/unite
    if (peer instanceof ScalarTypeVal) {
      return peer.unify(this, ctx)
    }
    return Nil.make(ctx, 'scalar', this, peer)
  }
  get canon() {
    return (this.peg as any).toString()
  }
  same(peer: Val): boolean {
    return peer instanceof ScalarVal ? peer.peg === this.peg : super.same(peer)
  }

  gen(_ctx?: Context) {
    return this.peg
  }
}


class NumberVal extends ScalarVal<number> {
  constructor(peg: number, ctx?: Context) {
    super(peg, Number, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarVal && peer.type === Integer) {
      return peer
    }
    else {
      return super.unify(peer, ctx)
    }
  }
}


class IntegerVal extends ScalarVal<number> {
  constructor(peg: number, ctx?: Context) {
    if (!Number.isInteger(peg)) {
      // TODO: use Nil?
      throw new Error('not-integer')
    }
    super(peg, Integer, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarTypeVal && peer.peg === Number) {
      return this
    }
    else if (peer instanceof ScalarVal &&
      peer.type === Number &&
      this.peg === peer.peg) {
      return this
    }
    else {
      return super.unify(peer, ctx)
    }
  }
}


class StringVal extends ScalarVal<string> {
  constructor(peg: string, ctx?: Context) {
    super(peg, String, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }
  get canon() {
    return JSON.stringify(this.peg)
  }

}


class BooleanVal extends ScalarVal<boolean> {
  constructor(peg: boolean, ctx?: Context) {
    super(peg, Boolean, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }

  static TRUE = new BooleanVal(true, new Context({ vc: 1, root: TOP }))
  static FALSE = new BooleanVal(false, new Context({ vc: 2, root: TOP }))
}







export {
  Integer,
  ScalarTypeVal,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
}
