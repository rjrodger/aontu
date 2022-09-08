"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Integer = void 0;
const type_1 = require("./type");
const unify_1 = require("./unify");
const Nil_1 = require("./val/Nil");
const ValBase_1 = require("./val/ValBase");
// A ScalarType for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends ValBase_1.ValBase {
    constructor(peg, ctx) {
        super(peg, ctx);
        this.done = type_1.DONE;
    }
    unify(peer, ctx) {
        if (peer instanceof ScalarVal) {
            if (peer.type === this.peg) {
                return peer;
            }
            else if (Number === this.peg && Integer === peer.type) {
                return peer;
            }
            return Nil_1.Nil.make(ctx, 'no-scalar-unify', this, peer);
        }
        else {
            if (peer instanceof ScalarTypeVal) {
                if (Number === this.peg && Integer === peer.peg) {
                    return peer;
                }
                else if (Number === peer.peg && Integer === this.peg) {
                    return this;
                }
            }
            return Nil_1.Nil.make(ctx, 'scalar-type', this, peer);
        }
    }
    get canon() {
        let ctor = this.peg;
        return ctor.name.toLowerCase();
    }
    same(peer) {
        return peer instanceof ScalarTypeVal ? this.peg === peer.peg : super.same(peer);
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.ScalarTypeVal = ScalarTypeVal;
class ScalarVal extends ValBase_1.ValBase {
    constructor(peg, type, ctx) {
        super(peg, ctx);
        this.type = type;
        this.done = type_1.DONE;
    }
    unify(peer, ctx) {
        // Exactly equal scalars are handled in op/unite
        if (peer instanceof ScalarTypeVal) {
            return peer.unify(this, ctx);
        }
        return Nil_1.Nil.make(ctx, 'scalar', this, peer);
    }
    get canon() {
        return this.peg.toString();
    }
    same(peer) {
        return peer instanceof ScalarVal ? peer.peg === this.peg : super.same(peer);
    }
    gen(_ctx) {
        return this.peg;
    }
}
class NumberVal extends ScalarVal {
    constructor(peg, ctx) {
        super(peg, Number, ctx);
    }
    unify(peer, ctx) {
        if (peer instanceof ScalarVal && peer.type === Integer) {
            return peer;
        }
        else {
            return super.unify(peer, ctx);
        }
    }
}
exports.NumberVal = NumberVal;
class IntegerVal extends ScalarVal {
    constructor(peg, ctx) {
        if (!Number.isInteger(peg)) {
            // TODO: use Nil?
            throw new Error('not-integer');
        }
        super(peg, Integer, ctx);
    }
    unify(peer, ctx) {
        if (peer instanceof ScalarTypeVal && peer.peg === Number) {
            return this;
        }
        else if (peer instanceof ScalarVal &&
            peer.type === Number &&
            this.peg === peer.peg) {
            return this;
        }
        else {
            return super.unify(peer, ctx);
        }
    }
}
exports.IntegerVal = IntegerVal;
class StringVal extends ScalarVal {
    constructor(peg, ctx) {
        super(peg, String, ctx);
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
    get canon() {
        return JSON.stringify(this.peg);
    }
}
exports.StringVal = StringVal;
class BooleanVal extends ScalarVal {
    constructor(peg, ctx) {
        super(peg, Boolean, ctx);
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
}
exports.BooleanVal = BooleanVal;
BooleanVal.TRUE = new BooleanVal(true, new unify_1.Context({ vc: 1, root: type_1.TOP }));
BooleanVal.FALSE = new BooleanVal(false, new unify_1.Context({ vc: 2, root: type_1.TOP }));
//# sourceMappingURL=val.js.map