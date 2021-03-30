"use strict";
// Vals are immutable
// NOTE: each Val must handle all parent and child unifications explicitly
Object.defineProperty(exports, "__esModule", { value: true });
exports.Integer = exports.MapVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Nil = exports.TOP = exports.Val = void 0;
/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer
    -> Scalar/Integer -> IntegerVal

*/
// There can be only one.
const TOP = {
    val: undefined,
    unify(peer) {
        return peer;
    },
};
exports.TOP = TOP;
const UNIFIER = (self, peer) => {
    if (peer === TOP) {
        return self;
    }
    else if (self === TOP) {
        return peer;
    }
    else if (self.constructor === peer.constructor) {
        return self.val === peer.val ? self : new Nil('no-unify-val');
    }
    else if (peer instanceof Nil) {
        return peer;
    }
    else if (self instanceof Nil) {
        return self;
    }
    else {
        return new Nil('no-unify');
    }
};
class Val {
    constructor(val) {
        this.val = val;
    }
}
exports.Val = Val;
class Nil extends Val {
    constructor(why) {
        super();
        this.why = why;
    }
    unify(_peer) {
        return this;
    }
}
exports.Nil = Nil;
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends Val {
    constructor(val) {
        super(val);
    }
    unify(peer) {
        //console.log('ScalarTypeVal.unify',
        //  peer, (peer as any).type, this.val, (peer as any).type === this.val)
        if (peer instanceof ScalarVal) {
            if (peer.type === this.val) {
                //console.log('AAA')
                return peer;
            }
            else if (Number === this.val && Integer === peer.type) {
                return peer;
            }
            else {
                return new Nil('no-scalar-unify');
            }
        }
        else {
            if (peer instanceof ScalarTypeVal) {
                if (Number === this.val && Integer === peer.val) {
                    return peer;
                }
                else if (Number === peer.val && Integer === this.val) {
                    return this;
                }
            }
            console.log('BBB');
            return UNIFIER(this, peer);
        }
    }
}
exports.ScalarTypeVal = ScalarTypeVal;
class ScalarVal extends Val {
    constructor(val, type) {
        super(val);
        this.type = type;
    }
    unify(peer) {
        if (peer instanceof ScalarTypeVal) {
            return peer.unify(this);
        }
        else {
            return UNIFIER(this, peer);
        }
    }
}
class NumberVal extends ScalarVal {
    constructor(val) {
        super(val, Number);
    }
    unify(peer) {
        if (peer instanceof ScalarVal && peer.type === Integer) {
            return peer;
        }
        else {
            return super.unify(peer);
        }
    }
}
exports.NumberVal = NumberVal;
class IntegerVal extends ScalarVal {
    constructor(val) {
        if (!Number.isInteger(val)) {
            throw new Error('not-integer');
        }
        super(val, Integer);
    }
    unify(peer) {
        if (peer instanceof ScalarTypeVal && peer.val === Number) {
            return this;
        }
        else if (peer instanceof ScalarVal &&
            peer.type === Number &&
            this.val === peer.val) {
            return this;
        }
        else {
            return super.unify(peer);
        }
    }
}
exports.IntegerVal = IntegerVal;
class StringVal extends ScalarVal {
    constructor(val) {
        super(val, String);
    }
    unify(peer) {
        return super.unify(peer);
    }
}
exports.StringVal = StringVal;
class BooleanVal extends ScalarVal {
    constructor(val) {
        super(val, Boolean);
    }
    unify(peer) {
        return super.unify(peer);
    }
}
exports.BooleanVal = BooleanVal;
BooleanVal.TRUE = new BooleanVal(true);
BooleanVal.FALSE = new BooleanVal(false);
class MapNode {
    constructor(base, peer, dest, key) {
        this.dest = dest;
        this.key = key;
        this.base = base;
        this.peer = peer;
    }
}
class MapVal extends Val {
    constructor(val) {
        super(val);
        this.id = Math.random();
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peertop) {
        if (peertop instanceof MapVal) {
            const basetop = this;
            if (basetop === peertop)
                return basetop;
            const ns = [new MapNode(basetop, peertop, basetop)];
            let node;
            let outbase = basetop;
            let out = basetop;
            let first = true;
            while ((node = ns.shift())) {
                console.log('NA', ns.length, node);
                let base = node.base;
                let peer = node.peer;
                if (null != node.key) {
                    node.dest.val[node.key] = node.base;
                }
                if (null != peer) {
                    let peerkeys = Object.keys(peer.val);
                    console.log('PK', peerkeys);
                    outbase = new MapVal({ ...base.val });
                    if (first) {
                        out = outbase;
                        first = false;
                    }
                    if (null != node.key) {
                        node.dest.val[node.key] = outbase;
                    }
                    let outval = outbase.val;
                    for (let pkI = 0; pkI < peerkeys.length; pkI++) {
                        let peerkey = peerkeys[pkI];
                        let subpeer = peer.val[peerkey];
                        let subbase = base.val[peerkey];
                        if (subpeer instanceof MapVal || subbase instanceof MapVal) {
                            let subnode = new MapNode(subbase, subpeer, outbase, peerkey);
                            ns.push(subnode);
                        }
                        else if (null != subbase && null != subpeer) {
                            outval[peerkey] = subbase.unify(subpeer);
                        }
                        else if (null == subbase && null != subpeer) {
                            outval[peerkey] = subpeer;
                        }
                    }
                }
                console.log('NB', ns.length);
            }
            return out;
        }
        else {
            return UNIFIER(this, peertop);
        }
    }
}
exports.MapVal = MapVal;
//# sourceMappingURL=val.js.map