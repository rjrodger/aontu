/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE
} from '../type'

import {
  Context,
  unite,
} from '../unify'

import {
  TOP,
  NilVal,
  ConjunctVal,
} from '../val'

import { FeatureVal } from '../val/FeatureVal'


class FuncBaseVal extends FeatureVal {
  isFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    // console.log('FBV', this.id, this.constructor.name, this.peg?.[0]?.canon)
  }


  make(ctx: Context, _spec: ValSpec): Val {
    return NilVal.make(ctx, 'func:' + this.funcname(), this, undefined, 'make')
  }


  unify(peer: Val, ctx: Context): Val {
    let why = ''

    // console.log('FBV', this.id, peer.id, this.constructor.name, this.type, this.peg?.canon)

    if (this.id === peer.id) {
      return this
    }

    let out: Val
    let pegdone = true
    let newpeg: Val[] = []
    let newtype = this.type


    if (this.type && peer.isTop) {
      this.dc = DONE
      return this
    }

    for (let arg of this.peg) {
      // console.log('FUNCBASE-UNIFY-PEG-A', arg.canon)

      let newarg = arg
      if (!arg.done) {
        newarg = arg.unify(TOP, ctx)
        newtype = newtype || newarg.type
        // console.log('FUNCBASE-UNIFY-PEG-B', arg.canon, '->', newarg.canon)
      }
      pegdone &&= arg.done
      newpeg.push(newarg)
    }

    if (pegdone) {
      const resolved = this.resolve(ctx, newpeg)
      // console.log('RESOLVED:', resolved?.canon)
      const unified = unite(ctx, resolved, peer, 'func-' + this.funcname() + '/' + this.id)
      out = unified
      out.type = this.type || unified.type

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path

      why += 'pegdone'
    }
    else if (peer.isTop) {
      this.notdone()
      out = this.make(ctx, { peg: newpeg, type: newtype })

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
      out = new ConjunctVal({ peg: [this, peer], type: newtype }, ctx)

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path

      why += 'defer'
    }

    // console.log('FUNC-UNIFY-OUT', this.funcname(), why, peer.canon, 'O=', out.dc, out.canon, out.id)

    return out
  }



  get canon() {
    return '' +
      // (this.type ? '<type>' : '') +
      // (this.done ? '<done>' : '') +
      // (this.id + '=') +
      this.funcname() + '(' + (this.peg.map((p: any) => p.canon).join(',')) + ')'
  }


  funcname() {
    return 'func'
  }


  resolve(ctx: Context | undefined, _args: Val[]): Val {
    return NilVal.make(ctx, 'func:' + this.funcname(), this, undefined, 'resolve')
  }

}


export {
  FuncBaseVal,
}
