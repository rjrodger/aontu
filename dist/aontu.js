"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultVal = exports.unify = exports.evaluate = exports.Aontu = void 0;
class Node {
    constructor(base, peer) {
        this.base = base;
        this.peer = peer;
    }
}
// TODO: everything should be Vals?
class Val {
    constructor(val) {
        this.val = val;
    }
}
class DefaultVal extends Val {
    constructor(type, val) {
        super(val);
        this.type = type;
    }
}
exports.DefaultVal = DefaultVal;
// NOTE: if val defined, that *becomes* the val
// preserve obj refs
class Disjunct extends Val {
    constructor() {
        super(undefined);
        this.parts = [];
    }
    // TODO: needs shared node stack
    unify(peer) {
        if (this.val) {
            // unify with this.val
        }
        let uniparts = [];
        for (let pI = 0; pI < this.parts.length; pI++) {
            // TOOD: shared node stack
            let uval = unify(peer, this.parts[pI]);
            if (uval) { // not BottomVal
                uniparts.push(uval);
            }
        }
        if (0 === uniparts.length) {
            // this.val = BottomVal
            return; // BottomVal
        }
        else if (1 === uniparts.length) {
            this.val = uniparts[1];
            return this.val;
        }
        // remove bottoms as they can no longer match
        else {
            //this.parts = uniparts.filter(p=>p!==BottomVal)
        }
    }
}
function unify(basetop, peertop) {
    // TODO: check if scalars
    const ns = [new Node(basetop, peertop)];
    let node;
    while ((node = ns.shift())) {
        //console.log('LS', node)
        //console.log(ns)
        let base = node.base;
        let peer = node.peer;
        // also get peers from base meta, if any
        let basemeta = base.$;
        // spread over self: { ...ref, a:1 }
        let had_peers = false;
        if (basemeta && basemeta.peers && !basemeta.peers_done) {
            for (let bpI = 0; bpI < basemeta.peers.length; bpI++) {
                let metapeer = basemeta.peers[bpI];
                let metanode = new Node(base, metapeer);
                ns.push(metanode);
            }
            basemeta.peers_done = true;
            had_peers = true;
            //console.log('BP', ns)
        }
        if (null != peer) {
            let peerkeys = Object.keys(peer);
            //console.log('peerkeys', peerkeys)
            for (let pkI = 0; pkI < peerkeys.length; pkI++) {
                let peerkey = peerkeys[pkI];
                let subpeer = peer[peerkey];
                let subbase = base[peerkey];
                let subpeertype = typeof subpeer;
                let subbasetype = typeof subbase;
                if (subpeer instanceof Val || subbase instanceof Val) {
                    base[peerkey] = unify_scalar(peerkey, subbase, subpeer, true);
                }
                else if ('object' === subpeertype || 'object' === subbasetype) {
                    if (undefined === subbase) {
                        base[peerkey] = subpeer;
                    }
                    else {
                        let subnode = new Node(subbase, subpeer);
                        //console.log('PN', subnode)
                        ns.push(subnode);
                    }
                }
                else {
                    base[peerkey] = unify_scalar(peerkey, subbase, subpeer, true);
                }
            }
        }
        else {
            // TODO: interate over base children as they may have peers
        }
        // spread over children: [ ...ref, {a:1} ]
        // TODO: rename children->sub
        // iterate over base keys, apply child peers, if any
        if (basemeta && basemeta.children && !basemeta.children_done) {
            if (had_peers) {
                ns.push(new Node(base, undefined));
            }
            else {
                for (let cI = 0; cI < basemeta.children.length; cI++) {
                    let childpeer = basemeta.children[cI];
                    let basekeys = Object.keys(base);
                    for (let bkI = 0; bkI < basekeys.length; bkI++) {
                        let basekey = basekeys[bkI];
                        let basechild = base[basekey];
                        // Assumes peer is never altered
                        let childnode = new Node(basechild, childpeer);
                        ns.push(childnode);
                    }
                }
                basemeta.children_done = true;
            }
            //console.log('BP', ns)
        }
    }
    return basetop;
}
exports.unify = unify;
function unify_scalar(key, basescalar, peerscalar, commute) {
    // console.log('US', key, basescalar, peerscalar, commute)
    let basetype = typeof basescalar;
    if (undefined === peerscalar) {
        return basescalar;
    }
    else if (String === peerscalar && 'string' === basetype) {
        return basescalar;
    }
    else if (Number === peerscalar && 'number' === basetype) {
        return basescalar;
    }
    else if (peerscalar instanceof DefaultVal) {
        if (undefined === basescalar) {
            return peerscalar.val;
        }
        else if (basescalar === peerscalar.type) {
            return peerscalar;
        }
        else if (basetype === peerscalar.type.name.toLowerCase()) {
            return basescalar;
        }
    }
    else if (basescalar === peerscalar) {
        return basescalar;
    }
    else if (commute) {
        return unify_scalar(key, peerscalar, basescalar, false);
    }
    // TODO: collect instead
    throw new Error('NU: ' + basescalar + ' =/= ' + peerscalar);
}
function evaluate(top) {
    let ns = [{ top: top }];
    let node;
    while ((node = ns.pop())) {
        if ('object' === typeof node) {
            let keys = Object.keys(node);
            for (let kI = 0; kI < keys.length; kI++) {
                let key = keys[kI];
                let val = node[key];
                if (val instanceof Val) {
                    node[key] = val.val;
                }
                else if ('object' === typeof val) {
                    ns.push(val);
                }
            }
        }
    }
    return top;
}
exports.evaluate = evaluate;
function Aontu(base, peer) {
    let unity = unify(base, peer);
    let value = evaluate(unity);
    return value;
}
exports.Aontu = Aontu;
exports.default = Aontu;
//# sourceMappingURL=aontu.js.map