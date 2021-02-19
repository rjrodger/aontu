"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aontu = void 0;
class Node {
    constructor(base, peer) {
        this.base = base;
        this.peer = peer;
    }
}
function unify(basetop, peertop) {
    const ns = [new Node(basetop, peertop)];
    let node;
    while (node = ns.shift()) {
        let base = node.base;
        let peer = node.peer;
        let peerkeys = Object.keys(peer);
        for (let pkI = 0; pkI < peerkeys.length; pkI++) {
            let key = peerkeys[pkI];
            let subpeer = peer[key];
            let subbase = base[key];
            let subpeertype = typeof (subpeer);
            if ('object' === subpeertype) {
                if (undefined == subbase) {
                    base[key] = subpeer;
                }
                else {
                    let subnode = new Node(subbase, subpeer);
                    ns.push(subnode);
                }
            }
            else {
                base[key] = unify_scalar(subbase, subpeer, true);
            }
        }
    }
    return basetop;
}
function unify_scalar(basescalar, peerscalar, commute) {
    let basetype = typeof (basescalar);
    if (undefined === peerscalar) {
        return basescalar;
    }
    else if (String === peerscalar && 'string' === basetype) {
        return basescalar;
    }
    else if (Number === peerscalar && 'number' === basetype) {
        return basescalar;
    }
    else if (commute) {
        return unify_scalar(peerscalar, basescalar, false);
    }
    else {
        // TODO: collect instead
        throw new Error('NU: ' + basescalar + ' =/= ' + peerscalar);
    }
}
function Aontu(base, peer) {
    return unify(base, peer);
}
exports.Aontu = Aontu;
//# sourceMappingURL=aontu.js.map