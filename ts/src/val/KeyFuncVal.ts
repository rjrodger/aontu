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
import { makeNilErr } from '../err'


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


  resolve(ctx: AontuContext, _args: Val[]) {
    let out: Val = this

    // if (!this.mark.type && !this.mark.hide) {
    //
    // THE LEVEL MUST BE AN INTEGER, OR ABSENT.
    //
    // A level is an index into the path (0 the own key, the default 1 the
    // parent), so the argument is an integer or it is a mistake. Both
    // exact integer leaves qualify -- `integer` and `biginteger` -- and
    // everything else is refused rather than silently meaning "parent",
    // which is what made a mistyped level undetectable.
    //
    // This also removes a crash. The test used to be
    // `isNaN(move) ? 1 : +move` with the COERCING global isNaN, which is
    // ToNumber, and ToNumber THROWS for a bigint (a biginteger's peg) and
    // for the null-prototype object a map's peg is -- neither has a
    // toString or valueOf to call. The exception escaped into unify's
    // catch-all and surfaced as an opaque [aontu/internal].
    const argval: any = this.peg?.[0]
    let move = 1

    if (null != argval) {
      if (argval.isInteger) {
        move = argval.peg as number
      }
      else if (argval.isBigInteger) {
        // A level far outside the path simply misses, exactly as an
        // out-of-range plain integer already does, so Number() here needs
        // no bound of its own.
        move = Number(argval.peg as bigint)
      }
      else {
        return makeNilErr(ctx, 'key_level', this)
      }
    }

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
