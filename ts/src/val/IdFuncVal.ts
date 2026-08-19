/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE IDENTITY MARK (G4 phase 1,
// docs/capability-review/g4-identity-relations.md): `id(name)`
// declares that the enclosing value is an independent ENTITY named
// `name`, and every node in one evaluation carrying that name is
// unified with every other.
//
// It is written as a conjunct — `id(svc/auth) & { … }` — so the
// function itself resolves to the UNIT (top) carrying the name, and
// the identity rides the meet onto the value, the same channel G3's
// deprecation record uses. Declaring two nodes the same entity MEANS
// unifying them, so a contradiction between them is a located error
// naming both sites: the anti-`owl:sameAs`.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { makeNilErr } from '../err'

import { FuncBaseVal } from './FuncBaseVal'
import { TopVal } from './TopVal'
import { nextValId } from './Val'


// Letters, digits, `_`, `-`, `/` — and NO DOTS: a dot separates an
// entity address from a sub-path (G4 phase 2), so a dotted id would
// make `svc/auth.port` ambiguous between "the entity `svc/auth.port`"
// and "the port of `svc/auth`".
const ID_NAME = /^[A-Za-z0-9_/-]+$/


// The name an argument spells, or undefined when it does not spell
// one. A bare `svc/auth` parses as a string, as does `"svc/auth"`;
// anything else — a number, a map, an unresolved reference — is not a
// name, and saying so at once beats an entity nobody can address.
export function idName(v: any): string | undefined {
  if (true !== v?.isScalar || 'string' !== typeof v.peg) {
    return undefined
  }
  return ID_NAME.test(v.peg) ? v.peg : undefined
}


class IdFuncVal extends FuncBaseVal {
  isIdFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }

  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new IdFuncVal(spec)
  }

  funcname() {
    return 'id'
  }

  resolve(ctx: AontuContext, args: Val[]) {
    const name = idName(args[0])
    if (undefined === name) {
      return makeNilErr(ctx, 'id_name', this, undefined, 'id')
    }

    // THE UNIT, carrying the identity: `id(x) & v` must be `v` with an
    // identity, so the function resolves to what unifies with anything
    // and lets the rider in `unite` do the stamping.
    const out = new TopVal({}, ctx)
    // NOT id 0: TopVal pins that, and `unite`'s fast path returns
    // early for two done Vals sharing an id — which would drop one of
    // two identities before the rider could refuse them.
    out.id = nextValId()
    out.entity = name
    return out
  }
} /* node:coverage ignore next 6 */


export {
  IdFuncVal,
}
