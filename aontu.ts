

class Node {
  base: any
  peer: any

  constructor(base: any, peer: any) {
    this.base = base
    this.peer = peer
  }
}


function unify(basetop: any, peertop: any) {

  const ns: Node[] = [new Node(basetop, peertop)]
  let node: Node

  while (node = (ns.shift() as Node)) {
    let base: any = node.base
    let peer: any = node.peer

    let peerkeys = Object.keys(peer)
    for (let pkI = 0; pkI < peerkeys.length; pkI++) {
      let key = peerkeys[pkI]
      let subpeer = peer[key]
      let subbase = base[key]
      let subpeertype = typeof (subpeer)

      if ('object' === subpeertype) {
        if (undefined == subbase) {
          base[key] = subpeer
        }
        else {
          let subnode = new Node(subbase, subpeer)
          ns.push(subnode)
        }
      }
      else {
        base[key] = unify_scalar(subbase, subpeer, true)
      }
    }

  }

  return basetop
}


function unify_scalar(basescalar: any, peerscalar: any, commute: boolean): any {
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
  else if (commute) {
    return unify_scalar(peerscalar, basescalar, false)
  }
  else {
    // TODO: collect instead
    throw new Error('NU: ' + basescalar + ' =/= ' + peerscalar)
  }
}


function Aontu(base: any, peer: any) {
  return unify(base, peer)
}

export {
  Aontu
}
