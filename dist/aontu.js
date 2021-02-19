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
            base[key] = unify_scalar(base[key], peer[key]);
        }
    }
    return basetop;
}
function unify_scalar(basescalar, peerscalar) {
    return peerscalar;
}
function Aontu(base, peer) {
    return unify(base, peer);
}
exports.Aontu = Aontu;
//# sourceMappingURL=aontu.js.map