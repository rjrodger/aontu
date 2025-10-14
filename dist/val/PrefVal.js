"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const val_1 = require("../val");
const NilVal_1 = require("../val/NilVal");
const BaseVal_1 = require("../val/BaseVal");
class PrefVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPrefVal = true;
        this.rank = 0;
        // this.pref = spec.pref || spec.peg
        this.superpeg = makeSuper(spec.peg);
        if (spec.peg instanceof PrefVal) {
            this.rank = 1 + spec.peg.rank;
        }
    }
    // PrefVal unify always returns a PrefVal
    // PrefVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        let done = true;
        let out = this;
        let why = '';
        if (!this.peg.done) {
            const resolved = (0, unify_1.unite)(ctx, this.peg, val_1.TOP, 'pref/resolve');
            // console.log('PREF-RESOLVED', this.peg.canon, '->', resolved)
            this.peg = resolved;
        }
        if (peer instanceof PrefVal) {
            why += 'pref-';
            if (this.rank < peer.rank) {
                out = this;
                why += 'rank-win';
            }
            else if (peer.rank < this.rank) {
                out = peer;
                why += 'rank-lose';
            }
            else {
                let peg = (0, unify_1.unite)(ctx, this.peg, peer.peg, 'pref-peer/' + this.id);
                out = new PrefVal({ peg }, ctx);
                why += 'rank-same';
            }
        }
        else if (!peer.isTop) {
            why += 'super-';
            // if (this.superpeg instanceof Nil) {
            //   out = peer
            //   why += 'nil'
            // }
            // else {
            //   why += 'unify'
            out = (0, unify_1.unite)(ctx, this.superpeg, peer, 'pref-super/' + this.id);
            if (out.same(this.superpeg)) {
                out = this.peg;
                why += 'same';
            }
            // }
        }
        else {
            why += 'none';
        }
        out.dc = done ? type_1.DONE : this.dc + 1;
        // console.log('PREFVAL-OUT', why, this.canon, peer.canon, '->', out.canon, out.done)
        return out;
    }
    same(peer) {
        if (null == peer) {
            return false;
        }
        let pegsame = (this.peg === peer.peg) ||
            (this.peg instanceof BaseVal_1.BaseVal && this.peg.same(peer.peg));
        return pegsame;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        // out.pref = this.pref.clone(null, ctx)
        return out;
    }
    get canon() {
        // return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon
        return '*' + this.peg.canon;
    }
    gen(ctx) {
        let val = this.peg;
        if (val instanceof NilVal_1.NilVal) {
            if (null == ctx) {
                throw new Error(val.msg);
            }
        }
        return val.gen(ctx);
    }
}
exports.PrefVal = PrefVal;
function makeSuper(v) {
    // let out: Val = new Nil()
    // let out: Val = TOP
    let out = new val_1.TopVal();
    if (v instanceof val_1.NumberVal) {
        out = new val_1.ScalarKindVal({ peg: Number });
    }
    else if (v instanceof val_1.IntegerVal) {
        out = new val_1.ScalarKindVal({ peg: val_1.Integer });
    }
    else if (v instanceof val_1.StringVal) {
        out = new val_1.ScalarKindVal({ peg: String });
    }
    else if (v instanceof val_1.BooleanVal) {
        out = new val_1.ScalarKindVal({ peg: Boolean });
    }
    // console.log('MAKESUPER', v.canon, out.canon)
    return out;
}
//# sourceMappingURL=PrefVal.js.map