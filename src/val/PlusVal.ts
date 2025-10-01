/* Copyright (c) 2024 Richard Rodger, MIT License */


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
} from '../unify'

import {
  unite
} from '../op/op'


import { TOP, IntegerVal, NumberVal, StringVal } from '../val'
import { Nil } from './Nil'
import { OpVal } from './OpVal'





class PlusVal extends OpVal {
  isOpVal = true

  constructor(
    spec: {
      peg: any[],
    },
    ctx?: Context
  ) {
    super(spec, ctx)
  }


  operate(ctx: Context) {
    super.operate(ctx)

    if (this.peg.find((v: any) => v.isRefVal)) {
      return undefined
    }

    let peg = this.peg[0].peg + this.peg[1].peg
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
    return this.peg[0].canon + '+' + this.peg[1].canon
  }

}


export {
  PlusVal,
}
