/* Copyright (c) 2021 Richard Rodger, MIT License */



import type {
  Val,
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
import { MapVal } from './MapVal'
import { ValBase } from '../val/ValBase'
import { ConjunctVal } from '../val/ConjunctVal'

import { StringVal } from '../val'



class RefVal extends ValBase {
  parts: string[]
  absolute: boolean
  sep = '.'
  root = '$'
  attr: undefined | { kind: 'KEY', part: string }

  constructor(peg: any[]) {
    super('')

    // console.log('RC', peg)

    this.absolute =
      this.root === peg[0] ||
      this.root === peg[0]?.peg

    if (this.absolute) {
      this.peg = this.root
    }
    else if (1 === peg.length && peg[0] instanceof RefVal) {
      peg.unshift(this.sep)
    }

    this.parts = []

    let pI = this.absolute ? 1 : 0
    for (; pI < peg.length; pI++) {
      this.append(peg[pI])
    }
  }


  append(part: any) {
    //console.log('APPEND 0', part)

    let partstr

    if ('string' === typeof part) {
      // this.parts.push(part)
      partstr = part
    }

    else if (part instanceof StringVal) {
      // this.parts.push(part.peg)
      partstr = part.peg
    }

    else if (part instanceof RefVal) {
      this.attr = part.attr
      this.parts.push(...part.parts)
      if (0 < this.parts.length) {
        partstr = this.parts[this.parts.length - 1]
        this.parts.length = this.parts.length - 1
      }
      // if (part.absolute) {
      //   this.absolute = true
      // }
    }

    // console.log('PARTSTR', partstr)

    if (null != partstr) {
      let m = partstr.match(/^(.*)\$([^$]+)$/)
      if (m) {
        partstr = m[1]
        this.attr = { kind: m[2], part: partstr }
      }
      if ('' != partstr) {
        this.parts.push(partstr)
      }
    }

    this.peg =
      (this.absolute ? this.root : '') +
      (0 < this.parts.length ? this.sep : '') +
      // this.parts.join(this.sep)
      this.parts.map(p => this.sep === p ? '' : p).join(this.sep) +
      (null == this.attr ? '' : '$' + this.attr.kind)

    // console.log('PEG', this.peg)
  }


  unify(peer: Val, ctx: Context): Val {
    if (this.id === peer.id) {
      return this
    }

    // TODO: not resolved when all Vals in path are done is an error
    // as path cannot be found
    // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
    let resolved: Val | undefined = null == ctx ? this : this.find(ctx)

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
      // console.log('WWW', out, resolved, peer)
    }

    out.done = DONE === out.done ? DONE : this.done + 1

    return out
  }


  find(ctx: Context) {
    // TODO: relative paths
    // if (this.root instanceof MapVal && ref.absolute) {

    // NOTE: path *to* the ref, not the ref itself!
    let fullpath = this.path

    if (this.absolute) {
      fullpath = this.parts // ignore '$' at start
    }
    else {
      fullpath = fullpath.slice(0, -1).concat(this.parts)
    }

    let sep = this.sep
    fullpath = fullpath
      .reduce(((a: string[], p: string) =>
        (p === sep ? a.length = a.length - 1 : a.push(p), a)), [])

    // console.log('FP', this.absolute, this.parts, fullpath)

    let node = ctx.root
    let pI = 0
    for (; pI < fullpath.length; pI++) {
      let part = fullpath[pI]
      if (node instanceof MapVal) {
        node = node.peg[part]
      }
      else {
        // console.log(
        //   'FIND', ref.parts, pI, node.constructor.name,
        //   node.peg.map(
        //     (n: any) =>
        //       n.constructor.name + ':' + n.done +
        //       ' {' + Object.keys(n.peg) + '}'
        //   )
        // )
        break;
      }
    }


    // console.log('FIND', pI, fullpath, this.attr)

    if (pI === fullpath.length) {
      if (this.attr && 'KEY' === this.attr.kind) {
        let key = fullpath[fullpath.length - ('' === this.attr.part ? 1 : 2)]
        // console.log('FIND KEY', key, fullpath)

        let sv = new StringVal(null == key ? '' : key, ctx)

        // TODO: other props?
        sv.done = DONE
        sv.path = this.path

        // console.log('SV', sv)
        return sv
      }
      else {
        return node
      }
    }
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
