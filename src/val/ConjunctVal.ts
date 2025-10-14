/* Copyright (c) 2021-2023 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  descErr
} from '../err'

import {
  Context,
  unite,
} from '../unify'


import { TOP } from './TopVal'
import { ListVal } from './ListVal'
import { MapVal } from './MapVal'
import { NilVal } from './NilVal'
import { RefVal } from './RefVal'
import { FeatureVal } from './FeatureVal'


const CONJUNCT_ORDERING: Record<string, number> = {
  PrefVal: 30000,
  RefVal: 32500,
  DisjunctVal: 35000,
  ConjunctVal: 40000,
  Any: 99999
}



// TODO: move main logic to op/conjunct
class ConjunctVal extends FeatureVal {
  isBinaryOp = true
  isConjunctVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    this.type = !!spec.type
    this.peg = (Array.isArray(this.peg) ? this.peg : [])
      .filter((p: Val) => null != p && p.isVal)
    this.peg?.map((v: Val) => v.type = this.type || v.type)
    // console.log('CONJUNCT-ctor', this.peg.map((v: Val) => v.canon))
  }

  // NOTE: mutation!
  append(peer: Val): ConjunctVal {
    this.peg.push(peer)
    peer.type = this.type || peer.type
    return this
  }

  unify(peer: Val, ctx: Context): Val {
    const sc = this.canon
    const pc = peer?.canon

    const mark = (Math.random() * 1e7) % 1e6 | 0
    let done = true

    this.peg = norm(this.peg)


    // Unify each term of conjunct against peer
    let upeer: Val[] = []

    let newtype = this.type || peer.type

    for (let vI = 0; vI < this.peg.length; vI++) {
      newtype = this.peg[vI].type || newtype
    }

    for (let vI = 0; vI < this.peg.length; vI++) {
      this.peg[vI].type = newtype
      // console.log('CONJUNCT-TERM', this.id, vI, this.peg[vI].canon)

      upeer[vI] = unite(ctx, this.peg[vI], peer, 'cj-own' + mark)
      upeer[vI].type = newtype = newtype || upeer[vI].type

      // let prevdone = done
      done = done && (DONE === upeer[vI].dc)

      if (upeer[vI] instanceof NilVal) {
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

    // Unify terms against each other

    let outvals: Val[] = []
    let val: Val


    let t0 = upeer[0]

    next_term:
    for (let pI = 0; pI < upeer.length; pI++) {

      if (DONE !== t0.dc) {
        let u0 = unite(ctx, t0, TOP, 'cj-peer-t0')
        newtype = this.type || u0.type

        if (
          DONE !== u0.dc

          // Maps and Lists are still unified so that path refs will work
          // TODO: || ListVal - test!
          && !(
            u0 instanceof MapVal
            || u0 instanceof ListVal
            || u0 instanceof RefVal
          )
        ) {

          outvals.push(u0)
          continue next_term
        }
        else {
          t0 = u0
        }
      }

      let t1 = upeer[pI + 1]

      if (null == t1) {
        outvals.push(t0)
        newtype = this.type || t0.type
      }

      // Can't unite with a RefVal, unless also a RefVal with same path.
      else if (t0 instanceof RefVal && !(t1 instanceof RefVal)) {
        outvals.push(t0)
        t0 = t1
      }

      else if (t1 instanceof RefVal && !(t0 instanceof RefVal)) {
        outvals.push(t0)
        t0 = t1
      }


      else {
        val = unite(ctx, t0, t1, 'cj-peer-t0t1')
        done = done && DONE === val.dc
        newtype = this.type || val.type

        // Unite was just a conjunt anyway, so discard.
        if (val instanceof ConjunctVal) {
          outvals.push(t0)
          t0 = t1
        }
        else if (val instanceof NilVal) {
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

    // console.log('CONJUCT-prepout', this.type, newtype, outvals.map((v: Val) => v.canon))

    if (0 === outvals.length) {

      // Empty conjuncts evaporate.
      out = TOP
    }

    // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
    else if (1 === outvals.length) {
      out = outvals[0]
      out.type = newtype
    }
    else {
      out = new ConjunctVal({ peg: outvals, type: newtype }, ctx)
    }

    out.dc = done ? DONE : this.dc + 1

    // console.log('CONJUNCT-unify', this.id, sc, pc, '->', out.canon, 'D=' + out.dc, 'E=', this.err)

    return out
  }


  clone(ctx: Context, spec?: ValSpec): Val {
    let out = (super.clone(ctx, spec) as ConjunctVal)
    out.peg = this.peg.map((entry: Val) => entry.clone(ctx, { type: spec?.type }))
    return out
  }


  // TODO: need a well-defined val order so conjunt canon is always the same
  get canon() {
    return this.peg.map((v: Val) => {
      return (v as any).isBinaryOp && Array.isArray(v.peg) && 1 < v.peg.length ?
        '(' + v.canon + ')' : v.canon
    }).join('&')
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
    if (terms[tI] instanceof ConjunctVal) {
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
