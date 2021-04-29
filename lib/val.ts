/* Copyright (c) 2021 Richard Rodger, MIT License */


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
  Path,
} from './unify'


const DONE = -1


// TODO: move to Context to make repeatable
let valcount = 1_000_000_000

// There can be only one.
const TOP: Val = {
  id: 'V0',
  top: true,
  val: undefined,
  done: DONE,
  path: [],

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

  gen: (_log: any[]) => {
    // TOPs evaporate
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
    return self.val === peer.val ? self :
      Nil.make(ctx, 'no-unify-val<' + self.canon + '&' + peer.canon + '>')
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
    return Nil.make(ctx, 'no-unify<' + self.canon + '&' + peer.canon + '>')
  }
}


abstract class Val {
  // TODO: REVIEW: maybe this should just be a counter?
  id = 'V' + valcount++
  // TODO: need a separate counter for parse-created first versions?

  done: number = 0
  path: string[]
  top?: boolean

  // TODO: RENAME: confusion with Val
  val?: any

  constructor(val?: any, path?: Path) {
    this.val = val
    this.path = path || []
  }

  same(peer: Val): boolean {
    return this === peer
  }

  abstract unify(peer: Val, ctx: Context): Val
  abstract get canon(): string
  abstract gen(log: any[]): any

}



class Nil extends Val {
  why: any

  static make = (ctx: Context, why?: any) => {
    return new Nil(ctx.path, why)
  }

  constructor(path: Path, why?: any) {
    super(null, path)
    this.why = why
    this.done = DONE
  }
  unify(_peer: Val, _ctx: Context) {
    return this
  }

  get canon() {
    return 'nil'
  }

  gen(log: any[]) {
    // This is an error.
    log.push('nil')
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
  constructor(val: ScalarConstructor) {
    super(val)
    this.done = DONE
  }

  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarVal) {
      if (peer.type === this.val) {
        return peer
      }
      else if (Number === this.val && Integer === peer.type) {
        return peer
      }
      else {
        return Nil.make(ctx, 'no-scalar-unify')
      }
    }
    else {
      if (peer instanceof ScalarTypeVal) {
        if (Number === this.val && Integer === peer.val) {
          return peer
        }
        else if (Number === peer.val && Integer === this.val) {
          return this
        }
      }

      return UNIFIER(this, peer, ctx)
    }
  }

  get canon() {
    let ctor = (this.val as any)
    return ctor.name.toLowerCase()
  }

  same(peer: Val): boolean {
    return peer instanceof ScalarTypeVal ? this.val === peer.val : super.same(peer)
  }

  gen(log: any[]) {
    // This is an error.
    log.push('ScalarTypeVal<' + this.canon + '>')
    return undefined
  }

}


class ScalarVal<T> extends Val {
  type: any
  constructor(val: T, type: ScalarConstructor) {
    super(val)
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
    return (this.val as any).toString()
  }
  same(peer: Val): boolean {
    return peer instanceof ScalarVal ? peer.val === this.val : super.same(peer)
  }

  gen(_log: any[]) {
    return this.val
  }
}


class NumberVal extends ScalarVal<number> {
  constructor(val: number) {
    super(val, Number)
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
  constructor(val: number) {
    if (!Number.isInteger(val)) {
      throw new Error('not-integer')
    }
    super(val, Integer)
  }
  unify(peer: Val, ctx: Context): Val {
    if (peer instanceof ScalarTypeVal && peer.val === Number) {
      return this
    }
    else if (peer instanceof ScalarVal &&
      peer.type === Number &&
      this.val === peer.val) {
      return this
    }
    else {
      return super.unify(peer, ctx)
    }
  }
}


class StringVal extends ScalarVal<string> {
  constructor(val: string) {
    super(val, String)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }
  get canon() {
    return JSON.stringify(this.val)
  }

}


class BooleanVal extends ScalarVal<boolean> {
  constructor(val: boolean) {
    super(val, Boolean)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }

