/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  Val,
  ValSpec,
} from '../type'

import {
  Context,
  unite,
} from '../unify'

import {
  NilVal,
  TOP,
} from '../val'


import {
  walk
} from '../utility'


import { FuncBaseVal } from './FuncBaseVal'


class CopyFuncVal extends FuncBaseVal {
  isCopyFunc = true

  resolved?: Val

  constructor(
    spec: ValSpec,
    ctx?: Context
  ) {
    super(spec, ctx)
    this.mark.type = false
    this.mark.hide = false
  }


  make(_ctx: Context, spec: ValSpec): Val {
    return new CopyFuncVal(spec)
  }

  funcname() {
    return 'copy'
  }


  unify(peer: Val, ctx: Context): Val {
    let out: Val | undefined = this.resolved
    // console.log('COPY-UNIFY-START', this.canon, peer.canon, '->', out?.canon)

    if (null == out) {
      let oldpeg = this.peg[0]
      // console.log('COPY-UNITE-PEG-A', oldpeg.canon)
      let newpeg = unite(ctx, oldpeg, TOP, 'copy')
      this.peg = [newpeg]

      if (newpeg.done) {
        out = this.resolve(ctx, this.peg)
      }
      else {
        out = this
      }
    }

    // console.log('COPY-UNIFY-OUT', this.canon, peer.canon, '->', out.canon)

    return out
  }


  resolve(ctx: Context | undefined, args: Val[]) {
    const val = args?.[0]
    const out = null == val || null == ctx ?
      new NilVal({ msg: 'Invalid copy argument' }) :
      val.clone(ctx, { mark: { type: false, hide: false } })

    walk(out, (_key: string | number | undefined, val: Val) => {
      val.mark.type = false
      val.mark.hide = false
      return val
    })


    // console.log('COPY-RESOLVE', this.canon, '->', out.canon)
    return out
  }
}


export {
  CopyFuncVal,
}
