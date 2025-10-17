/* Copyright (c) 2024-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'


import {
  Context,
} from '../unify'


import { IntegerVal, NumberVal, StringVal, BooleanVal } from '../val'
import { OpBaseVal } from './OpBaseVal'





class PlusOpVal extends OpBaseVal {
  isOpVal = true

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new PlusOpVal(spec)
  }

  opname() {
    return 'plus'
  }


  operate(_ctx: Context, args: Val[]) {
    let a: any = this.primatize(args[0]?.peg)
    let b: any = this.primatize(args[1]?.peg)

    let peg = undefined
    if (undefined === a && undefined !== b) {
      peg = b
    }
    else if (undefined === b && undefined !== a) {
      peg = a
    }
    else {
      const at = typeof a
      const bt = typeof b
      if ('boolean' === at && 'boolean' === bt) {
        peg = a || b
      }
      else {
        peg = a + b
      }
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
