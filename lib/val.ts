
// Vals are immutable
// NOTE: each Val must handle all parent and child unifications explicitly

/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer 
    -> Scalar/Integer -> IntegerVal

*/


// There can be only one.
const TOP: Val = {
  top: true,

  val: undefined,

  unify(peer: Val): Val {
    return peer
  },

  get canon() { return 'top' },

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
    return self.val === peer.val ? self : new Nil('no-unify-val')
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
  else {
    return new Nil('no-unify')
  }
}


abstract class Val {
  top?: boolean
  val?: any

  constructor(val?: any) {
    this.val = val
  }
  abstract unify(_peer: Val): Val
  abstract get canon(): string
  abstract gen(log: any[]): any
}


class Nil extends Val {
  why: any
  constructor(why?: any) {
    super()
    this.why = why
  }
  unify(_peer: Val) {
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

class Integer { }



type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarTypeVal extends Val {
  constructor(val: ScalarConstructor) {
    super(val)
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





class MapNode {
  base: Val
  peer: Val
  dest: MapVal
  key: string | undefined


  constructor(base: Val, peer: Val, dest: MapVal, key?: string,) {
    this.dest = dest
    this.key = key
    this.base = base
    this.peer = peer
  }
}


class MapVal extends Val {
  id = Math.random()

  constructor(val: { [key: string]: Val }) {
    super(val)
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peertop: Val): Val {
    if (peertop instanceof MapVal) {
      const basetop = this
      if (basetop === peertop) return basetop

      const ns: MapNode[] = [new MapNode(basetop, peertop, basetop)]
      let node: MapNode
      let outbase: MapVal = basetop
      let out: MapVal = basetop
      let first = true

      while ((node = ns.shift() as MapNode)) {
        let base: any = node.base
        let peer: any = node.peer

        if (null != node.key) {
          node.dest.val[node.key] = node.base
        }

        if (null != peer) {
          let peerkeys = Object.keys(peer.val)

          outbase = new MapVal({ ...base.val });
          if (first) {
            out = outbase
            first = false
          }

          if (null != node.key) {
            node.dest.val[node.key] = outbase
          }

          let outval = outbase.val

          for (let pkI = 0; pkI < peerkeys.length; pkI++) {
            let peerkey = peerkeys[pkI]
            let subpeer = peer.val[peerkey]
            let subbase = base.val[peerkey]

            if (subpeer instanceof MapVal || subbase instanceof MapVal) {
              let subnode = new MapNode(subbase, subpeer, outbase, peerkey)
              ns.push(subnode)
            }
            else if (null != subbase && null != subpeer) {
              outval[peerkey] = subbase.unify(subpeer)
            }
            else if (null == subbase && null != subpeer) {
              outval[peerkey] = subpeer
            }
          }

        }
      }

      return out
    }
    else {
      return UNIFIER(this, peertop)
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





class DisjunctVal extends Val {
  constructor(val: Val[]) {
    super(val)
  }
  append(peer: Val): DisjunctVal {
    return new DisjunctVal([...this.val, peer])
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
  DisjunctVal,
}
