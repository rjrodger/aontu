"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const val_1 = require("../val");
const Nil_1 = require("../val/Nil");
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
        // // // console.log('SP', this.superpeg)
    }
    // PrefVal unify always returns a PrefVal
    // PrefVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        let done = true;
        let out = this;
        // if (peer instanceof PrefVal) {
        //   out = new PrefVal(
        //     {
        //       peg: unite(ctx, this.peg, peer.peg, 'Pref000'),
        //       pref: unite(ctx, this.pref, peer.pref, 'Pref010'),
        //     },
        //     ctx
        //   )
        // }
        // else {
        //   out = new PrefVal(
        //     {
        //       // TODO: find a better way to drop Nil non-errors
        //       peg: unite(ctx?.clone({ err: [] }), this.peg, peer, 'Pref020'),
        //       pref: unite(ctx?.clone({ err: [] }), this.pref, peer, 'Pref030'),
        //     },
        //     ctx
        //   )
        // }
        // done = done && DONE === out.peg.dc &&
        //   (null != (out as PrefVal).pref ? DONE === (out as PrefVal).pref.dc : true)
        // if (out.peg instanceof Nil) {
        //   out = (out as PrefVal).pref
        // }
        // else if ((out as PrefVal).pref instanceof Nil) {
        //   out = out.peg
        // }
        if (peer instanceof PrefVal) {
            if (this.rank < peer.rank) {
                return this;
            }
            else if (peer.rank < this.rank) {
                return peer;
            }
            else {
                let peg = (0, unify_1.unite)(ctx, this.peg, peer.peg, 'pref-peer/' + this.id);
                out = new PrefVal({ peg }, ctx);
                // out = Nil.make(ctx, 'pref', this, peer)
            }
        }
        else if (!peer.top) {
            // out = Nil.make(ctx, 'pref', this, peer)
            if (this.superpeg instanceof Nil_1.Nil) {
                out = peer;
            }
            else {
                out = (0, unify_1.unite)(ctx, this.superpeg, peer, 'pref-super/' + this.id);
                // // // console.log('QQQ', out.canon)
                // if (out instanceof Nil) {
                //   out = Nil.make(ctx, '*super', this, peer)
                // }
                // if (!(out instanceof Nil)) {
                if (out.same(this.superpeg)) {
                    return this.peg;
                }
            }
        }
        out.dc = done ? type_1.DONE : this.dc + 1;
        return out;
    }
    same(peer) {
        if (null == peer) {
            return false;
        }
        let pegsame = (this.peg === peer.peg) ||
            (this.peg instanceof BaseVal_1.BaseVal && this.peg.same(peer.peg));
        // let prefsame = peer instanceof PrefVal &&
        //   ((this.pref === peer.pref) ||
        //     (this.pref instanceof ValBase && this.pref.same(peer.pref)))
        // return pegsame && prefsame
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
        // let val = !(this.pref instanceof Nil) ? this.pref :
        //   (!(this.peg instanceof Nil) ? this.peg :
        //     this.pref)
        let val = this.peg;
        if (val instanceof Nil_1.Nil) {
            // descErr(val, ctx)
            if (null == ctx) {
                //   // ctx.err.push(val)
                //   ctx.adderr(val)
                // }
                // else {
                throw new Error(val.msg);
            }
        }
        return val.gen(ctx);
    }
}
exports.PrefVal = PrefVal;
function makeSuper(v) {
    // return v.superior() - apply * deeply into maps etc
    if (v instanceof val_1.NumberVal) {
        return new val_1.ScalarKindVal({ peg: Number });
    }
    else if (v instanceof val_1.IntegerVal) {
        return new val_1.ScalarKindVal({ peg: val_1.Integer });
    }
    else if (v instanceof val_1.StringVal) {
        return new val_1.ScalarKindVal({ peg: String });
    }
    else if (v instanceof val_1.BooleanVal) {
        return new val_1.ScalarKindVal({ peg: Boolean });
    }
    else {
        return new Nil_1.Nil();
    }
}
//# sourceMappingURL=PrefVal.js.map