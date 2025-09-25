/* Copyright (c) 2021-2023 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
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




// import { TOP } from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
import { PrefVal } from '../val/PrefVal'
// import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'




// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase {
  isDisjunctVal = true
  isBinaryOp = true

  // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
  constructor(
    spec: {
      peg: Val[]
    },
    ctx?: Context,
    _sites?: Site[]
  ) {
    super(spec, ctx)
  }

  // NOTE: mutation!
  append(peer: Val): DisjunctVal {
    this.peg.push(peer)
    return this
  }

  unify(peer: Val, ctx: Context): Val {
    let done = true

    let oval: Val[] = []

    // Conjunction (&) distributes over disjunction (|)
    for (let vI = 0; vI < this.peg.length; vI++) {
      //oval[vI] = this.peg[vI].unify(peer, ctx)
      oval[vI] = unite(ctx, this.peg[vI], peer)
      done = done && DONE === oval[vI].done
    }

    // Remove duplicates, and normalize
    if (1 < oval.length) {
      for (let vI = 0; vI < oval.length; vI++) {
        if (oval[vI] instanceof DisjunctVal) {
          oval.splice(vI, 1, ...oval[vI].peg)
        }
      }

      // TODO: not an error Nil!
      let remove = new Nil()
      for (let vI = 0; vI < oval.length; vI++) {
        for (let kI = vI + 1; kI < oval.length; kI++) {
          if (oval[kI].same(oval[vI])) {
            oval[kI] = remove
          }
        }
      }

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
      out = new DisjunctVal({ peg: oval }, ctx)
    }

    out.done = done ? DONE : this.done + 1

    return out
  }


  clone(spec?: ValSpec, ctx?: Context): Val {
    let out = (super.clone(spec, ctx) as DisjunctVal)
    out.peg = this.peg.map((entry: Val) => entry.clone(null, ctx))
    return out
  }


  get canon() {
    return this.peg.map((v: Val) => {
      return (v as any).isBinaryOp && Array.isArray(v.peg) && 1 < v.peg.length ?
        '(' + v.canon + ')' : v.canon
    }).join('|')
  }


  gen(ctx?: Context) {

    // TODO: this is not right - unresolved Disjuncts eval to undef
    if (0 < this.peg.length) {

      let vals = this.peg.filter((v: Val) => v instanceof PrefVal)

      vals = 0 === vals.length ? this.peg : vals

      let val = vals[0]

      for (let vI = 1; vI < this.peg.length; vI++) {
        let valnext = val.unify(this.peg[vI], ctx)
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
