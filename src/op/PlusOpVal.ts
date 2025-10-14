/* Copyright (c) 2024-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'


import {
  Context,
} from '../unify'


import { IntegerVal, NumberVal, StringVal } from '../val'
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
    let peg = args[0].peg + args[1].peg
    let pegtype = typeof peg
    if ('string' === pegtype) {
      return new StringVal({ peg })
    }
    else if ('number' === pegtype) {
      return Number.isInteger(peg) ? new IntegerVal({ peg }) : new NumberVal({ peg })
    }

    return undefined
  }


  get canon() {
    return this.peg[0]?.canon + '+' + this.peg[1]?.canon
  }

}


export {
  PlusOpVal,
}
