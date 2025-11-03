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
import { FeatureVal } from './FeatureVal'
import { NullVal } from './NullVal'
import { BooleanVal } from './BooleanVal'
import { NumberVal } from './NumberVal'
import { IntegerVal } from './IntegerVal'


import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


// TODO: KEY, SELF, PARENT are reserved names - error

class VarVal extends FeatureVal {
  isVar = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  unify(peer: Val, ctx: Context, explain?: any[]): Val {
    const te = ctx.explain && explainOpen(ctx, explain, 'Var', this, peer)

    let out: Val

    let nameVal

    if (this.peg.isVal) {
      // $.a.b.c - convert path to absolute
      // if (this.peg instanceof RefVal) {
      if (this.peg.isRef) {
        this.peg.absolute = true
        nameVal = this.peg
      }
      else {
        nameVal = this.peg.unify(peer, ctx, ec(te, 'PEG'))
      }
    }
    else {
      // TODO: how to pass row+col?
      nameVal = new StringVal({ peg: '' + this.peg }, ctx)
    }

    // if (!(nameVal instanceof RefVal) && DONE === nameVal.dc) {
    if (!(nameVal.isRef) && DONE === nameVal.dc) {
      if (nameVal instanceof StringVal) {
        let found = ctx.var[nameVal.peg]
        if (undefined === found) {
          out = NilVal.make(ctx, 'unknown_var', this, peer)
        }

        // TODO: support complex values
        const ft = typeof found
        if (null === found) {
          out = this.place(new NullVal({ peg: null }))
        }
        else if ('string' === ft) {
          out = new StringVal({ peg: found })
        }
        else if ('boolean' === ft) {
          out = new BooleanVal({ peg: found })
        }
        else if ('number' === ft) {
          out = Number.isInteger(found) ?
            new IntegerVal({ peg: found }) :
            new NumberVal({ peg: found })
        }
        else if ('object' === ft && found.isVal) {
          out = found
        }
        else {
          out = NilVal.make(ctx, 'invalid_var_kind', this, peer)
        }
      }
      else {
        out = NilVal.make(ctx, 'var[' + typeof nameVal + ']', this, peer)
      }
    }
    else {
      out = nameVal
    }

    explainClose(te, out)

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
