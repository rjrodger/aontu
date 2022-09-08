/* Copyright (c) 2021 Richard Rodger, MIT License */

// TODO: infinite recursion protection


// NOTES
// - Vals are immutable
// - each Val must handle all parent and child unifications explicitly
// - performance is not considered yet



/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer 
    -> Scalar/Integer -> IntegerVal

*/


import type {
  Val,
  ValMap,
  ValList,
} from './type'

import {
  DONE,
  TOP,
} from './type'

import {
  Context,
} from './unify'


import {
  Site
} from './lang'


import {
  unite
} from './op/op'

import { Nil } from './val/Nil'

import {
  ValBase,
} from './val/ValBase'

import { ConjunctVal } from './val/ConjunctVal'






// A ScalarType for integers. Number includes floats.
class Integer { }



type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarTypeVal extends ValBase {
  constructor(peg: ScalarConstructor, ctx?: Context) {
    super(peg, ctx)
    this.done = DONE
  }

  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarVal) {
      if (peer.type === this.peg) {
        return peer
      }
      else if (Number === this.peg && Integer === peer.type) {
        return peer
      }
      return Nil.make(ctx, 'no-scalar-unify', this, peer)
    }
    else {
      if (peer instanceof ScalarTypeVal) {
        if (Number === this.peg && Integer === peer.peg) {
          return peer
        }
        else if (Number === peer.peg && Integer === this.peg) {
          return this
        }
      }
      return Nil.make(ctx, 'scalar-type', this, peer)
    }
  }

  get canon() {
    let ctor = (this.peg as any)
    return ctor.name.toLowerCase()
  }

  same(peer: Val): boolean {
    return peer instanceof ScalarTypeVal ? this.peg === peer.peg : super.same(peer)
  }

  gen(_ctx?: Context) {
    return undefined
  }

}


class ScalarVal<T> extends ValBase {
  type: any
  constructor(peg: T, type: ScalarConstructor, ctx?: Context) {
    super(peg, ctx)
    this.type = type
    this.done = DONE
  }
  unify(peer: Val, ctx: Context): Val {
    // Exactly equal scalars are handled in op/unite
    if (peer instanceof ScalarTypeVal) {
      return peer.unify(this, ctx)
    }
    return Nil.make(ctx, 'scalar', this, peer)
  }
  get canon() {
    return (this.peg as any).toString()
  }
  same(peer: Val): boolean {
    return peer instanceof ScalarVal ? peer.peg === this.peg : super.same(peer)
  }

  gen(_ctx?: Context) {
    return this.peg
  }
}


class NumberVal extends ScalarVal<number> {
  constructor(peg: number, ctx?: Context) {
    super(peg, Number, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarVal && peer.type === Integer) {
      return peer
    }
    else {
      return super.unify(peer, ctx)
    }
  }
}


class IntegerVal extends ScalarVal<number> {
  constructor(peg: number, ctx?: Context) {
    if (!Number.isInteger(peg)) {
      // TODO: use Nil?
      throw new Error('not-integer')
    }
    super(peg, Integer, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarTypeVal && peer.peg === Number) {
      return this
    }
    else if (peer instanceof ScalarVal &&
      peer.type === Number &&
      this.peg === peer.peg) {
      return this
    }
    else {
      return super.unify(peer, ctx)
    }
  }
}


class StringVal extends ScalarVal<string> {
  constructor(peg: string, ctx?: Context) {
    super(peg, String, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }
  get canon() {
    return JSON.stringify(this.peg)
  }

}


class BooleanVal extends ScalarVal<boolean> {
  constructor(peg: boolean, ctx?: Context) {
    super(peg, Boolean, ctx)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }

  static TRUE = new BooleanVal(true, new Context({ vc: 1, root: TOP }))
  static FALSE = new BooleanVal(false, new Context({ vc: 2, root: TOP }))
}







class ListVal extends ValBase {
  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(peg: ValList, ctx?: Context) {
    super(peg, ctx)

    let spread = (this.peg as any)[ListVal.SPREAD]
    delete (this.peg as any)[ListVal.SPREAD]

    if (spread) {
      if ('&' === spread.o) {
        // TODO: handle existing spread!
        this.spread.cj =
          new ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx)
      }
    }
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let out: ListVal = TOP === peer ? this : new ListVal([], ctx)

    out.spread.cj = this.spread.cj

    if (peer instanceof ListVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj = new ConjunctVal([out.spread.cj, peer.spread.cj], ctx)
        )
      )
    }


    out.done = this.done + 1

    if (this.spread.cj) {
      out.spread.cj =
        DONE !== this.spread.cj.done ? unite(ctx, this.spread.cj) :
          this.spread.cj
    }

    let spread_cj = out.spread.cj || TOP

    // Always unify children first
    for (let key in this.peg) {
      out.peg[key] =
        unite(ctx.descend(key), this.peg[key], spread_cj)

      done = (done && DONE === out.peg[key].done)
    }

    if (peer instanceof ListVal) {
      let upeer: ListVal = (unite(ctx, peer) as ListVal)

      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                unite(ctx.descend(peerkey), child, peerchild)

        if (this.spread.cj) {
          out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
        }

        done = (done && DONE === oval.done)

      }
    }
    else if (TOP !== peer) {
      return Nil.make(ctx, 'map', this, peer)
    }

    out.done = done ? DONE : out.done
    return out
  }

  get canon() {
    let keys = Object.keys(this.peg)
    return '[' +
      (this.spread.cj ? '&:' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        // NOTE: handle array non-index key vals
        // .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
        .map(k => [this.peg[k].canon]).join(',') +
      ']'
  }

  gen(ctx?: Context) {
    let out: any = this.peg.map((v: Val) => v.gen(ctx))
    // for (let p in this.peg) {
    //   out[p] = this.peg[p].gen(ctx)
    // }

    return out
  }
}







// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase {
  // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
  constructor(peg: Val[], ctx?: Context, _sites?: Site[]) {
    super(peg, ctx)
  }

  // NOTE: mutation!
  append(peer: Val): DisjunctVal {
    this.peg.push(peer)
    return this
  }

  unify(peer: Val, ctx: Context): Val {
    let done = true

    let oval: Val[] = []

    // console.log('oval', this.canon, peer.canon)

    // Conjunction (&) distributes over disjunction (|)
    for (let vI = 0; vI < this.peg.length; vI++) {
      //oval[vI] = this.peg[vI].unify(peer, ctx)
      oval[vI] = unite(ctx, this.peg[vI], peer)
      // console.log('ovalA', vI, this.peg[vI].canon, peer.canon, oval[vI].canon)

      done = done && DONE === oval[vI].done
    }

    // console.log('ovalB', oval.map(v => v.canon))

    // Remove duplicates, and normalize
    if (1 < oval.length) {
      for (let vI = 0; vI < oval.length; vI++) {
        if (oval[vI] instanceof DisjunctVal) {
          oval.splice(vI, 1, ...oval[vI].peg)
        }
      }

      //console.log('ovalC', oval.map(v => v.canon))

      // TODO: not an error Nil!
      let remove = new Nil()
      for (let vI = 0; vI < oval.length; vI++) {
        for (let kI = vI + 1; kI < oval.length; kI++) {
          if (oval[kI].same(oval[vI])) {
            oval[kI] = remove
          }
        }
      }

      //console.log('ovalD', oval.map(v => v.canon))

      oval = oval.filter(v => !(v instanceof Nil))
    }

    let out: Val

    if (1 == oval.length) {
      out = oval[0]
    }
    else if (0 == oval.length) {
      return Nil.make(ctx, '|:empty', this)
    }
    else {
      out = new DisjunctVal(oval, ctx)
    }

    out.done = done ? DONE : this.done + 1

    return out
  }
  get canon() {
    return this.peg.map((v: Val) => v.canon).join('|')
  }
  gen(ctx?: Context) {
    if (0 < this.peg.length) {

      let vals = this.peg.filter((v: Val) => v instanceof PrefVal)

      vals = 0 === vals.length ? this.peg : vals

      let val = vals[0]

      for (let vI = 1; vI < this.peg.length; vI++) {
        val = val.unify(this.peg[vI])
      }

      return val.gen(ctx)
    }

    return undefined
  }
}



class RefVal extends ValBase {
  parts: string[]
  absolute: boolean
  sep = '.'

  constructor(peg: any[], abs?: boolean) {
    super('')
    this.absolute = true === abs
    this.parts = []

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


  gen(_ctx?: Context) {
    return undefined
  }
}


class PrefVal extends ValBase {
  pref: Val
  constructor(peg: any, pref?: any, ctx?: Context) {
    super(peg, ctx)
    this.pref = pref || peg
  }

  // PrefVal unify always returns a PrefVal
  // PrefVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: Context): Val {
    let done = true
    let out: Val

    if (peer instanceof PrefVal) {
      out = new PrefVal(
        unite(ctx, this.peg, peer.peg, 'Pref000'),
        unite(ctx, this.pref, peer.pref, 'Pref010'),
        ctx
      )

    }
    else {
      out = new PrefVal(
        // TODO: find a better way to drop Nil non-errors
        unite(ctx?.clone({ err: [] }), this.peg, peer, 'Pref020'),
        unite(ctx?.clone({ err: [] }), this.pref, peer, 'Pref030'),
        ctx
      )
    }

    done = done && DONE === out.peg.done &&
      (null != (out as PrefVal).pref ? DONE === (out as PrefVal).pref.done : true)

    if (out.peg instanceof Nil) {
      out = (out as PrefVal).pref
    }
    else if ((out as PrefVal).pref instanceof Nil) {
      out = out.peg
    }

    out.done = done ? DONE : this.done + 1

    return out
  }


  same(peer: Val): boolean {
    if (null == peer) {
      return false
    }

    let pegsame = (this.peg === peer.peg) ||
      (this.peg instanceof ValBase && this.peg.same(peer.peg))

    let prefsame = peer instanceof PrefVal &&
      ((this.pref === peer.pref) ||
        (this.pref instanceof ValBase && this.pref.same(peer.pref)))

    return pegsame && prefsame
  }


  get canon() {
    return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
  }

  gen(ctx?: Context) {
    let val = !(this.pref instanceof Nil) ? this.pref :
      !(this.peg instanceof Nil) ? this.peg :
        undefined

    return undefined === val ? undefined : val.gen(ctx)
  }
}



export {
  Integer,
  TOP,
  ScalarTypeVal,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  ListVal,
  DisjunctVal,
  RefVal,
  PrefVal,
}
