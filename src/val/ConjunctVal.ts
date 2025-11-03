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
  unite,
} from '../unify'

import {
  propagateMarks,
} from '../utility'


import { NilVal } from './NilVal'
import { JunctionVal } from './JunctionVal'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'


import {
  top
} from './valutil'


const CONJUNCT_ORDERING: Record<string, number> = {
  PrefVal: 30000,
  RefVal: 32500,
  DisjunctVal: 35000,
  ConjunctVal: 40000,
  Any: 99999
}



// TODO: move main logic to op/conjunct
class ConjunctVal extends JunctionVal {
  isConjunct = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    this.mark.type = !!spec.mark?.type
    this.mark.hide = !!spec.mark?.hide
    this.peg = (Array.isArray(this.peg) ? this.peg : [])
      .filter((p: Val) => null != p && p.isVal)
    this.peg?.map((v: Val) => {
      propagateMarks(this, v)
      return v
    })
    // console.log('CONJUNCT-ctor', this.peg.map((v: Val) => v.canon))
  }

  // NOTE: mutation!
  append(peer: Val): ConjunctVal {
    super.append(peer)
    propagateMarks(this, peer)
    return this
  }


  unify(peer: Val, ctx: Context, trace?: any[]): Val {
    peer = peer ?? top()

    const te = ctx.explain && explainOpen(ctx, trace, 'Conjunct', this, peer)

    let done = true

    this.peg = norm(this.peg)


    // Unify each term of conjunct against peer
    let upeer: Val[] = []

    let newtype = this.mark.type || peer.mark.type
    let newhide = this.mark.hide || peer.mark.hide

    for (let vI = 0; vI < this.peg.length; vI++) {
      newtype = this.peg[vI].mark.type || newtype
      newhide = this.peg[vI].mark.hide || newhide
    }

    for (let vI = 0; vI < this.peg.length; vI++) {
      this.peg[vI].mark.type = newtype
      this.peg[vI].mark.hide = newhide
      // console.log('CONJUNCT-TERM', this.id, vI, this.peg[vI].canon)

      upeer[vI] = (this.peg[vI].done && peer.isTop) ? this.peg[vI] :
        unite(ctx, this.peg[vI], peer, 'cj-own', ec(te, 'OWN'))
      upeer[vI].mark.type = newtype = newtype || upeer[vI].mark.type
      upeer[vI].mark.hide = newhide = newhide || upeer[vI].mark.hide

      // let prevdone = done
      done = done && (DONE === upeer[vI].dc)

      if (upeer[vI].isNil) {
        return upeer[vI]
        // return Nil.make(
        //   ctx,
        //   '&peer[' + upeer[vI].canon + ',' + peer.canon + ']',
        //   this.peg[vI],
        //   peer
        // )
      }
    }

    upeer = norm(upeer)
    // console.log('CONJUNCT-UPEER', this.id, upeer.map((v: Val) => v.canon))

    // Unify terms against each other

    let outvals: Val[] = []
    let val: Val


    let t0 = upeer[0]

    // next_term:
    for (let pI = 0; pI < upeer.length; pI++) {
      let t1 = upeer[pI + 1]

      // console.log('CONJUNCT-TERMS-C', this.id, pI, t0, t1, 'OV=', outvals.map((v: Val) => v))

      if (null == t1) {
        outvals.push(t0)
        newtype = this.mark.type || t0.mark.type
        newhide = this.mark.hide || t0.mark.hide
      }

      // Can't unite with a RefVal, unless also a RefVal with same path.
      // else if (t0 instanceof RefVal && !(t1 instanceof RefVal)) {
      else if (t0.isRef && !(t1.isRef)) {
        outvals.push(t0)
        t0 = t1
      }

      else if (t1.isRef && !(t0.isRef)) {
        outvals.push(t0)
        t0 = t1
      }


      else {
        val = unite(ctx, t0, t1, 'cj-peer-t0t1', ec(te, 'DEF'))
        done = done && DONE === val.dc
        newtype = this.mark.type || val.mark.type
        newhide = this.mark.hide || val.mark.hide

        // Unite was just a conjunt anyway, so discard.
        if (val.isConjunct) {
          outvals.push(t0)
          t0 = t1
        }
        else if (val.isNil) {
          return val
        }
        else {
          t0 = val
        }
        // TODO: t0 should become this to avoid unnecessary repasses
        // outvals.push(val)

        // pI++
      }
    }

    let out: Val

    // console.log('CONJUCT-prepout', this.id, outvals.map((v: Val) => v.canon))

    if (0 === outvals.length) {

      // Empty conjuncts evaporate.
      out = top()
    }

    // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
    else if (1 === outvals.length) {
      out = outvals[0]
      out.mark.type = newtype
      out.mark.hide = newhide
    }
    else {
      out = new ConjunctVal({ peg: outvals, mark: { type: newtype, hide: newhide } }, ctx)
    }

    out.dc = done ? DONE : this.dc + 1

    // console.log('CONJUNCT-unify', this.id, sc, pc, '->', out.canon, 'D=' + out.dc, 'E=', this.err)

    explainClose(te, out)

    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as ConjunctVal)
    return out
  }


  getJunctionSymbol(): string {
    return '&'
  }


  gen(ctx?: Context) {
    // Unresolved conjunct cannot be generated, so always an error.
    let nil = NilVal.make(
      ctx,
      'conjunct',
      this, // (formatPath(this.peg, this.absolute) as any),
      undefined
    )

    // TODO: refactor to use Site
    nil.path = this.path
    nil.url = this.url
    nil.row = this.row
    nil.col = this.col

    // descErr(nil, ctx)

    if (null == ctx) {
      //   // ctx.err.push(nil)
      //   ctx.adderr(nil)
      // }
      // else {
      throw new Error(nil.msg)
    }

    return undefined
  }
}



// Normalize Conjunct:
// - flatten child conjuncts
// - consistent sorting of terms
function norm(terms: Val[]): Val[] {

  let expand: Val[] = []
  for (let tI = 0, pI = 0; tI < terms.length; tI++, pI++) {
    if (terms[tI].isConjunct) {
      expand.push(...terms[tI].peg)
      pI += terms[tI].peg.length - 1
    }
    else {
      expand[pI] = terms[tI]
    }
  }


  // Consistent ordering ensures order independent unification.
  expand = expand.sort((a: Val, b: Val) => {
    const an = CONJUNCT_ORDERING[a.constructor.name] ?? CONJUNCT_ORDERING.Any
    const bn = CONJUNCT_ORDERING[b.constructor.name] ?? CONJUNCT_ORDERING.Any
    return an - bn
  })

  // console.log('NORM', expand.map(t => t.canon).join(', '))


  return expand
}


export {
  norm,
  ConjunctVal,
}
