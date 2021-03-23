"use strict";
// NOTE: each Val must handle all parent and child unifications explicitly
Object.defineProperty(exports, "__esModule", { value: true });
exports.Integer = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Bottom = exports.TOP = exports.Val = void 0;
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
        return self.val === peer.val ? self : new Bottom('no-unify-val');
    }
    else if (peer instanceof Bottom) {
        return peer;
    }
    else if (self instanceof Bottom) {
        return self;
    }
    else {
        return new Bottom('no-unify');
    }
};
class Val {
    constructor(val) {
        this.val = val;
    }
}
exports.Val = Val;
class Bottom extends Val {
    constructor(why) {
        super();
        this.why = why;
    }
    unify(_peer) {
        return this;
    }
}
exports.Bottom = Bottom;
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
                return new Bottom('no-scalar-unify');
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
//# sourceMappingURL=val.js.map