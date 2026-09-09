/* Copyright (c) 2025 Richard Rodger, MIT License */


// THE MEMBERS OF A BAG, as every fold and every generator over a bag
// sees them (use-cases/BUGS.md §79; G9 phase 0 item 4). A member is a
// child that generation would EMIT: a hide()- or type()-marked child
// is not one, an alias declaration is not one, and an optional key
// whose value generates nothing -- an unfilled `y?: string`, an absent
// optional subtree -- is not one. `form`, `emit`, `filter`, `pick`,
// `join` and the aggregates read a bag through this one function, so a
// value the document withholds from its output is withheld from every
// text and every total the document computes from it: a hidden field
// that reached generated source through `join` is the defect this
// closes, and it was one behaviour in both ports because each verb
// had its own enumeration and none of them asked the mark.
//
// Maps list their members in code-point key order (../keyorder.ts),
// lists in index order -- the one order canon, generation and the Go
// port agree on (BUGS.md §62). Twin of bagMembers in go/members.go.

import type { Val } from '../type'
import { AontuContext } from '../ctx'
import { cmpCodePoint } from '../keyorder'
import { empty } from './Val'
import { bagGenable } from './BagVal'


type Member = { key: string, val: Val }


function bagMembers(data: any, ctx: AontuContext): Member[] | undefined {
  if (true !== data?.isMap && true !== data?.isList) {
    return undefined
  }

  const keys: string[] = true === data.isMap ?
    Object.keys(data.peg).sort(cmpCodePoint) :
    (data.peg as Val[]).map((_v: Val, i: number) => '' + i)

  // A member marked while its bag is not was marked in its own right,
  // and is left out as generation leaves it out. Under a MARKED bag
  // every child carries the mark (hide() and type() mark to the
  // leaves), so there the mark says nothing about the member and every
  // child is one -- the members of a hidden bag are what the bag
  // holds, exactly as a reference to it lifts them.
  const lifted = true === data.mark.hide || true === data.mark.type

  const out: Member[] = []
  for (const key of keys) {
    const val: any = data.peg[key]
    if ((!lifted && (true === val.mark.hide || true === val.mark.type))
      || data.aliasKeys.includes(key)) {
      continue
    }
    if (data.optionalKeys.includes(key) && !filled(val, ctx)) {
      continue
    }
    out.push({ key, val })
  }
  return out
}


// An optional child is a member when it generates something, decided
// as BagVal.gen decides it: in an isolated collect context, so residue
// inside an absent optional subtree is dropped rather than raised.
function filled(val: any, ctx: AontuContext): boolean {
  if (!bagGenable(val)) {
    return false
  }
  const cval = val.gen(ctx.clone({ err: [], collect: true }))
  return undefined !== cval && !empty(cval)
}


// The member values alone, for the verbs that do not need the keys.
function memberVals(data: any, ctx: AontuContext): Val[] | undefined {
  const members = bagMembers(data, ctx)
  return undefined === members ? undefined : members.map((m) => m.val)
} /* node:coverage ignore next 6 */


export {
  bagMembers,
  memberVals,
}
