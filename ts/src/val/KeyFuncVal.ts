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
    //
    // The level is read only from an argument that IS a JS number.
    //
    // This used to be `isNaN(move) ? 1 : +move`, with the COERCING global
    // isNaN -- which is ToNumber, and ToNumber THROWS for a bigint (the
    // peg of a biginteger, `key(0d1)`) and for the null-prototype object
    // a map's peg is (`key({})`), since neither has a toString or valueOf
    // to call. The exception escaped into unify's catch-all and surfaced
    // as an opaque [aontu/internal], which is never a correct answer:
    // upper()/lower() carry a comment recording exactly this fix, and
    // key() was missed in that sweep.
    //
    // Anything that is not a number falls back to the documented default
    // of 1, which is what the Go port already did. What a non-integer
    // level should MEAN is a separate, open contract question -- refusing
    // it in both ports is the likelier answer than either current
    // behaviour -- and this deliberately does not pre-empt it. It only
    // stops the crash and makes the ports agree.
    const arg = this.peg?.[0]?.peg
    const move = 'number' === typeof arg && !Number.isNaN(arg) ? arg : 1
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
