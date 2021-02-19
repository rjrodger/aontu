"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultVal = exports.unify = exports.evaluate = exports.Aontu = void 0;
class Node {
    constructor(base, peer) {
        this.base = base;
        this.peer = peer;
    }
}
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
function unify(basetop, peertop) {
    const ns = [new Node(basetop, peertop)];
    let node;
    while (node = ns.shift()) {
        let base = node.base;
        let peer = node.peer;
        let peerkeys = Object.keys(peer);
        //console.log('peerkeys', peerkeys)
        for (let pkI = 0; pkI < peerkeys.length; pkI++) {
            let key = peerkeys[pkI];
            let subpeer = peer[key];
            let subbase = base[key];
            let subpeertype = typeof (subpeer);
            let subbasetype = typeof (subbase);
            if (subpeer instanceof Val || subbase instanceof Val) {
                base[key] = unify_scalar(key, subbase, subpeer, true);
            }
            else if ('object' === subpeertype || 'object' === subbasetype) {
                if (undefined === subbase) {
                    base[key] = subpeer;
                }
                else {
                    let subnode = new Node(subbase, subpeer);
                    //console.log('PN', subnode)
                    ns.push(subnode);
                }
            }
            else {
                base[key] = unify_scalar(key, subbase, subpeer, true);
            }
        }
    }
    return basetop;
}
exports.unify = unify;
function unify_scalar(key, basescalar, peerscalar, commute) {
    // console.log('US', key, basescalar, peerscalar, commute)
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
    else if (commute) {
        return unify_scalar(key, peerscalar, basescalar, false);
    }
    // TODO: collect instead
    throw new Error('NU: ' + basescalar + ' =/= ' + peerscalar);
}
function evaluate(top) {
    let ns = [{ top: top }];
    let node;
    while (node = ns.pop()) {
        if ('object' === typeof (node)) {
            let keys = Object.keys(node);
            for (let kI = 0; kI < keys.length; kI++) {
                let key = keys[kI];
                let val = node[key];
                if (val instanceof Val) {
                    node[key] = val.val;
                }
                else if ('object' === typeof (val)) {
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
//# sourceMappingURL=aontu.js.map