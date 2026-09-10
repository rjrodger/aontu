/* Copyright (c) 2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { FuncBaseVal } from './FuncBaseVal'
import { arith } from './arith'
import type { ArithOp } from './arith'


class ArithFuncVal extends FuncBaseVal {
  isArithFunc = true

  // The operation this call performs. Carried on the instance because
  // `make` rebuilds the value during residuation and must rebuild the
  // SAME function.
  op: ArithOp

  constructor(
    spec: ValSpec,
    ctx: AontuContext | undefined,
    op: ArithOp
  ) {
    super(spec, ctx)
    this.op = op
  }


  // Rebuilt as its own class, carrying its own op: residuation must not
  // turn a `sub` into a bare arithmetic call with no operation.
  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new (this.constructor as any)(spec, undefined, this.op)
  }

  funcname() {
    return this.op
  }


  resolve(ctx: AontuContext | undefined, args: Val[]) {
    return this.place(arith(ctx, this.op, this, args?.[0], args?.[1]))
  }


}


class AddFuncVal extends ArithFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'add') }
}

class SubFuncVal extends ArithFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'sub') }
}

class MulFuncVal extends ArithFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'mul') }
}

class DivFuncVal extends ArithFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'div') }
}

class ModFuncVal extends ArithFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'mod') }
}

class RemFuncVal extends ArithFuncVal {
  constructor(spec: ValSpec, ctx?: AontuContext) { super(spec, ctx, 'rem') }
} /* node:coverage ignore next 11 */


export {
  ArithFuncVal,
  AddFuncVal,
  SubFuncVal,
  MulFuncVal,
  DivFuncVal,
  ModFuncVal,
  RemFuncVal,
}
