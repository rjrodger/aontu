/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



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
  Site
} from '../lang'


import {
  unite
} from '../op/op'



import { TOP } from '../val'
import { ConjunctVal } from '../val/ConjunctVal'
import { DisjunctVal } from '../val/DisjunctVal'
import { ListVal } from '../val/ListVal'
import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'


class PrefVal extends ValBase {
  pref: Val
  constructor(peg: any, pref?: any, ctx?: Context) {
    super(peg, ctx)
    this.pref = pref || peg
  }

  // PrefVal unify always returns a PrefVal
  // PrefVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: Context): Val {
    let done = true
    let out: Val

    if (peer instanceof PrefVal) {
      out = new PrefVal(
        unite(ctx, this.peg, peer.peg, 'Pref000'),
        unite(ctx, this.pref, peer.pref, 'Pref010'),
        ctx
      )

    }
    else {
      out = new PrefVal(
        // TODO: find a better way to drop Nil non-errors
        unite(ctx?.clone({ err: [] }), this.peg, peer, 'Pref020'),
        unite(ctx?.clone({ err: [] }), this.pref, peer, 'Pref030'),
        ctx
      )
    }

    done = done && DONE === out.peg.done &&
      (null != (out as PrefVal).pref ? DONE === (out as PrefVal).pref.done : true)

    if (out.peg instanceof Nil) {
      out = (out as PrefVal).pref
    }
    else if ((out as PrefVal).pref instanceof Nil) {
      out = out.peg
    }

    out.done = done ? DONE : this.done + 1

    return out
  }


  same(peer: Val): boolean {
    if (null == peer) {
      return false
    }

    let pegsame = (this.peg === peer.peg) ||
      (this.peg instanceof ValBase && this.peg.same(peer.peg))

    let prefsame = peer instanceof PrefVal &&
      ((this.pref === peer.pref) ||
        (this.pref instanceof ValBase && this.pref.same(peer.pref)))

    return pegsame && prefsame
  }


  get canon() {
    return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
  }

  gen(ctx?: Context) {
    let val = !(this.pref instanceof Nil) ? this.pref :
      !(this.peg instanceof Nil) ? this.peg :
        undefined

    return undefined === val ? undefined : val.gen(ctx)
  }
}



export {
  PrefVal,
}
