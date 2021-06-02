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


import {
  Context,
} from './unify'


type ValMap = { [key: string]: Val }

const DONE = -1



// There can be only one.
const TOP: Val = {
  id: 0,
  top: true,
  peg: undefined,
  done: DONE,
  path: [],
  row: -1,
  col: -1,
  url: '',

  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof DisjunctVal) {
      return peer.unify(this, ctx)
    }
    else if (peer instanceof ConjunctVal) {
      return peer.unify(this, ctx)
    }
    else if (peer instanceof RefVal) {
      return peer.unify(this, ctx)
    }
    else {
      return peer
    }
  },

  get canon() { return 'top' },

  same(peer: Val): boolean {
    return TOP === peer
  },

  gen: (_ctx?: Context) => {
    return undefined
  },

}

const UNIFIER = (self: Val, peer: Val, ctx: Context): Val => {
  if (peer === TOP) {
    return self
  }
  else if (self === TOP) {
    return peer
  }
  else if (self.constructor === peer.constructor) {
    return self.peg === peer.peg ? self :
      Nil.make(ctx, 'no-unify-val<' + self.canon + '&' + peer.canon + '>', self, peer)
  }
  else if (peer instanceof Nil) {
    return peer
  }
  else if (self instanceof Nil) {
    return self
  }
  else if (peer instanceof DisjunctVal) {
    return peer.unify(self, ctx)
  }
  else if (peer instanceof ConjunctVal) {
    return peer.unify(self, ctx)
  }
  else if (peer instanceof RefVal) {
    return peer.unify(self, ctx)
  }
  else {
    return Nil.make(ctx, 'no-unify<' + self.canon + '&' + peer.canon + '>', self, peer)
  }
}


abstract class Val {
  id: number
  done: number = 0
  path: string[]
  row: number = -1
  col: number = -1
  url: string = ''

  top?: boolean

  // Actual native value.
  peg?: any

  // TODO: used for top level result - not great
  err?: any[]
  deps?: any

  constructor(peg?: any, ctx?: Context) {
    this.peg = peg
    this.path = (ctx && ctx.path) || []
    this.id = (ctx && ctx.vc++) || (9e9 + Math.floor(Math.random() * (1e9)))
  }

  same(peer: Val): boolean {
    return this === peer
  }

  // TODO: can ctx be optional?
  abstract unify(peer: Val, ctx: Context): Val
  abstract get canon(): string
  abstract gen(ctx?: Context): any
}



class Nil extends Val {
  nil = true
  why: any
  primary?: Val
  secondary?: Val

  // TODO: include Val generating nil, thus capture type
  static make = (ctx?: Context, why?: any, av?: Val, bv?: Val) => {
    let nil = new Nil(why, ctx)

    // Terms later in same file are considered the primary error location.
    if (null != av) {
      nil.row = av.row
      nil.col = av.col
      nil.url = av.url

      nil.primary = av

      if (null != bv) {
        nil.secondary = bv

        let bv_loc_wins =
          (nil.url === bv.url) && (
            (nil.row < bv.row) ||
            (nil.row === bv.row && nil.col < bv.col)
          )

        if (bv_loc_wins) {
          nil.row = bv.row
          nil.col = bv.col
          nil.url = bv.url
          nil.primary = bv
          nil.secondary = av
        }
      }
    }

    if (ctx) {
      ctx.err.push(nil)
    }

    return nil
  }

  constructor(why?: any, ctx?: Context) {
    super(null, ctx)
    this.why = why
    this.done = DONE
  }

  unify(_peer: Val, _ctx: Context) {
    return this
  }

  get canon() {
    return 'nil'
  }

  gen(_ctx?: Context) {
    return undefined
  }
}


// A ScalarType for integers. Number includes floats.
class Integer { }



