/* Copyright (c) 2021-2025 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { StringVal } from '../val/StringVal'
import { ConjunctVal } from '../val/ConjunctVal'



import { FuncBaseVal } from './FuncBaseVal'


class KeyFuncVal extends FuncBaseVal {
  isKeyFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    // this.dc = DONE
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new KeyFuncVal(spec)
  }

  funcname() {
    return 'key'
  }


  unify(peer: Val, ctx: AontuContext): Val {
    // TODO: this delay makes keys in spreads and refs work, but it is a hack - find a better way.
    let out: Val = this

    if (ctx.cc < 3) {
      this.notdone()

      if (peer.isTop || (peer.id === this.id)) {
        // TODO: clone needed to avoid triggering unify_cycle - find a better way
        out = this.clone(ctx)
      }
      else if (peer.isNil) {
        out = peer
      }
      else {
        if (
          peer.isKeyFunc
          && peer.path.join('.') === this.path.join('.')
          && peer.peg?.[0]?.peg === this.peg?.[0]?.peg
        ) {
          out = this
        }
        else {
          out = new ConjunctVal({ peg: [this, peer] }, ctx)
        }
      }
    }
    else {
      out = super.unify(peer, ctx)
    }

    return out
  }


  resolve(_ctx: AontuContext, _args: Val[]) {
    let out: Val = this

    // if (!this.mark.type && !this.mark.hide) {
    let move = this.peg?.[0]?.peg
    move = isNaN(move) ? 1 : +move
    const key = this.path[this.path.length - (1 + move)] ?? ''
    // console.log('KEY', this.path, move, key)

    out = new StringVal({ peg: key })
    // }

    return out
  }


  gen(_ctx: AontuContext): any {
    return undefined
  }

}


export {
  KeyFuncVal,
}
