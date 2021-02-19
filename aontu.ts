

class Node {
  base: any
  peer: any

  constructor(base: any, peer: any) {
    this.base = base
    this.peer = peer
  }
}


class Val {
  val: any

  constructor(val: any) {
    this.val = val
  }
}

class DefaultVal extends Val {
  type: any

  constructor(type: any, val: any) {
    super(val)
    this.type = type
  }
}


function unify(basetop: any, peertop: any) {

  const ns: Node[] = [new Node(basetop, peertop)]
  let node: Node

  while (node = (ns.shift() as Node)) {
    let base: any = node.base
    let peer: any = node.peer

    let peerkeys = Object.keys(peer)
    //console.log('peerkeys', peerkeys)
    for (let pkI = 0; pkI < peerkeys.length; pkI++) {
      let key = peerkeys[pkI]
      let subpeer = peer[key]
      let subbase = base[key]
      let subpeertype = typeof (subpeer)
      let subbasetype = typeof (subbase)

      if (subpeer instanceof Val || subbase instanceof Val) {
        base[key] = unify_scalar(key, subbase, subpeer, true)
      }
      else if ('object' === subpeertype || 'object' === subbasetype) {
        if (undefined === subbase) {
          base[key] = subpeer
        }
        else {
          let subnode = new Node(subbase, subpeer)
          //console.log('PN', subnode)
          ns.push(subnode)
        }
      }
      else {
        base[key] = unify_scalar(key, subbase, subpeer, true)
      }
    }

  }

  return basetop
}


function unify_scalar(key: string, basescalar: any, peerscalar: any, commute: boolean): any {
  // console.log('US', key, basescalar, peerscalar, commute)

  let basetype = typeof (basescalar)

  if (undefined === peerscalar) {
    return basescalar
  }
  else if (String === peerscalar && 'string' === basetype) {
    return basescalar
  }
  else if (Number === peerscalar && 'number' === basetype) {
    return basescalar
  }
  else if (peerscalar instanceof DefaultVal) {
    if (undefined === basescalar) {
      return peerscalar.val
    }
    else if (basescalar === peerscalar.type) {
      return peerscalar
    }
    else if (basetype === peerscalar.type.name.toLowerCase()) {
      return basescalar
    }
  }
  else if (commute) {
    return unify_scalar(key, peerscalar, basescalar, false)
  }

  // TODO: collect instead
  throw new Error('NU: ' + basescalar + ' =/= ' + peerscalar)

}


function evaluate(top: any): any {
  let ns: any = [{ top: top }]
  let node: any
  while (node = ns.pop()) {
    if ('object' === typeof (node)) {
      let keys = Object.keys(node)
      for (let kI = 0; kI < keys.length; kI++) {
        let key = keys[kI]
        let val = node[key]
        if (val instanceof Val) {
          node[key] = val.val
        }
        else if ('object' === typeof (val)) {
          ns.push(val)
        }
      }
    }
  }
  return top
}


function Aontu(base: any, peer: any) {
  let unity = unify(base, peer)
  let value = evaluate(unity)
  return value
}



export {
  Aontu,
  evaluate,
  unify,
  DefaultVal,
}
