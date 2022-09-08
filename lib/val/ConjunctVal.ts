/* Copyright (c) 2021-2022 Richard Rodger, MIT License */


import type {
  Val,
  ValMap,
  ValList,
} from '../type'

import {
  DONE,
  TOP,
} from '../type'

import {
  ValBase,
} from '../val/ValBase'

import {
  Nil,
} from '../val/Nil'

import {
  Context,
} from '../unify'


import {
  Site
} from '../lang'


import {
  unite
} from '../op/op'




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
    let done = true

    // Unify each term of conjunct against peer
    let upeer: Val[] = []

    for (let vI = 0; vI < this.peg.length; vI++) {
      // upeer[vI] = this.peg[vI].unify(peer, ctx)
      upeer[vI] = unite(ctx, this.peg[vI], peer)
      done = done && DONE === upeer[vI].done
      // // console.log('Ca', vI, this.peg[vI].canon, peer.canon, upeer[vI].canon)

      if (upeer[vI] instanceof Nil) {
        return Nil.make(
          ctx,
          '&peer[' + upeer[vI].canon + ',' + peer.canon + ']',
          this.peg[vI],
          peer
        )
      }
    }

    // // console.log('Cb', upeer.map(x => x.canon))


    upeer = norm(upeer)


    // TODO: FIX: conjuncts get replicated inside each other
    // 1&/x => CV[CV[1&/x]]

    // Unify each term of conjunct against following sibling,
    // reducing to smallest conjunct or single val
    let outvals: Val[] = 0 < upeer.length ? [upeer[0]] : []

    let oI = 0
    for (let uI = 1; uI < upeer.length; uI++) {
      // // console.log('Cu', oI, uI, outvals.map(x => x.canon))

      if (outvals[oI] instanceof ConjunctVal) {
        outvals.splice(oI, 0, ...outvals[oI].peg)
        oI += outvals[oI].peg.length
        done = false
      }
      else {
        outvals[oI] = null == outvals[oI] ? upeer[uI] :
          //outvals[oI].unify(upeer[uI], ctx)
          unite(ctx, outvals[oI], upeer[uI])
        done = done && DONE === outvals[oI].done

        // Conjuct fails
        if (outvals[oI] instanceof Nil) {
          return outvals[oI]

          /*
          return Nil.make(
            ctx,
            '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']',
            outvals[oI],
            upeer[uI]
          )
          */
        }
      }
    }

    // // console.log('Cc', outvals.map(x => x.canon), outvals)

    let out: Val

    //let why = ''

    if (0 === outvals.length) {
      //out = Nil.make(ctx, '&empty', this)

      // Empty conjuncts evaporate.
      out = TOP
      //why += 'A'
    }

    // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
    else if (1 === outvals.length) {
      out = outvals[0]
      //why += 'B'
    }
    else {
      out = new ConjunctVal(outvals, ctx)
      //why += 'C'
    }

    // // console.log('Cd', why, out.peg)

    out.done = done ? DONE : this.done + 1

    return out
  }

  // TODO: need a well-defined val order so conjunt canon is always the same
  get canon() {
    return this.peg.map((v: Val) => v.canon).join('&')
  }

  gen(ctx?: Context) {
    if (0 < this.peg.length) {

      // Default is just the first term - does this work?
      // TODO: maybe use a PrefVal() ?
      let v: Val = this.peg[0]


      let out = undefined
      if (undefined !== v && !(v instanceof Nil)) {
        out = v.gen(ctx)
      }
      return out
    }

    return undefined
  }
}


function norm(terms: Val[]): Val[] {
  // console.log('CJ norm', terms.map((t: Val) => t.canon))

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