  static TRUE = new BooleanVal(true)
  static FALSE = new BooleanVal(false)
}





class MapVal extends Val {
  constructor(val: { [key: string]: Val }) {
    super(val)
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    let done: boolean = true
    let out: MapVal = this

    if (DONE !== this.done) {
      out = new MapVal({})
      out.done = this.done + 1

      // Always unify children against TOP first
      for (let key in this.val) {
        let oval = out.val[key] = this.val[key].unify(TOP, ctx.descend(key))
        done = (done && DONE === out.val[key].done)

        if (oval instanceof Nil) {
          ctx.err.push(oval)
        }
      }
    }


    if (peer instanceof MapVal) {
      let upeer: MapVal = (peer.unify(TOP, ctx) as MapVal)

      for (let peerkey in upeer.val) {
        let peerchild = upeer.val[peerkey]
        let child = out.val[peerkey]

        let oval = out.val[peerkey] =
          undefined === child ? peerchild :
            child instanceof Nil ? child :
              peerchild instanceof Nil ? peerchild :
                child.unify(peerchild, ctx.descend(peerkey))

        done = (done && DONE === oval.done)

        if (oval instanceof Nil) {
          ctx.err.push(oval)
        }

      }

      out.done = done ? DONE : out.done
      return out
    }
    else {
      out.done = done ? DONE : out.done
      return UNIFIER(out, peer, ctx)
    }
  }

  get canon() {
    return '{' + Object.keys(this.val)
      .map(k => [JSON.stringify(k) + ':' + this.val[k].canon]).join(',') + '}'
  }


  gen(log: any[]) {
    let out: any = {}
    for (let p in this.val) {
      out[p] = this.val[p].gen(log)
    }
    return out
  }

}



class ConjunctVal extends Val {
  constructor(val: Val[]) {
    super(val)
  }
  append(peer: Val): ConjunctVal {
    return new ConjunctVal([...this.val, peer])
  }
  prepend(peer: Val): ConjunctVal {
    return new ConjunctVal([peer, ...this.val])
  }
  unify(peer: Val, ctx: Context): Val {
    let done = true


    // Unify each term of conjunct against peer
    let upeer: Val[] = []

    for (let vI = 0; vI < this.val.length; vI++) {
      upeer[vI] = this.val[vI].unify(peer, ctx)
      done = done && DONE === upeer[vI].done
      // console.log('Ca', vI, this.val[vI].canon, peer.canon, upeer[vI].canon)

      if (upeer[vI] instanceof Nil) {
        return Nil.make(ctx, '&peer[' + upeer[vI].canon + ',' + peer.canon + ']')
      }
    }

    // console.log('Cb', upeer.map(x => x.canon))


    // TODO: FIX: conjuncts get replicated inside each other
    // 1&/x => CV[CV[1&/x]]

    // Unify each term of conjunct against following sibling,
    // reducing to smallest conjunct or single val
    let outvals: Val[] = 0 < upeer.length ? [upeer[0]] : []

    let oI = 0
    for (let uI = 1; uI < upeer.length; uI++) {
      // console.log('Cu', oI, uI, outvals.map(x => x.canon))

      if (outvals[oI] instanceof ConjunctVal) {
        outvals.splice(oI, 0, ...outvals[oI].val)
        oI += outvals[oI].val.length
        done = false
      }
      else {
        outvals[oI] = null == outvals[oI] ? upeer[uI] :
          outvals[oI].unify(upeer[uI], ctx)
        done = done && DONE === outvals[oI].done

        // Conjuct fails
        if (outvals[oI] instanceof Nil) {
          return Nil.make(ctx,
            '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']')
        }
      }
    }

    // console.log('Cc', outvals.map(x => x.canon), outvals)

    let out: Val

    //let why = ''

    if (0 === outvals.length) {
      out = Nil.make(ctx, '&empty')
      //why += 'A'
    }

    // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
    else if (1 === outvals.length) {
      out = outvals[0]
      //why += 'B'
    }
    else {
      out = new ConjunctVal(outvals)
      //why += 'C'
    }

    // console.log('Cd', why, out.val)

    out.done = done ? DONE : this.done + 1

    return out
  }

  // TODO: need a well-defined val order so conjunt canon is always the same
  get canon() {
    return this.val.map((v: Val) => v.canon).join('&')
  }

