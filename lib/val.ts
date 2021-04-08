
// Vals are immutable
// NOTE: each Val must handle all parent and child unifications explicitly

/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer 
    -> Scalar/Integer -> IntegerVal

*/


const DONE = -1

// There can be only one.
const TOP: Val = {
  top: true,
  val: undefined,
  done: DONE,

  unify(peer: Val): Val {
    if (peer instanceof DisjunctVal) {
      return peer.unify(this)
    }
    else if (peer instanceof ConjunctVal) {
      return peer.unify(this)
    }
    else if (peer instanceof RefVal) {
      return peer.unify(this)
    }
    else {
      return peer
    }
  },

  get canon() { return 'top' },
  get dc() { return 'top' },



  gen: (_log: any[]) => {
    // TOPs evaporate
    return undefined
  },

}

const UNIFIER = (self: Val, peer: Val): Val => {
  if (peer === TOP) {
    return self
  }
  else if (self === TOP) {
    return peer
  }
  else if (self.constructor === peer.constructor) {
    return self.val === peer.val ? self :
      new Nil('no-unify-val:[' + self.canon + ',' + peer.canon + ']')
  }
  else if (peer instanceof Nil) {
    return peer
  }
  else if (self instanceof Nil) {
    return self
  }
  else if (peer instanceof DisjunctVal) {
    return peer.unify(self)
  }
  else if (peer instanceof ConjunctVal) {
    return peer.unify(self)
  }
  else if (peer instanceof RefVal) {
    return peer.unify(self)
  }
  else {
    return new Nil('no-unify:' + self.canon + ',' + peer.canon)
  }
}


abstract class Val {
  top?: boolean
  val?: any
  done: number = 0

  constructor(val?: any) {
    this.val = val
  }
  abstract unify(_peer: Val): Val
  abstract get canon(): string
  abstract gen(log: any[]): any

  get dc() {
    return this.canon + '/*d' + this.done + '*/'
  }

}


