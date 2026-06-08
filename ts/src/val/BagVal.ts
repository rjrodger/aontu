/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


import type {
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import {
  items,
} from '../utility'

import { makeNilErr } from '../err'
import { empty } from './Val'

import { Val } from './Val'
import { NilVal } from './NilVal'
import { FeatureVal } from './FeatureVal'
import { ExpectVal } from './ExpectVal'


abstract class BagVal extends FeatureVal {
  isBag = true
  isGenable = true

  closed: boolean = false
  optionalKeys: string[] = []

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }

  clone(ctx: AontuContext, spec?: ValSpec): Val {
    const bag = super.clone(ctx, spec) as BagVal
    bag.spread = this.spread
    return bag
  }


  handleExpectedVal(key: string, val: Val, parent: Val, ctx: AontuContext): Val {
    if (val.isGenable) {
      return val
    }
    const expectVal = new ExpectVal({ peg: val }, ctx)
    expectVal.key = key
    expectVal.parent = parent
    return expectVal
  }


  gen(ctx: AontuContext) {
    let out: any = this.isMap ? {} : []

    if (this.mark.type || this.mark.hide) {
      return undefined
    }

    for (let item of items(this.peg)) {
      const p = item[0]
      const child = item[1]

      if (child.mark.type || child.mark.hide) {
        continue
      }

      const optional = this.optionalKeys.includes('' + p)

      // Optional unresolved disjuncts are not an error, just dropped.
      if (child.isDisjunct && optional) {
        const dctx = ctx.clone({ err: [], collect: true })

        let cval = child.gen(dctx)

        if (undefined === cval) {
          continue
        }

        out[p] = cval
      }

      else if (child.isScalar
        || child.isMap
        || child.isList
        || child.isPref
        || child.isRef
        || child.isDisjunct
        || child.isNil
      ) {
        let cval = child.gen(ctx)

        if (optional && (undefined === cval || empty(cval))) {
          continue
        }

        out[p] = cval
      }
      else if (child.isNil) {
        ctx.adderr(child)
      }
      else if (!optional) {
        const prefix = this.isMap ? 'map' : 'list'
        let code = this.closed ? prefix + 'val_required' : prefix + 'val_no_gen'
        let va = child
        let vb = undefined

        if (va.isExpect) {
          code = prefix + 'val_spread_required'
          if (va.parent) {
            vb = new NilVal({}, ctx)
            va.parent.place(vb)
          }
          va = va.peg
        }

        const details = { key: p }

        makeNilErr(ctx, code, va, vb, undefined, details)

        break
      }

      // else optional so we can ignore it
    }

    return out
  }

}


export {
  BagVal,
}
