/* Copyright (c) 2024-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'


import {
  AontuContext,
} from '../ctx'



import { IntegerVal } from '../val/IntegerVal'
import { NumberVal } from '../val/NumberVal'
import { StringVal } from '../val/StringVal'
import { BooleanVal } from '../val/BooleanVal'
import { OpBaseVal } from './OpBaseVal'


class PlusOpVal extends OpBaseVal {
  isPlusOp = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new PlusOpVal(spec)
  }

  opname() {
    return 'plus'
  }


  operate(_ctx: AontuContext, args: Val[]) {
    // Only concrete scalar operands are valid: anything else (kinds,
    // maps, lists, null, top, funcs) must not coerce — the JS `+` would
    // leak internals like "[object Object]" into output. A non-scalar
    // operand leaves the op unresolved, which generate() reports.
    const prim = (v: any) => {
      // A pref operand contributes its preferred value (`pref(1)+2`).
      while (v?.isPref) {
        v = v.peg
      }
      const p = v?.isVal && v.isScalar ? v.peg : undefined
      const t = typeof p
      return 'string' === t || 'number' === t || 'boolean' === t ? p : undefined
    }
    let a: any = prim(args[0])
    let b: any = prim(args[1])

    if (undefined === a || undefined === b) {
      return undefined
    }

    const at = typeof a
    const bt = typeof b

    let peg = undefined
    if ('boolean' === at && 'boolean' === bt) {
      peg = a || b
    }
    else if ('string' === at || 'string' === bt) {
      peg = String(a) + String(b)
    }
    else if ('boolean' === at || 'boolean' === bt) {
      // boolean mixed with a number does not coerce (no JS 0/1).
      return undefined
    }
    else {
      peg = a + b
    }

    let pegtype = typeof peg

    let out = undefined

    if ('string' === pegtype) {
      out = new StringVal({ peg })
    }
    else if ('boolean' === pegtype) {
      out = new BooleanVal({ peg })
    }
    else if ('number' === pegtype) {
      out = Number.isInteger(peg) ? new IntegerVal({ peg }) : new NumberVal({ peg })
    }

    return out
  }


  get canon() {
    return this.peg[0]?.canon + '+' + this.peg[1]?.canon
  }

}


export {
  PlusOpVal,
}
