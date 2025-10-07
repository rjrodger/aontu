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
} from '../unify'

import {
  Nil,
  StringVal,
} from '../val'



import { FuncBaseVal } from './FuncBaseVal'


class KeyFuncVal extends FuncBaseVal {
  isKeyFuncVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    // this.dc = DONE
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new KeyFuncVal(spec)
  }

  funcname() {
    return 'key'
  }


  /*
  unify(peer: Val, ctx: Context): Val {
    let out: Val = this

    if (
      this.id === peer.id
      || peer.isTop) {
      // self
    }

    else if (peer.isNil) {
      out = peer
    }

    else if (
      (peer as any).isScalarTypeVal
      && peer.peg === String
    ) {
      return this
    }

    else {
      out = Nil.make(ctx, 'key-func', this, peer)

      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path
    }

    return out
  }
  */


  resolve(ctx: Context, args: Val[]) {
    let out: Val = this

    if (!this.type) {
      let move = this.peg?.[0]?.peg
      move = isNaN(move) ? 1 : +move
      const key = this.path[this.path.length - (1 + move)] ?? ''

      // console.log('KEYPATH', this.path, move, 'k=', key)
      // return key
      out = new StringVal({ peg: key })
    }

    console.log('KEYFUNC', this.path, this.canon, out.canon)
    return out
  }


  gen(ctx?: Context): any {
    return undefined

    /*
    if (null == ctx) {
      return undefined
    }

    let move = this.peg?.[0]?.peg
    move = isNaN(move) ? 1 : +move
    const key = this.path[this.path.length - (1 + move)] ?? ''

    // console.log('KEYPATH', this.path, move, 'k=', key)
    return key
    */
  }

}


export {
  KeyFuncVal,
}
