"use strict";
// rename to val.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Integer = exports.NumVal = exports.ScalarVal = exports.Bottom = exports.TOP = exports.Val = void 0;
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
        return self;
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
    static subsume(child) { return Number.isInteger(child.val); }
}
exports.Integer = Integer;
// TODO: should handle multiple types, rename to ScalarVal
class ScalarVal extends Val {
    constructor(val) {
        super(val);
    }
    unify(peer) {
        if (peer instanceof this.val) {
            return peer;
        }
        else if (this.val.subsume && this.val.subsume(peer)) {
            return peer;
        }
        else {
            return UNIFIER(this, peer);
        }
    }
}
exports.ScalarVal = ScalarVal;
class NumVal extends Val {
    constructor(val) {
        super(val);
    }
    unify(peer) {
        if (peer instanceof ScalarVal) {
            return peer.unify(this);
        }
        else {
            return UNIFIER(this, peer);
        }
    }
}
exports.NumVal = NumVal;
//# sourceMappingURL=type.js.map