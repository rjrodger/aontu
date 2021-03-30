
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
const TOP: Val<unknown> = {
  val: undefined,

  unify(peer: Val<any>): Val<any> {
    return peer
  },
}

const UNIFIER = (self: Val<any>, peer: Val<any>): Val<any> => {
  if (peer === TOP) {
    return self
  }
  else if (self === TOP) {
    return peer
  }
  else if (self.constructor === peer.constructor) {
    return self.val === peer.val ? self : new Bottom('no-unify-val')
  }
  else if (peer instanceof Bottom) {
    return peer
  }
  else if (self instanceof Bottom) {
    return self
  }
  else {
    return new Bottom('no-unify')
  }
}


abstract class Val<T> {
  val?: T

  constructor(val?: T) {
    this.val = val
  }
  abstract unify(_peer: Val<any>): Val<any>
  //abstract get canon(): string
}


class Bottom extends Val<unknown> {
  why: any
  constructor(why: any) {
    super()
    this.why = why
  }
  unify(_peer: Val<any>) {
    return this
  }
  //get canon() {
  //  return 'bottom'
  //}
}

class Integer {
  //static subsume(child: ScalarTypeVal) { return Number.isInteger(child.val) }
}


type ScalarConstructor =
  StringConstructor |
  NumberConstructor |
  BooleanConstructor |
  (typeof Integer.constructor)


class ScalarTypeVal extends Val<unknown> {
  constructor(val: ScalarConstructor) {
    super(val)
  }
  unify(peer: Val<any>): Val<any> {
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
        return new Bottom('no-scalar-unify')
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

      console.log('BBB')
      return UNIFIER(this, peer)
    }
  }
}


class ScalarVal<T> extends Val<unknown> {
  type: any
  constructor(val: T, type: ScalarConstructor) {
    super(val)
    this.type = type
  }
  unify(peer: Val<any>): Val<any> {
    if (peer instanceof ScalarTypeVal) {
      return peer.unify(this)
    }
    else {
      return UNIFIER(this, peer)
    }
  }
}


class NumberVal extends ScalarVal<number> {
  constructor(val: number) {
    super(val, Number)
  }
  unify(peer: Val<any>): Val<any> {
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
  unify(peer: Val<any>): Val<any> {
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
  unify(peer: Val<any>): Val<any> {
    return super.unify(peer)
  }
}


class BooleanVal extends ScalarVal<boolean> {
  constructor(val: boolean) {
    super(val, Boolean)
  }
  unify(peer: Val<any>): Val<any> {
    return super.unify(peer)
  }

  static TRUE = new BooleanVal(true)
  static FALSE = new BooleanVal(false)
}





class MapNode {
  base: Val<any>
  peer: Val<any>
  dest: MapVal
  key: string | undefined


  constructor(base: Val<any>, peer: Val<any>, dest: MapVal, key?: string,) {
    this.dest = dest
    this.key = key
    this.base = base
    this.peer = peer
  }
}


class MapVal extends Val<any> {
  id = Math.random()

  constructor(val: { [key: string]: Val<any> }) {
    super(val)
  }

  // NOTE: order of keys is not preserved!
  // not possible in any case - consider {a,b} unify {b,a}
  unify(peertop: Val<any>): Val<any> {
    if (peertop instanceof MapVal) {
      const basetop = this
      if (basetop === peertop) return basetop

      const ns: MapNode[] = [new MapNode(basetop, peertop, basetop)]
      let node: MapNode
      let outbase: MapVal = basetop
      let out: MapVal = basetop
      let first = true

      while ((node = ns.shift() as MapNode)) {
        console.log('NA', ns.length, node)

        let base: any = node.base
        let peer: any = node.peer

        if (null != node.key) {
          node.dest.val[node.key] = node.base
        }

        if (null != peer) {
          let peerkeys = Object.keys(peer.val)
          console.log('PK', peerkeys)

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

        console.log('NB', ns.length)
      }

      return out
    }
    else {
      return UNIFIER(this, peertop)
    }
  }
}









export {
  Val,
  TOP,
  Bottom,
  ScalarTypeVal,
  NumberVal,
  StringVal,
  BooleanVal,
  IntegerVal,
  MapVal,
  Integer,
}
