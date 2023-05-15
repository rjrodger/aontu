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
    if (this.id === peer.id) {
      return this
    }

    // TODO: not resolved when all Vals in path are done is an error
    // as path cannot be found
    let resolved: Val | undefined = null == ctx ? this : ctx.find(this)

    // console.log('REF', resolved, this.peg, peer.canon)

    // if (null == resolved && peer instanceof RefVal && this.peg === peer.peg) {
    //   console.log('SAMEREF', this.peg, this.id, this.done, peer.canon, peer.id)
    // }

    // if (null == resolved && 0 < this.done) {
    //   console.log('UREF', this.peg, this.done, peer.canon)
    // }

    // Don't try to resolve paths forever.
    // TODO: large amount of reruns needed? why?
    // resolved =
    //   null == resolved &&
    //     9999 < this.done
    //     ?
    //     Nil.make(ctx, 'no-path', this, peer)
    //     : (resolved || this)

    resolved = resolved || this

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
    if (ctx) {
      ctx.err.push(Nil.make(
        ctx,
        'ref',
        this.peg,
        undefined,
      ))
    }

    throw new Error('REF-gen ' + this.peg)

    return undefined
  }
}


export {
  RefVal,
}
