/* Copyright (c) 2021 Richard Rodger, MIT License */



import type {
  Val,
  ValMap,
  ValList,
} from '../type'

import {
  DONE,
  TOP,
} from '../type'

import {
  Context,
} from '../unify'


import {
  Site
} from '../lang'


import {
  unite
} from '../op/op'

import { Nil } from '../val/Nil'

import { ValBase } from '../val/ValBase'
import { ConjunctVal } from '../val/ConjunctVal'

import { StringVal } from '../val'



class RefVal extends ValBase {
  parts: string[]
  absolute: boolean
  sep = '.'

  constructor(peg: any[] | string, abs?: boolean) {
    super('')
    this.absolute = true === abs
    this.parts = []

    if ('string' === typeof peg) {
      peg = peg.split('.')
    }

    for (let part of peg) {
      this.append(part)
    }
  }


  append(part: any) {
    //console.log('APPEND 0', part)

    if ('string' === typeof part) {
      this.parts.push(part)
    }

    else if (part instanceof StringVal) {
      this.parts.push(part.peg)
    }

    else if (part instanceof RefVal) {
      this.parts.push(...part.parts)

      if (part.absolute) {
        this.absolute = true
      }
    }

    this.peg = (this.absolute ? this.sep : '') + this.parts.join(this.sep)
  }

  unify(peer: Val, ctx: Context): Val {
    let resolved: Val | undefined = null == ctx ? this : ctx.find(this)

    // Don't try to resolve paths forever.
    // TODO: large amount of reruns needed? why?
    resolved = null == resolved && 999 < this.done ?
      Nil.make(ctx, 'no-path', this, peer) : (resolved || this)
    let out: Val

    if (resolved instanceof RefVal) {
      if (TOP === peer) {
        out = this
      }
      else if (peer instanceof Nil) {
        out = Nil.make(ctx, 'ref[' + this.peg + ']', this, peer)
      }

      // same path
      else if (this.peg === peer.peg) {
        out = this
      }

      else {
        // Ensure RefVal done is incremented
        this.done = DONE === this.done ? DONE : this.done + 1
        out = new ConjunctVal([this, peer], ctx)
      }
    }
    else {
      out = unite(ctx, resolved, peer)
    }

    out.done = DONE === out.done ? DONE : this.done + 1

    return out
  }


  same(peer: Val): boolean {
    return null == peer ? false : this.peg === peer.peg
  }


  get canon() {
    return this.peg
  }


  gen(ctx?: Context) {
    // throw new Error('REF ' + this.peg)
    if (ctx) {
      ctx.err.push(Nil.make(
        ctx,
        'ref',
        this.peg,
        undefined,
      ))
    }

    return undefined
  }
}


export {
  RefVal,
}