  gen(log: any[]) {
    if (0 < this.val.length) {

      // Default is just the first term - does this work?
      // TODO: maybe use a PrefVal() ?
      let v: Val = this.val[0]


      let out = undefined
      if (undefined !== v && !(v instanceof Nil)) {
        out = v.gen(log)
      }
      else {
        log.push('nil:|:none=' + this.canon)
      }
      return out
    }
    else {
      log.push('nil:|:empty=' + this.canon)
      return undefined
    }
  }
}






class DisjunctVal extends Val {
  constructor(val: Val[]) {
    super(val)
  }
  append(peer: Val): DisjunctVal {
    return new DisjunctVal([...this.val, peer])
  }
  prepend(peer: Val): ConjunctVal {
    return new DisjunctVal([peer, ...this.val])
  }
  unify(peer: Val, ctx: Context): Val {
    let done = true

    let oval: Val[] = []

    // Conjunction (&) distributes over disjunction (|)
    for (let vI = 0; vI < this.val.length; vI++) {
      oval[vI] = this.val[vI].unify(peer, ctx)
      done = done && DONE === oval[vI].done
    }

    // Remove duplicates, and normalize
    if (1 < oval.length) {
      for (let vI = 0; vI < oval.length; vI++) {
        if (oval[vI] instanceof DisjunctVal) {
          oval.splice(vI, 1, ...oval[vI].val)
        }
      }

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
      return Nil.make(ctx, '|:empty')
    }
    else {
      out = new DisjunctVal(oval)
    }

    out.done = done ? DONE : this.done + 1

    return out
  }
  get canon() {
    return this.val.map((v: Val) => v.canon).join('|')
  }
  gen(log: any[]) {
    if (0 < this.val.length) {

      let vals = this.val.filter((v: Val) => v instanceof PrefVal)

      vals = 0 === vals.length ? this.val : vals

      let val = vals[0]

      for (let vI = 1; vI < this.val.length; vI++) {
        val = val.unify(this.val[vI])
      }

      return val.gen(log)
    }
    else {
      log.push('nil:|:empty=' + this.canon)
      return undefined
    }
  }
}



class RefVal extends Val {
  parts: string[]
  absolute: boolean

  constructor(val: string) {
    super(val)
    this.parts = val.split('/').filter(p => '' != p)
    this.absolute = val.startsWith('/')
  }

  append(part: string) {
    this.parts.push(part)
    this.val = (this.absolute ? '/' : '') + this.parts.join('/')
  }

  unify(peer: Val, ctx: Context): Val {
    let resolved = null == ctx ? this : (ctx.find(this) || this)
    let out: Val

    if (resolved instanceof RefVal) {
      if (TOP === peer) {
        out = new RefVal(this.val)
      }
      else if (peer instanceof Nil) {
        out = Nil.make(ctx, 'ref[' + this.val + ']')
      }
      else {
        out = new ConjunctVal([this, peer])
      }
    }
    else {
      out = resolved.unify(peer, ctx)
    }

    out.done = DONE === out.done ? DONE : this.done + 1

    return out
  }
  get canon() {
    return this.val
  }
  gen(log: any[]) {
    log.push(this.canon)
    return undefined
  }
}



class PrefVal extends Val {
  pref: Val
  constructor(val: any, pref?: any) {
    super(val)
    this.pref = pref || val
  }

  // PrefVal unify always returns a PrefVal
  // PrevVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: Context): Val {
    let out: Val
    if (peer instanceof PrefVal) {
      out = new PrefVal(
        this.val.unify(peer.val, ctx),
        this.pref.unify(peer.pref, ctx)
      )
    }
    else {
      out = new PrefVal(
        this.val.unify(peer, ctx),
        this.pref.unify(peer, ctx)
      )
    }

    if (out.val instanceof Nil) {
      out = (out as PrefVal).pref
    }
    else if ((out as PrefVal).pref instanceof Nil) {
      out = out.val
    }

    return out
  }

  get canon() {
    return this.pref instanceof Nil ? this.val.canon : '*' + this.pref.canon
  }

  gen(log: any[]) {
    log.push(this.canon)

    let val = !(this.pref instanceof Nil) ? this.pref :
      !(this.val instanceof Nil) ? this.val :
        undefined

    return undefined === val ? undefined : val.gen(log)
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
