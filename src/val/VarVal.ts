/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  descErr
} from '../err'

import {
  Context,
} from '../unify'



import { StringVal } from './StringVal'
import { NilVal } from './NilVal'
import { RefVal } from './RefVal'
import { FeatureVal } from './FeatureVal'



// TODO: KEY, SELF, PARENT are reserved names - error

class VarVal extends FeatureVal {
  isVarVal = true

  constructor(
    spec: {
      peg: string | Val
    },
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  unify(peer: Val, ctx: Context): Val {
    let out: Val

    let nameVal

    if (this.peg.isVal) {
      // $.a.b.c - convert path to absolute
      if (this.peg instanceof RefVal) {
        this.peg.absolute = true
        nameVal = this.peg
      }
      else {
        nameVal = this.peg.unify(peer)
      }
    }
    else {
      // TODO: how to pass row+col?
      nameVal = new StringVal({ peg: '' + this.peg }, ctx)
    }

    if (!(nameVal instanceof RefVal) && DONE === nameVal.dc) {
      if (nameVal instanceof StringVal) {
        out = ctx.var[nameVal.peg]
        if (null == out) {
          out = NilVal.make(ctx, 'var[' + nameVal.peg + ']', this, peer)
        }
      }
      else {
        out = NilVal.make(ctx, 'var[' + typeof nameVal + ']', this, peer)
      }
    }
    else {
      out = nameVal
    }

    return out
  }


  same(peer: Val): boolean {
    return null == peer ? false : peer instanceof VarVal && this.peg === peer.peg
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as VarVal)
    return out
  }


  get canon() {
    return '$' + (this.peg?.isVal ? this.peg.canon : '' + this.peg)
  }


  gen(ctx?: Context) {
    // Unresolved var cannot be generated, so always an error.
    let nil = NilVal.make(
      ctx,
      'var',
      this,
      undefined
    )

    // TODO: refactor to use Site
    nil.path = this.path
    nil.url = this.url
    nil.row = this.row
    nil.col = this.col

    descErr(nil, ctx)

    if (ctx) {
      // ctx.err.push(nil)
      ctx.adderr(nil)
    }
    else {
      throw new Error(nil.msg)
    }

    return undefined
  }
}


export {
  VarVal,
}
