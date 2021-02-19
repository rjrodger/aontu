

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
      base[key] = unify_scalar(base[key], peer[key])
    }

  }

  return basetop
}


function unify_scalar(basescalar: any, peerscalar: any) {
  return peerscalar
}


function Aontu(base: any, peer: any) {
  return unify(base, peer)
}

export {
  Aontu
}
