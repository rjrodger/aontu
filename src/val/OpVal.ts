/* Copyright (c) 2024 Richard Rodger, MIT License */


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

import {
  unite
} from '../op/op'

import {
  TOP,
} from '../val'


import { ConjunctVal } from '../val/ConjunctVal'
import { Nil } from '../val/Nil'
import { ValBase } from '../val/ValBase'





class OpVal extends ValBase {
  isOpVal = true

  constructor(
    spec: {
      peg: any[],
    },
    ctx?: Context
  ) {
    super(spec, ctx)
    this.peg = []

    for (let pI = 0; pI < spec.peg.length; pI++) {
      this.append(spec.peg[pI])
    }
  }


  append(part: any) {
    this.peg.push(part)
  }


  unify(peer: Val, ctx: Context): Val {
    let out: Val = this

    if (this.id !== peer.id) {
      let result: Val | undefined = null == ctx ? this : this.operate(ctx)

      result = result || this

      if (null == result && this.canon === peer.canon) {
        out = this
      }
      else if (result instanceof OpVal) {
        if (TOP === peer) {
          out = this
        }
        else if (peer instanceof Nil) {
          out = Nil.make(ctx, 'op[' + this.peg + ']', this, peer)
        }

        else if (this.canon === peer.canon) {
          out = this
        }

        else {
          this.dc = DONE === this.dc ? DONE : this.dc + 1
          out = new ConjunctVal({ peg: [this, peer] }, ctx)
        }
      }
      else {
        out = unite(ctx, result, peer, 'op')
      }

      out.dc = DONE === out.dc ? DONE : this.dc + 1
    }

    return out
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.peg === peer.peg
  }


  clone(ctx: Context, _spec?: ValSpec): Val {
    let out = (super.clone(ctx, {
      peg: this.peg,
    }) as OpVal)
    return out
  }


  operate(ctx: Context): Val | undefined {
    this.peg = this.peg.map((v: any) => v.isRefVal ? v.unify(TOP, ctx) : v)
    return undefined
  }



  get canon() {
    return ''
  }


  gen(ctx?: Context) {
    // Unresolved op cannot be generated, so always an error.
    let nil = Nil.make(
      ctx,
      'op',
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
  OpVal,
}
