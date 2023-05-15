/* Copyright (c) 2021-2022 Richard Rodger, MIT License */


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


import {
  ValBase,
} from '../val/ValBase'


import { Nil } from './Nil'
import { PrefVal } from './PrefVal'






// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase {
  // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
  constructor(peg: Val[], ctx?: Context, _sites?: Site[]) {
    super(peg, ctx)
  }

  // NOTE: mutation!
  append(peer: Val): DisjunctVal {
    this.peg.push(peer)
    return this
  }

  unify(peer: Val, ctx: Context): Val {
    let done = true

    let oval: Val[] = []

    // console.log('oval', this.canon, peer.canon)

    // Conjunction (&) distributes over disjunction (|)
    for (let vI = 0; vI < this.peg.length; vI++) {
      //oval[vI] = this.peg[vI].unify(peer, ctx)
      oval[vI] = unite(ctx, this.peg[vI], peer)
      // console.log('ovalA', vI, this.peg[vI].canon, peer.canon, oval[vI].canon)

      done = done && DONE === oval[vI].done
    }

    // console.log('ovalB', oval.map(v => v.canon))

    // Remove duplicates, and normalize
    if (1 < oval.length) {
      for (let vI = 0; vI < oval.length; vI++) {
        if (oval[vI] instanceof DisjunctVal) {
          oval.splice(vI, 1, ...oval[vI].peg)
        }
      }

      //console.log('ovalC', oval.map(v => v.canon))

      // TODO: not an error Nil!
      let remove = new Nil()
      for (let vI = 0; vI < oval.length; vI++) {
        for (let kI = vI + 1; kI < oval.length; kI++) {
          if (oval[kI].same(oval[vI])) {
            oval[kI] = remove
          }
        }
      }

      //console.log('ovalD', oval.map(v => v.canon))

      oval = oval.filter(v => !(v instanceof Nil))
    }

    let out: Val

    if (1 == oval.length) {
      out = oval[0]
    }
    else if (0 == oval.length) {
      return Nil.make(ctx, '|:empty', this)
    }
    else {
      out = new DisjunctVal(oval, ctx)
    }

    out.done = done ? DONE : this.done + 1

    return out
  }
  get canon() {
    return this.peg.map((v: Val) => v.canon).join('|')
  }
  gen(ctx?: Context) {

    // TODO: this is not right - unresolved Disjuncts eval to undef
    if (0 < this.peg.length) {

      let vals = this.peg.filter((v: Val) => v instanceof PrefVal)

      vals = 0 === vals.length ? this.peg : vals

      // console.log(vals.map((m: any) => m.canon))

      let val = vals[0]

      for (let vI = 1; vI < this.peg.length; vI++) {
        // val = val.unify(this.peg[vI], ctx)
        let valnext = val.unify(this.peg[vI], ctx)
        // console.log(valnext.canon, val.canon, this.peg[vI].canon, val, this.peg[vI])
        val = valnext
      }

      return val.gen(ctx)
    }

    return undefined
  }
}





export {
  DisjunctVal,
}