type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarTypeVal extends Val {
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
      else {
        return Nil.make(ctx, 'no-scalar-unify', this, peer)
      }
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

      return UNIFIER(this, peer, ctx)
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


class ScalarVal<T> extends Val {
  type: any
  constructor(peg: T, type: ScalarConstructor, ctx?: Context) {
    super(peg, ctx)
    this.type = type
    this.done = DONE
  }
  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarTypeVal) {
      return peer.unify(this, ctx)
    }
    else {
      return UNIFIER(this, peer, ctx)
    }
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





class MapVal extends Val {
  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
  }

  constructor(peg: ValMap, ctx?: Context) {
    super(peg, ctx)

    let spread = (this.peg as any)[MapVal.SPREAD]
    delete (this.peg as any)[MapVal.SPREAD]

    if (spread) {
      if ('&' === spread.o) {
        this.spread.cj =
          new ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx)
      }
    }
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let out: MapVal = new MapVal({}, ctx)

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj = new ConjunctVal([out.spread.cj, peer.spread.cj], ctx)
        )
      )
    }


    out.done = this.done + 1

    if (this.spread.cj) {
      out.spread.cj =
        DONE !== this.spread.cj.done ? this.spread.cj.unify(TOP, ctx) :
          this.spread.cj
    }


    // console.log(
    //   ('  '.repeat(ctx.path.length)),
    //   'MV spread', this.id, peer.id, out.id, '|',
    //   this.canon, peer.canon, out.canon, '|',
    //   (this.spread.cj || {}).done,
    //   (this.spread.cj || {}).canon, (out.spread.cj || {}).canon)

    let spread_cj = out.spread.cj || TOP

    // Always unify children first
    for (let key in this.peg) {
      let oval = out.peg[key] = this.peg[key].unify(spread_cj, ctx.descend(key))

      done = (done && DONE === out.peg[key].done)

      if (oval instanceof Nil) {
        // ctx.err.push(oval)
      }
    }

    // console.log(
    //   ('  '.repeat(ctx.path.length)),
    //   'MV child ', this.id, peer.id, out.id, '|',
    //   this.canon, peer.canon, out.canon, '|',
    //   this.constructor.name,
    //   peer.constructor.name,
    //   out.constructor.name,
    // )

    if (peer instanceof MapVal) {
      let upeer: MapVal = (peer.unify(TOP, ctx) as MapVal)

      // console.log(
      //   ('  '.repeat(ctx.path.length)),
      //   'MV peer A', this.id, peer.id, out.id, '|',
      //   Object.keys(this.peg), Object.keys(upeer.peg), Object.keys(out.peg))

      for (let peerkey in upeer.peg) {
        let peerchild = upeer.peg[peerkey]
        let child = out.peg[peerkey]

        let oval = out.peg[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                child.unify(peerchild, ctx.descend(peerkey))

        if (this.spread.cj) {
          out.peg[peerkey] = out.peg[peerkey].unify(spread_cj, ctx)
        }

        done = (done && DONE === oval.done)

        if (oval instanceof Nil) {
          // ctx.err.push(oval)
        }

      }

      // console.log(
      //   ('  '.repeat(ctx.path.length)),
      //   'MV peer B', this.id, peer.id, out.id, '|',
      //   Object.keys(this.peg), Object.keys(upeer.peg), Object.keys(out.peg))

      out.done = done ? DONE : out.done

      // console.log(' '.repeat(W) + 'MV OUT A', this.id, out.done, out.id, out.canon)//this.spread.cj, out.spread.cj)

      // console.log(
      //   ('  '.repeat(ctx.path.length)),
      //   'MV out ', this.id, peer.id, out.id, '|',
      //   this.canon, peer.canon, out.canon, '|',
      //   this.constructor.name,
      //   peer.constructor.name,
      //   out.constructor.name,
      // )

      return out
    }
    else {
      out.done = done ? DONE : out.done
      out = (UNIFIER(out, peer, ctx) as MapVal)

      // console.log(' '.repeat(W) + 'MV OUT B', this.id, out.done, out.id, out.canon)//this.spread.cj, out.spread.cj)

      return out
    }
  }

  get canon() {
    let keys = Object.keys(this.peg)
    return '{' +
      (this.spread.cj ? '&=' + this.spread.cj.canon +
        (0 < keys.length ? ',' : '') : '') +
      keys
        .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
      '}'
  }

  gen(ctx?: Context) {
    let out: any = {}
    for (let p in this.peg) {
      out[p] = this.peg[p].gen(ctx)
    }
    return out
  }
}


class ConjunctVal extends Val {
  constructor(peg: Val[], ctx?: Context) {
    super(peg, ctx)
  }

  // NOTE: mutation!
  append(peer: Val): ConjunctVal {
    this.peg.push(peer)
    return this
  }

  unify(peer: Val, ctx: Context): Val {
    let done = true

    // Unify each term of conjunct against peer
    let upeer: Val[] = []

    for (let vI = 0; vI < this.peg.length; vI++) {
      upeer[vI] = this.peg[vI].unify(peer, ctx)
      done = done && DONE === upeer[vI].done
      // // console.log('Ca', vI, this.peg[vI].canon, peer.canon, upeer[vI].canon)

      if (upeer[vI] instanceof Nil) {
        return Nil.make(
          ctx,
          '&peer[' + upeer[vI].canon + ',' + peer.canon + ']',
          this.peg[vI],
          peer
        )
      }
    }

    // // console.log('Cb', upeer.map(x => x.canon))


    // TODO: FIX: conjuncts get replicated inside each other
    // 1&/x => CV[CV[1&/x]]

    // Unify each term of conjunct against following sibling,
    // reducing to smallest conjunct or single val
    let outvals: Val[] = 0 < upeer.length ? [upeer[0]] : []

    let oI = 0
    for (let uI = 1; uI < upeer.length; uI++) {
      // // console.log('Cu', oI, uI, outvals.map(x => x.canon))

      if (outvals[oI] instanceof ConjunctVal) {
        outvals.splice(oI, 0, ...outvals[oI].peg)
        oI += outvals[oI].peg.length
        done = false
      }
      else {
        outvals[oI] = null == outvals[oI] ? upeer[uI] :
          outvals[oI].unify(upeer[uI], ctx)
        done = done && DONE === outvals[oI].done

        // Conjuct fails
        if (outvals[oI] instanceof Nil) {
          return outvals[oI]

          /*
          return Nil.make(
            ctx,
            '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']',
            outvals[oI],
            upeer[uI]
          )
          */
        }
      }
    }

    // // console.log('Cc', outvals.map(x => x.canon), outvals)

    let out: Val

    //let why = ''

    if (0 === outvals.length) {
      //out = Nil.make(ctx, '&empty', this)

      // Empty conjuncts evaporate.
      out = TOP
      //why += 'A'
    }

    // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
    else if (1 === outvals.length) {
      out = outvals[0]
      //why += 'B'
    }
    else {
      out = new ConjunctVal(outvals, ctx)
      //why += 'C'
    }

    // // console.log('Cd', why, out.peg)

    out.done = done ? DONE : this.done + 1

    return out
  }

