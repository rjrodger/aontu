"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Integer = exports.TOP = void 0;
const type_1 = require("./type");
const unify_1 = require("./unify");
const lang_1 = require("./lang");
const Nil_1 = require("./val/Nil");
const ValBase_1 = require("./val/ValBase");
// There can be only one.
class TopVal extends ValBase_1.ValBase {
    constructor() {
        super(null);
        this.isVal = true;
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
    constructor(spec, ctx) {
        super(spec, ctx);
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
        if (peer instanceof ScalarTypeVal) {
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
        return peer instanceof ScalarVal ? peer.peg === this.peg : super.same(peer);
    }
    gen(_ctx) {
        return this.peg;
    }
}
class NumberVal extends ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: Number }, ctx);
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
    constructor(spec, ctx) {
        if (!Number.isInteger(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-integer');
        }
        super({ peg: spec.peg, type: Integer }, ctx);
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
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: String }, ctx);
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
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
}
exports.BooleanVal = BooleanVal;
BooleanVal.TRUE = new BooleanVal({ peg: true }, new unify_1.Context({ vc: 1, root: TOP }));
BooleanVal.FALSE = new BooleanVal({ peg: false }, new unify_1.Context({ vc: 2, root: TOP }));
//# sourceMappingURL=val.js.map