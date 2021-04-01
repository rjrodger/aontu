"use strict";
// Vals are immutable
// NOTE: each Val must handle all parent and child unifications explicitly
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisjunctVal = exports.MapVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Nil = exports.TOP = exports.Val = exports.Integer = void 0;
/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer
    -> Scalar/Integer -> IntegerVal

*/
// There can be only one.
const TOP = {
    top: true,
    val: undefined,
    unify(peer) {
        return peer;
    },
    get canon() { return 'top'; },
    gen: (_log) => {
        // TOPs evaporate
        return undefined;
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
    else if (peer instanceof DisjunctVal) {
        return peer.unify(self);
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
    get canon() {
        return 'nil';
    }
    gen(log) {
        // This is an error.
        log.push('nil');
        return undefined;
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
            return UNIFIER(this, peer);
        }
    }
    get canon() {
        return this.val.name.toLowerCase();
    }
    gen(log) {
        // This is an error.
        log.push('ScalarTypeVal<' + this.canon + '>');
        return undefined;
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
    get canon() {
        return this.val.toString();
    }
    gen(_log) {
        return this.val;
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
    get canon() {
        return JSON.stringify(this.val);
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
                let base = node.base;
                let peer = node.peer;
                if (null != node.key) {
                    node.dest.val[node.key] = node.base;
                }
                if (null != peer) {
                    let peerkeys = Object.keys(peer.val);
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
            }
            return out;
        }
        else {
            return UNIFIER(this, peertop);
        }
    }
    get canon() {
        return '{' + Object.keys(this.val)
            .map(k => [JSON.stringify(k) + ':' + this.val[k].canon]).join(',') + '}';
    }
    gen(log) {
        let out = {};
        for (let p in this.val) {
            out[p] = this.val[p].gen(log);
        }
        return out;
    }
}
exports.MapVal = MapVal;
class DisjunctVal extends Val {
    constructor(val) {
        super(val);
    }
    append(peer) {
        return new DisjunctVal([...this.val, peer]);
    }
    unify(peer) {
        let out = [];
        for (let vI = 0; vI < this.val.length; vI++) {
            out[vI] = this.val[vI].unify(peer);
        }
        out = out.filter(v => !(v instanceof Nil));
        return new DisjunctVal(out);
    }
    get canon() {
        return this.val.map((v) => v.canon).join('|');
    }
    gen(log) {
        if (0 < this.val.length) {
            // Default is just the first term - does this work?
            let v = this.val[0];
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
            let out = undefined;
            if (undefined !== v && !(v instanceof Nil)) {
                out = v.gen(log);
            }
            else {
                log.push('nil:|:none=' + this.canon);
            }
            return out;
        }
        else {
            log.push('nil:|:empty=' + this.canon);
            return undefined;
        }
    }
}
exports.DisjunctVal = DisjunctVal;
//# sourceMappingURL=val.js.map