class Nil extends Val {
  why: any
  constructor(why?: any) {
    super()
    this.why = why
    this.done = DONE
  }
  unify(_peer: Val) {
    return this
  }
  get canon() {
    return 'nil:' + this.why
  }
  gen(log: any[]) {
    // This is an error.
    log.push('nil')
    return undefined
  }
}

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

  unify(peer: Val): Val {
    //console.log('ScalarTypeVal.unify',
    //  peer, (peer as any).type, this.val, (peer as any).type === this.val)

    if (peer instanceof ScalarVal) {
      if (peer.type === this.val) {
        //console.log('AAA')
        return peer
      }
      else if (Number === this.val && Integer === peer.type) {
        return peer
      }
      else {
        return new Nil('no-scalar-unify')
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

      return UNIFIER(this, peer)
    }
  }

  get canon() {
    return (this.val as any).name.toLowerCase()
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
  unify(peer: Val): Val {
    if (peer instanceof ScalarTypeVal) {
      return peer.unify(this)
    }
    else {
      return UNIFIER(this, peer)
    }
  }
  get canon() {
    return (this.val as any).toString()
  }
  gen(_log: any[]) {
    return this.val
  }
}


class NumberVal extends ScalarVal<number> {
  constructor(val: number) {
    super(val, Number)
  }
  unify(peer: Val): Val {
    if (peer instanceof ScalarVal && peer.type === Integer) {
      return peer
    }
    else {
      return super.unify(peer)
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
  unify(peer: Val): Val {
    if (peer instanceof ScalarTypeVal && peer.val === Number) {
      return this
    }
    else if (peer instanceof ScalarVal &&
      peer.type === Number &&
      this.val === peer.val) {
      return this
    }
    else {
      return super.unify(peer)
    }
  }
}


class StringVal extends ScalarVal<string> {
  constructor(val: string) {
    super(val, String)
  }
  unify(peer: Val): Val {
    return super.unify(peer)
  }
  get canon() {
    return JSON.stringify(this.val)
  }

}


class BooleanVal extends ScalarVal<boolean> {
  constructor(val: boolean) {
    super(val, Boolean)
  }
  unify(peer: Val): Val {
    return super.unify(peer)
  }

  static TRUE = new BooleanVal(true)
  static FALSE = new BooleanVal(false)
}





class MapVal extends Val {
  id = 'v' + ('' + Math.random()).substr(3, 5)

  constructor(val: { [key: string]: Val }) {
    super(val)
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peer: Val): Val {
    let done: boolean = true
    let out: MapVal = this

    if (DONE !== this.done) {
      out = new MapVal({})
      out.done = this.done + 1

      // Always unify children against TOP first
      for (let key in this.val) {
        out.val[key] = this.val[key].unify(TOP)
        done = (done && DONE === out.val[key].done)
      }
    }


    if (peer instanceof MapVal) {
      let upeer: MapVal = (peer.unify(TOP) as MapVal)

      for (let peerkey in upeer.val) {
        let peerchild = upeer.val[peerkey]
        let child = this.val[peerkey]

        out.val[peerkey] = undefined === child ? peerchild : child.unify(peerchild)
        done = (done && DONE === out.val[peerkey].done)
      }

      out.done = done ? DONE : out.done
      return out
    }
    else {
      out.done = done ? DONE : out.done
      return UNIFIER(out, peer)
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
  unify(peer: Val): Val {
    let done = true

    let upeer: Val[] = []

    for (let vI = 0; vI < this.val.length; vI++) {
      upeer[vI] = this.val[vI].unify(peer)
      done = done && DONE === upeer[vI].done
      console.log('Ca', vI, this.val[vI].canon, peer.canon, upeer[vI].canon)

      if (upeer[vI] instanceof Nil) {
        return new Nil('&peer[' + upeer[vI].canon + ',' + peer.canon + ']')
      }
    }

    console.log('Cb', ...upeer.map(x => x.canon))

    let outvals: Val[] = 0 < upeer.length ? [upeer[0]] : []

    let oI = 0
    for (let uI = 1; uI < upeer.length; uI++) {
      if (outvals[oI] instanceof ConjunctVal) {
        outvals.splice(oI, 0, ...outvals[oI].val)
        oI += outvals[oI].val.length
        done = false
      }
      else {
        outvals[oI] = null == outvals[oI] ? upeer[uI] : outvals[oI].unify(upeer[uI])
        done = done && DONE === outvals[oI].done

        if (outvals[oI] instanceof Nil) {
          return new Nil('&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']')
        }
      }
    }

    let out: Val

    if (0 === outvals.length) {
      out = new Nil('&empty')
    }
    else if (1 === outvals.length) {
      out = outvals[0]
    }
    else {
      out = new ConjunctVal(outvals)
    }

    out.done = done ? DONE : this.done + 1

    return out
  }
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
  unify(peer: Val): Val {
    let out: Val[] = []

    for (let vI = 0; vI < this.val.length; vI++) {
      out[vI] = this.val[vI].unify(peer)
    }

    out = out.filter(v => !(v instanceof Nil))

    return new DisjunctVal(out)
  }
  get canon() {
    return this.val.map((v: Val) => v.canon).join('|')
  }
  gen(log: any[]) {
    if (0 < this.val.length) {

      // Default is just the first term - does this work?
      // TODO: maybe use a PrefVal() ?
      let v: Val = this.val[0]

      /*
      for (let vI = 1; vI < this.val.length; vI++) {
        if (v instanceof Nil) {
          v = this.val[vI]
        }
        else if (!(this.val[vI] instanceof Nil)) {
          v = this.val[vI].unify(v)
        }
      }

      console.log('DJ', v)
      */

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



class RefVal extends Val {
  constructor(val: string) {
    super(val)
  }
  unify(peer: Val): Val {
    let resolved = '1' === this.val ? new IntegerVal(1) : this
    console.log('UREF', this.val, peer, resolved)

    let out: Val

    if (resolved instanceof RefVal) {
      if (TOP === peer) {
        out = new RefVal(this.val)
      }
      else if (peer instanceof Nil) {
        out = new Nil('ref[' + this.val + ']')
      }
      else {
        out = new ConjunctVal([this, peer])
      }
    }
    else {
      out = resolved.unify(peer)
    }

    out.done = DONE === out.done ? DONE : this.done + 1

    return out
  }
  get canon() {
    return 'REF[' + this.val + ']'
  }
  gen(log: any[]) {
    log.push(this.canon)
    return undefined
  }
}







export {
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
}
