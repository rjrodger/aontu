"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Integer = exports.TOP = void 0;
const type_1 = require("./type");
const lang_1 = require("./lang");
const Nil_1 = require("./val/Nil");
const ValBase_1 = require("./val/ValBase");
// There can be only one.
class TopVal extends ValBase_1.ValBase {
    constructor() {
        super(null);
        this.isTop = true;
        this.id = 0;
        this.top = true;
        this.peg = undefined;
        this.done = type_1.DONE;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        // TOP is always DONE, by definition.
        this.done = type_1.DONE;
    }
    unify(peer, _ctx) {
        return peer;
    }
    get canon() { return 'top'; }
    get site() { return new lang_1.Site(this); }
    same(peer) {
        return this === peer;
    }
    clone() {
        return this;
    }
    gen(_ctx) {
        return undefined;
    }
}
const TOP = new TopVal();
exports.TOP = TOP;
// A ScalarType for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarTypeVal = true;
        this.done = type_1.DONE;
    }
    unify(peer, ctx) {
        if (peer?.isScalarVal) {
            if (peer.type === this.peg) {
                return peer;
            }
            else if (Number === this.peg && Integer === peer.type) {
                return peer;
            }
            return Nil_1.Nil.make(ctx, 'no-scalar-unify', this, peer);
        }
        else {
            if (peer?.isScalarTypeVal) {
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
        let out = peer?.isScalarTypeVal ? this.peg === peer?.peg : super.same(peer);
        return out;
    }
}
exports.ScalarTypeVal = ScalarTypeVal;
class ScalarVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarVal = true;
        this.type = spec.type;
        this.done = type_1.DONE;
    }
    clone(spec, ctx) {
        let out = super.clone({
            peg: this.peg,
            type: this.type,
            ...(spec || {})
        }, ctx);
        return out;
    }
    unify(peer, ctx) {
        // Exactly equal scalars are handled in op/unite
        if (peer?.isScalarTypeVal) {
            return peer.unify(this, ctx);
        }
        else if (peer.top) {
            return this;
        }
        return Nil_1.Nil.make(ctx, 'scalar', this, peer);
    }
    get canon() {
        return this.peg.toString();
    }
    same(peer) {
        return peer?.isScalarVal ? peer.peg === this.peg : super.same(peer);
    }
    gen(_ctx) {
        return this.peg;
    }
}
class NumberVal extends ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: Number }, ctx);
        this.isNumberVal = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarTypeVal && peer.type === Number) {
                return this;
            }
            else if (peer.isScalarVal &&
                peer.peg === this.peg) {
                return peer.isIntegerVal ? peer : this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.NumberVal = NumberVal;
class IntegerVal extends ScalarVal {
    constructor(spec, ctx) {
        if (!Number.isInteger(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-integer');
        }
        super({ peg: spec.peg, type: Integer }, ctx);
        this.isIntegerVal = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarTypeVal && (peer.peg === Number || peer.peg === Integer)) {
                return this;
            }
            else if (peer.isScalarVal &&
                // peer.type === Number &&
                peer.peg === this.peg) {
                return this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.IntegerVal = IntegerVal;
class StringVal extends ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: String }, ctx);
        this.isStringVal = true;
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
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: Boolean }, ctx);
        this.isBooleanVal = true;
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
}
exports.BooleanVal = BooleanVal;
//# sourceMappingURL=val.js.map