  // TODO: need a well-defined val order so conjunt canon is always the same
  get canon() {
    return this.peg.map((v: Val) => v.canon).join('&')
  }

  gen(ctx?: Context) {
    if (0 < this.peg.length) {

      // Default is just the first term - does this work?
      // TODO: maybe use a PrefVal() ?
      let v: Val = this.peg[0]


      let out = undefined
      if (undefined !== v && !(v instanceof Nil)) {
        out = v.gen(ctx)
      }
      return out
    }

    return undefined
  }
}




class DisjunctVal extends Val {
  constructor(peg: Val[], ctx?: Context) {
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

    // Conjunction (&) distributes over disjunction (|)
    for (let vI = 0; vI < this.peg.length; vI++) {
      oval[vI] = this.peg[vI].unify(peer, ctx)
      done = done && DONE === oval[vI].done
    }

    // Remove duplicates, and normalize
    if (1 < oval.length) {
      for (let vI = 0; vI < oval.length; vI++) {
        if (oval[vI] instanceof DisjunctVal) {
          oval.splice(vI, 1, ...oval[vI].peg)
        }
      }

      // TODO: not an error Nil!
      let remove = Nil.make(ctx, 'remove')
      for (let vI = 0; vI < oval.length; vI++) {
        for (let kI = vI + 1; kI < oval.length; kI++) {
          if (oval[kI].same(oval[vI])) {
            oval[kI] = remove
          }
        }
      }

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



class RefVal extends Val {
  parts: string[]
  absolute: boolean

  constructor(peg: string, ctx?: Context) {
    super(peg, ctx)
    this.parts = peg.split('/').filter(p => '' != p)
    this.absolute = peg.startsWith('/')
  }

  append(part: string) {
    this.parts.push(part)
    this.peg = (this.absolute ? '/' : '') + this.parts.join('/')
  }

  unify(peer: Val, ctx: Context): Val {
    let resolved = null == ctx ? this : (ctx.find(this) || this)
    let out: Val

    if (resolved instanceof RefVal) {
      if (TOP === peer) {
        out = new RefVal(this.peg, ctx)
      }
      else if (peer instanceof Nil) {
        out = Nil.make(ctx, 'ref[' + this.peg + ']', this, peer)
      }
      else {
        out = new ConjunctVal([this, peer], ctx)
      }
    }
    else {
      //console.log('RVr', resolved.canon, peer.canon)

      out = resolved.unify(peer, ctx)
    }

    out.done = DONE === out.done ? DONE : this.done + 1

    return out
  }

  get canon() {
    return this.peg
  }

  gen(_ctx?: Context) {
    return undefined
  }
}



class PrefVal extends Val {
  pref: Val
  constructor(peg: any, pref?: any, ctx?: Context) {
    super(peg, ctx)
    this.pref = pref || peg
  }

  // PrefVal unify always returns a PrefVal
  // PrevVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: Context): Val {
    let done = true

    //let peer_peg = peer instanceof PrefVal ? peer.peg : peer
    //let peer_pref = peer instanceof PrefVal ? peer.pref : peer

    let out: Val
    /*
          = new PrefVal(
          this.peg.unify(peer_peg, ctx),
          this.pref.unify(peer_pref, ctx),
          ctx
        )
    */

    if (peer instanceof PrefVal) {
      out = new PrefVal(
        this.peg.unify(peer.peg, ctx),
        this.pref.unify(peer.pref, ctx),
        ctx
      )
    }
    else {
      out = new PrefVal(
        this.peg.unify(peer, ctx),
        this.pref.unify(peer, ctx),
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
  DONE,
  Integer,
  Val,
  TOP,
  Nil,
  ScalarTypeVal,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  MapVal,
  ConjunctVal,
  DisjunctVal,
  RefVal,
  PrefVal,
}
