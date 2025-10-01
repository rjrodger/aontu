/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
} from '../unify'

import {
  unite
} from '../op/op'

import {
  TOP,
  Nil,
  ConjunctVal,
} from '../val'

import { ValBase } from '../val/ValBase'


class FuncValBase extends ValBase {
  isFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(ctx: Context, _spec: ValSpec): Val {
    return Nil.make(ctx, 'func:' + this.funcname(), this, undefined, 'make')
  }


  unify(peer: Val, ctx: Context): Val {
    let why = ''

    if (this.id === peer.id) {
      return this
    }

    let out: Val
    let pegdone = true
    let newpeg: Val[] = []
    for (let arg of this.peg) {
      if (!arg.done) {
        arg = arg.unify(TOP, ctx)
      }
      pegdone &&= arg.done
      newpeg.push(arg)
    }

    if (pegdone) {
      const resolved = this.resolve(ctx, newpeg)
      const unified = unite(ctx, resolved, peer, 'func-floor/' + this.id)
      out = unified

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path

      why += 'pegdone'
    }
    else if (peer.isTop) {
      this.notdone()
      out = this.make(ctx, { peg: newpeg })

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path

      why += 'top'
    }
    else if (peer.isNil) {
      this.notdone()
      out = peer
      why += 'nil'
    }
    else {
      // this.dc = DONE === this.dc ? DONE : this.dc + 1
      this.notdone()
      out = new ConjunctVal({ peg: [this, peer] }, ctx)

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path

      why += 'defer'
    }

    // console.log('FUNC-OUT', this.funcname(), why, out.dc, out.canon, out.id)

    return out
  }



  get canon() {
    return this.funcname() + '(' + (this.peg.map((p: any) => p.canon).join(',')) + ')'
  }


  funcname() {
    return 'func'
  }


  resolve(ctx: Context | undefined, _args: Val[]): Val {
    return Nil.make(ctx, 'func:' + this.funcname(), this, undefined, 'resolve')
  }

}


export {
  FuncValBase,
}
