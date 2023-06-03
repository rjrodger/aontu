/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


/* TODO

   $SELF.a - path starting at self
   $PARENT.b === .b - sibling

   implement $ as a prefix operator
   this allows "$AString" to be used for literal part names
*/



import type {
  Val,
} from '../type'

import {
  DONE,
} from '../type'

import {
  Context,
} from '../unify'



import {
  unite
} from '../op/op'



import {
  TOP,
  StringVal,
} from '../val'

import { ConjunctVal } from '../val/ConjunctVal'
import { DisjunctVal } from '../val/DisjunctVal'
import { ListVal } from '../val/ListVal'
import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'



// TODO: KEY, SELF, PARENT are reserved names - error

class VarVal extends ValBase {

  constructor(peg: string | Val, ctx?: Context) {
    super(peg, ctx)
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
      nameVal = new StringVal('' + this.peg, ctx)
    }

    if (!(nameVal instanceof RefVal) && DONE === nameVal.done) {
      if (nameVal instanceof StringVal) {
        out = ctx.var[nameVal.peg]
        if (null == out) {
          out = Nil.make(ctx, 'var[' + nameVal.peg + ']', this, peer)
        }
      }
      else {
        out = Nil.make(ctx, 'var[' + typeof nameVal + ']', this, peer)
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


  clone(ctx?: Context): Val {
    let out = (super.clone(ctx) as VarVal)
    return out
  }


  get canon() {
    return '$' + (this.peg?.isVal ? this.peg.canon : '' + this.peg)
  }


  gen(ctx?: Context) {
    if (ctx) {
      ctx.err.push(Nil.make(
        ctx,
        'var',
        this.peg,
        undefined,
      ))
    }

    throw new Error('REF-var ' + this.peg)

    return undefined
  }
}


export {
  VarVal,
}
