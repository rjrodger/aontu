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
  unite
} from '../op/op'


import { TOP } from '../val'
import { DisjunctVal } from '../val/DisjunctVal'
import { ListVal } from '../val/ListVal'
import { MapVal } from '../val/MapVal'
import { Nil } from '../val/Nil'
import { PrefVal } from '../val/PrefVal'
import { RefVal } from '../val/RefVal'
import { ValBase } from '../val/ValBase'


// TODO: move main logic to op/conjunct
class ConjunctVal extends ValBase {
  constructor(peg: Val[], ctx?: Context) {
    super(peg, ctx)
  }

  // NOTE: mutation!
  append(peer: Val): ConjunctVal {
    this.peg.push(peer)
    return this
  }

  unify(peer: Val, ctx: Context): Val {
    // console.log('CONJUNCT UNIFY', this.done, this.path.join('.'), this.canon,
    //   'P', peer.top || peer.constructor.name,
    //  peer.done, peer.path.join('.'), peer.canon)


    const mark = (Math.random() * 1e7) % 1e6 | 0
    // console.log('CONJUNCT unify', mark, this.done, this.canon, 'peer=', peer.canon)

    let done = true

    // Unify each term of conjunct against peer
    let upeer: Val[] = []


    // console.log('CJa' + mark, this.peg.map((p: Val) => p.canon), 'p=', peer.canon)
    for (let vI = 0; vI < this.peg.length; vI++) {
      upeer[vI] = unite(ctx, this.peg[vI], peer, 'cj-own' + mark)

      // let prevdone = done
      done = done && (DONE === upeer[vI].done)

      // console.log('CONJUNCT pud', mark, vI, done, prevdone, '|', upeer[vI].done, upeer[vI].canon)

      if (upeer[vI] instanceof Nil) {
        return Nil.make(
          ctx,
          '&peer[' + upeer[vI].canon + ',' + peer.canon + ']',
          this.peg[vI],
          peer
        )
      }
    }

    upeer = norm(upeer)
    // console.log('CONJUNCT upeer', mark, done, upeer.map(p => p.canon))

    // Unify terms against each other

    let outvals: Val[] = []
    let val: Val

    // let mark = Math.random()

    // console.log('CJ upeer', mark, upeer.map(v => v.canon))

    let t0 = upeer[0]

    next_term:
    for (let pI = 0; pI < upeer.length; pI++) {
      // let t0 = upeer[pI]
      // console.log('CJ TERM t0', pI, t0.done, t0.canon)

      if (DONE !== t0.done) {
        let u0 = unite(ctx, t0, TOP, 'cj-peer-t0')

        if (
          DONE !== u0.done

          // Maps and Lists are still unified so that path refs will work
          // TODO: || ListVal - test!
          && !(
            u0 instanceof MapVal
            || u0 instanceof RefVal
          )
        ) {

          // console.log('CONJUNCT PUSH A', u0.id, u0.canon)
          outvals.push(u0)
          // console.log('CJ outvals A', outvals.map(v => v.canon))
          continue next_term
        }
        else {
          t0 = u0
        }
      }

      let t1 = upeer[pI + 1]
      // console.log('CJ TERM t1', pI + 1, t1?.done, t1?.canon)

      if (null == t1) {
        // console.log('CONJUNCT PUSH B', t0.canon)
        outvals.push(t0)
        // console.log('CJ outvals B', outvals.map(v => v.canon))
      }

      // Can't unite with a RefVal, unless also a RefVal with same path.
      else if (t0 instanceof RefVal && !(t1 instanceof RefVal)) {
        // console.log('CONJUNCT PUSH D', t0.canon)
        outvals.push(t0)
        t0 = t1
        // console.log('CJ outvals C', outvals.map(v => v.canon))
      }

      else {
        val = unite(ctx, t0, t1, 'cj-peer-t0t1')
        done = done && DONE === val.done

        // Unite was just a conjunt anyway, so discard.
        if (val instanceof ConjunctVal) {
          // if (t0.id === val.peg[0].id) {
          // val = t0
          outvals.push(t0)
          t0 = t1
          // console.log('CJ outvals D', outvals.map(v => v.canon))
          //}
        }
        else if (val instanceof Nil) {
          return val
        }
        else {
          t0 = val
        }
        // TODO: t0 should become this to avoid unnecessary repasses
        // console.log('CONJUNCT PUSH C', val.canon)
        // outvals.push(val)

        // pI++
      }
    }

    // console.log('CJ outvals', mark, outvals.map(v => v.canon))

    let out: Val

    if (0 === outvals.length) {

      // Empty conjuncts evaporate.
      out = TOP
    }

    // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
    else if (1 === outvals.length) {
      out = outvals[0]
    }
    else {
      out = new ConjunctVal(outvals, ctx)
    }

    out.done = done ? DONE : this.done + 1

    // console.log('CJ out', out.done, out.canon)

    return out
  }


  clone(ctx?: Context): Val {
    let out = (super.clone(ctx) as MapVal)
    out.peg = this.peg.map((entry: Val) => entry.clone(ctx))
    return out
  }


  // TODO: need a well-defined val order so conjunt canon is always the same
  get canon() {
    // return '  C( ' + this.peg.map((v: Val) => v.canon).join('&') + ' )  '
    return this.peg.map((v: Val) => v.canon).join('&')
  }


  gen(ctx?: Context) {
    throw new Error('ConjuntVal-gen')

    // if (0 < this.peg.length) {

    //   // Default is just the first term - does this work?
    //   // TODO: maybe use a PrefVal() ?
    //   let v: Val = this.peg[0]


    //   let out = undefined
    //   if (undefined !== v && !(v instanceof Nil)) {
    //     out = v.gen(ctx)
    //   }
    //   return out
    // }
    // else {
    //   throw new Error('ConjuntVal-gen')
    // }

    // return undefined
  }
}


// Normalize Conjuct:
// - flatten child conjuncts
function norm(terms: Val[]): Val[] {

  let expand: Val[] = []
  for (let tI = 0, pI = 0; tI < terms.length; tI++, pI++) {
    if (terms[tI] instanceof ConjunctVal) {
      expand.push(...terms[tI].peg)
      pI += terms[tI].peg.length - 1
    }
    else {
      expand[pI] = terms[tI]
    }
  }

  return expand
}


export {
  norm,
  ConjunctVal,
}
