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

import { AontuContext } from '../ctx'
import { unite } from '../unify'

import {
  explainOpen,
  ec,
  explainClose,
} from '../utility'

import {
  top
} from './valutil'

import { ConjunctVal } from './ConjunctVal'
import { NilVal } from './NilVal'
import { FeatureVal } from './FeatureVal'




class OpBaseVal extends FeatureVal {
  isPlusOp = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
    this.peg = []

    for (let pI = 0; pI < spec.peg.length; pI++) {
      this.append(spec.peg[pI])
    }
  }


  append(part: any) {
    this.peg.push(part)
  }


  make(ctx: AontuContext, _spec: ValSpec): Val {
    return NilVal.make(ctx, 'op:' + this.opname(), this, undefined, 'make')
  }

  opname() {
    return 'op'
  }


  unify(peer: Val, ctx: AontuContext, trace?: any[]): Val {
    const te = ctx.explain && explainOpen(ctx, trace, 'Op:' + this.opname(), this, peer)
    let out: Val = this

    if (this.id == peer.id) {
      return this
    }


    let pegdone = true
    let newpeg: Val[] = []

    for (let arg of this.peg) {
      if (!arg.done) {
        arg = arg.unify(top(), ctx, ec(te, 'ARG'))
      }
      pegdone &&= arg.done
      newpeg.push(arg)
    }

    // console.log('OPVAL', this.id, this.opname(), pegdone, newpeg.map(p => p.canon))

    if (pegdone) {
      let result: Val | undefined = null == ctx ? this : this.operate(ctx, newpeg)

      result = result || this

      if (null == result && this.canon === peer.canon) {
        out = this
      }

      // TODO: should be result.isOp
      else if (result instanceof OpBaseVal) {
        if (peer.isTop) {
          out = this
        }
        // TODO: should peer.isNil
        else if (peer.isNil) {
          out = NilVal.make(ctx, 'op[' + this.peg + ']', this, peer)
        }

        else if (this.canon === peer.canon) {
          out = this
        }

        else {
          this.dc = DONE === this.dc ? DONE : this.dc + 1
          out = new ConjunctVal({ peg: [this, peer] }, ctx)
        }
      }
      else {
        out = result.done && peer.isTop ? result :
          unite(ctx, result, peer, 'op', ec(te, 'RES'))
      }

      out.dc = DONE === out.dc ? DONE : this.dc + 1
    }
    else if (peer.isTop) {
      this.notdone()
      out = this.make(ctx, { peg: newpeg })

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path

      // why += 'top'
    }
    else if (peer.isNil) {
      this.notdone()
      out = peer
      //why += 'nil'
    }
    else {
      this.notdone()
      out = new ConjunctVal({ peg: [this, peer] }, ctx)

      // TODO: make should handle this using ctx?
      out.row = this.row
      out.col = this.col
      out.url = this.url
      out.path = this.path
    }

    explainClose(te, out)

    return out
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.peg === peer.peg
  }


  clone(ctx: AontuContext, _spec?: ValSpec): Val {
    let out = (super.clone(ctx, {
      peg: this.peg,
    }) as OpBaseVal)
    return out
  }


  operate(ctx: AontuContext, _args: Val[]): Val | undefined {
    return NilVal.make(ctx, 'op:' + this.opname(), this, undefined, 'operate')
  }


  get canon() {
    return 'op'
  }


  primatize(v: any): undefined | null | string | number | boolean {
    const t = typeof v
    if (null == v || 'string' === t || 'number' === t || 'boolean' === t) {
      return v
    }
    else if (v?.isVal) {
      return this.primatize(v.peg)
    }
    else if (v?.toString) {
      return '' + v
    }
    else {
      return undefined
    }
  }


  gen(ctx?: AontuContext) {
    // Unresolved op cannot be generated, so always an error.
    let nil = NilVal.make(
      ctx,
      'op',
      this,
      undefined
    )

    // TODO: refactor to use Site
    nil.path = this.path
    nil.url = this.url
    nil.row = this.row
    nil.col = this.col

    descErr(nil, ctx)

    if (ctx) {
      // ctx.err.push(nil)
      ctx.adderr(nil)
    }
    else {
      throw new Error(nil.msg)
    }

    return undefined
  }
}


export {
  OpBaseVal,
}
