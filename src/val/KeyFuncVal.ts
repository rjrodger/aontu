/* Copyright (c) 2021-2025 Richard Rodger, MIT License */



import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { StringVal } from '../val/StringVal'



import { FuncBaseVal } from './FuncBaseVal'


class KeyFuncVal extends FuncBaseVal {
  isKeyFunc = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    // this.dc = DONE
  }


  make(_ctx: AontuContext, spec: ValSpec): Val {
    return new KeyFuncVal(spec)
  }

  funcname() {
    return 'key'
  }



  resolve(_ctx: AontuContext, _args: Val[]) {
    let out: Val = this

    if (!this.mark.type && !this.mark.hide) {
      let move = this.peg?.[0]?.peg
      move = isNaN(move) ? 1 : +move
      const key = this.path[this.path.length - (1 + move)] ?? ''

      out = new StringVal({ peg: key })
    }

    return out
  }


  gen(_ctx: AontuContext): any {
    return undefined
  }

}


export {
  KeyFuncVal,
}
