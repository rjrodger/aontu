/* Copyright (c) 2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { Val as ValBase } from './Val'


class PlaceVal extends ValBase {
  isPlace = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  unify(peer: Val, _ctx: AontuContext): Val {
    // The peer FILLS the hole. Against TOP there is nothing to fill it
    // with, so it waits -- and waiting is not done, or a call holding
    // it would resolve around it.
    if (peer.isTop) {
      this.notdone()
      return this
    }

    return peer
  }


  get canon() {
    return '_'
  }


  // A hole admits everything, so nothing sits above it -- the same
  // answer TOP gives, for the same reason.
  superior(): Val {
    return this
  }


}


function boundArgStart(v: any): number {
  return true === v.isPackFunc || true === v.isEachFunc ||
    true === v.isFilterFunc || true === v.isEmitFunc ||
    true === v.isFormFunc ? 1 : Infinity
}


function hasPlace(v: Val): boolean {
  if (true === (v as any).isPlace) {
    return true
  }

  const peg: any = (v as any).peg
  const bound = boundArgStart(v)

  if (Array.isArray(peg)) {
    for (let cI = 0; cI < peg.length && cI < bound; cI++) {
      const c = peg[cI]
      if (true === c?.isVal && hasPlace(c)) {
        return true
      }
    }
  }
  else if (true === peg?.isVal) {
    return hasPlace(peg)
  }
  else if (null != peg && 'object' === typeof peg) {
    for (const k of Object.keys(peg)) {
      if (true === peg[k]?.isVal && hasPlace(peg[k])) {
        return true
      }
    }
  }

  return false
}


function fillPlace(v: Val, fill: Val, ctx: AontuContext): Val {
  if (true === (v as any).isPlace) {
    return fill.clone(ctx, { path: [...(v as any).path] })
  }

  const peg: any = (v as any).peg
  const bound = boundArgStart(v)

  if (Array.isArray(peg)) {
    let changed = false
    const out = peg.map((c: any, cI: number) => {
      if (true !== c?.isVal || bound <= cI) {
        return c
      }
      const f = fillPlace(c, fill, ctx)
      changed = changed || f !== c
      return f
    })
    return changed ? rebuild(v, out, ctx) : v
  }

  if (true === peg?.isVal) {
    const f = fillPlace(peg, fill, ctx)
    return f === peg ? v : rebuild(v, f, ctx)
  }

  if (null != peg && 'object' === typeof peg) {
    let changed = false
    const out: Record<string, Val> = {}
    for (const k of Object.keys(peg)) {
      const c = peg[k]
      // No isVal guard: a slot holding something that is not a Val
      // answers itself, because fillPlace's own first tests -- is it a
      // hole, has it a peg -- are both false for one.
      const f = fillPlace(c, fill, ctx)
      changed = changed || f !== c
      out[k] = f
    }
    return changed ? rebuild(v, out, ctx) : v
  }

  return v
}


// A clone carrying a new peg. `clone` shares the peg by reference (see
// Val.clone), which is exactly what must NOT happen here: the tree
// being filled is a template, and the fill is one destination's.
function rebuild(v: Val, peg: any, ctx: AontuContext): Val {
  const out: any = v.clone(ctx)
  out.peg = peg
  out.dc = 0
  return out
} /* node:coverage ignore next 10 */


export {
  boundArgStart,
  rebuild,
  hasPlace,
  fillPlace,
  PlaceVal,
}
