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
  Path,
} from './unify'


const DONE = -1


// TODO: move to Context to make repeatable
let valcount = 1_000_000_000

// There can be only one.
const TOP: Val = {
  id: 'V0',
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

  gen: (_log: any[]) => {
    // TOPs evaporate
    return undefined
  },

}

const UNIFIER = (self: Val, peer: Val, ctx: Context): Val => {
  //ctx.map.url[self.url] = true
  //ctx.map.url[peer.url] = true

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
  // TODO: REVIEW: maybe this should just be a counter?
  id = 'V' + valcount++

  // TODO: need a separate counter for parse-created first versions?
  // TODO: rename, this is a counter, not just a flag, confuses with local boolean `done`
  done: number = 0
  path: string[]
  row: number = -1
  col: number = -1
  url: string = ''

  top?: boolean

  // Actual native value.
  peg?: any

  // TODO: used for top level result - not great
  // map?: any
  deps?: any

  constructor(peg?: any, path?: Path) {
    this.peg = peg
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
  nil = true
  why: any

  static make = (ctx?: Context, why?: any, av?: Val, bv?: Val) => {
    let path = ctx ? ctx.path : []
    let nil = new Nil(path, why)
    let first = null == bv ? av : (null != av && null != bv) ?
      (av.row === bv.row ? (av.col <= bv.col ? av : bv) :
        (av.row <= bv.row ? av : bv)) : null

    if (first) {
      nil.row = first.row
      nil.col = first.col
    }

    return nil
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
  constructor(peg: ScalarConstructor) {
    super(peg)
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

  gen(log: any[]) {
    // This is an error.
    log.push('ScalarTypeVal<' + this.canon + '>')
    return undefined
  }

}


class ScalarVal<T> extends Val {
  type: any
  constructor(peg: T, type: ScalarConstructor) {
    super(peg)
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

  gen(_log: any[]) {
    return this.peg
  }
}


class NumberVal extends ScalarVal<number> {
  constructor(peg: number) {
    super(peg, Number)
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
  constructor(peg: number) {
    if (!Number.isInteger(peg)) {
      throw new Error('not-integer')
    }
    super(peg, Integer)
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
  constructor(peg: string) {
    super(peg, String)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }
  get canon() {
    return JSON.stringify(this.peg)
  }

}


class BooleanVal extends ScalarVal<boolean> {
  constructor(peg: boolean) {
    super(peg, Boolean)
  }
  unify(peer: Val, ctx: Context): Val {
    return super.unify(peer, ctx)
  }

  static TRUE = new BooleanVal(true)
  static FALSE = new BooleanVal(false)
}





class MapVal extends Val {
  static SPREAD = Symbol('spread')

  spread = {
    cj: (undefined as Val | undefined),
    dj: (undefined as Val | undefined),
  }

  constructor(peg: { [key: string]: Val }) {
    super(peg)

    let spread = (this.peg as any)[MapVal.SPREAD]
    delete (this.peg as any)[MapVal.SPREAD]

    // TODO: spread.v should parse as array
    if (spread) {
      if ('&' === spread.o) {
        this.spread.cj =
          new ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v])
      }

      // TODO: implement in unify
      else if ('|' === spread.o) {
        this.spread.dj =
          new DisjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v])
      }
    }
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val, ctx: Context): Val {
    // TODO: is it sufficient to capture source urls just here and in TOP?
    //ctx.map.url[this.url] = true
    //ctx.map.url[peer.url] = true

    //console.log('MV', this.canon, this.url, peer.canon, peer.url)

    let done: boolean = true
    let out: MapVal = new MapVal({})

    out.spread.cj = this.spread.cj

    if (peer instanceof MapVal) {
      out.spread.cj = null == out.spread.cj ? peer.spread.cj : (
        null == peer.spread.cj ? out.spread.cj : (
          out.spread.cj = new ConjunctVal([out.spread.cj, peer.spread.cj])
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
        ctx.err.push(oval)
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
          ctx.err.push(oval)
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


  gen(log: any[]) {
    let out: any = {}
    for (let p in this.peg) {
      out[p] = this.peg[p].gen(log)
    }
    return out
  }

}



class ConjunctVal extends Val {
  constructor(peg: Val[]) {
    super(peg)
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
          return Nil.make(
            ctx,
            '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']',
            outvals[oI],
            upeer[uI]
          )
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
      out = new ConjunctVal(outvals)
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

  gen(log: any[]) {
    if (0 < this.peg.length) {

      // Default is just the first term - does this work?
      // TODO: maybe use a PrefVal() ?
      let v: Val = this.peg[0]


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
  constructor(peg: Val[]) {
    super(peg)
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
      out = new DisjunctVal(oval)
    }

    out.done = done ? DONE : this.done + 1

    return out
  }
  get canon() {
    return this.peg.map((v: Val) => v.canon).join('|')
  }
  gen(log: any[]) {
    if (0 < this.peg.length) {

      let vals = this.peg.filter((v: Val) => v instanceof PrefVal)

      vals = 0 === vals.length ? this.peg : vals

      let val = vals[0]

      for (let vI = 1; vI < this.peg.length; vI++) {
        val = val.unify(this.peg[vI])
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

  constructor(peg: string) {
    super(peg)
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
        out = new RefVal(this.peg)
      }
      else if (peer instanceof Nil) {
        out = Nil.make(ctx, 'ref[' + this.peg + ']', this, peer)
      }
      else {
        out = new ConjunctVal([this, peer])
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
  gen(log: any[]) {
    log.push(this.canon)
    return undefined
  }
}



class PrefVal extends Val {
  pref: Val
  constructor(peg: any, pref?: any) {
    super(peg)
    this.pref = pref || peg
  }

  // PrefVal unify always returns a PrefVal
  // PrevVals can only be removed by becoming Nil in a Disjunct
  unify(peer: Val, ctx: Context): Val {
    let done = true

    // console.log('PV A', this.canon, peer.canon)

    let out: Val
    if (peer instanceof PrefVal) {
      out = new PrefVal(
        this.peg.unify(peer.peg, ctx),
        this.pref.unify(peer.pref, ctx)
      )
    }
    else {
      out = new PrefVal(
        this.peg.unify(peer, ctx),
        this.pref.unify(peer, ctx)
      )
    }

    done = done && DONE === out.peg.done &&
      (null != (out as PrefVal).pref ? DONE === (out as PrefVal).pref.done : true)

    // console.log('PV', done, out.peg.done, (out as PrefVal).pref.done)

    // console.log('PV B', out.canon)

    if (out.peg instanceof Nil) {
      out = (out as PrefVal).pref
    }
    else if ((out as PrefVal).pref instanceof Nil) {
      out = out.peg
    }

    out.done = done ? DONE : this.done + 1

    // console.log('PV C', out.canon)

    return out
  }

  get canon() {
    return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
  }

  gen(log: any[]) {
    log.push(this.canon)

    let val = !(this.pref instanceof Nil) ? this.pref :
      !(this.peg instanceof Nil) ? this.peg :
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
