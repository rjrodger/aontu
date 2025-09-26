"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
const val_1 = require("../val");
// import { ConjunctVal } from '../val/ConjunctVal'
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
class PrefVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPrefVal = true;
        this.rank = 0;
        // this.pref = spec.pref || spec.peg
        this.superpeg = makeSuper(spec.peg);
        if (spec.peg instanceof PrefVal) {
            this.rank = 1 + spec.peg.rank;
        }
        // console.log('SP', this.superpeg)
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
        // done = done && DONE === out.peg.done &&
        //   (null != (out as PrefVal).pref ? DONE === (out as PrefVal).pref.done : true)
        // if (out.peg instanceof Nil) {
        //   out = (out as PrefVal).pref
        // }
        // else if ((out as PrefVal).pref instanceof Nil) {
        //   out = out.peg
        // }
        if (peer instanceof PrefVal) {
            out = Nil_1.Nil.make(ctx, 'pref', this, peer);
        }
        else if (!peer.top) {
            if (this.superpeg instanceof Nil_1.Nil) {
                out = peer;
            }
            else {
                out = (0, op_1.unite)(ctx, this.superpeg, peer, 'pref-super/' + this.id);
                if (out instanceof Nil_1.Nil) {
                    out = Nil_1.Nil.make(ctx, '*super', this, peer);
                }
            }
        }
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    same(peer) {
        if (null == peer) {
            return false;
        }
        let pegsame = (this.peg === peer.peg) ||
            (this.peg instanceof ValBase_1.ValBase && this.peg.same(peer.peg));
        // let prefsame = peer instanceof PrefVal &&
        //   ((this.pref === peer.pref) ||
        //     (this.pref instanceof ValBase && this.pref.same(peer.pref)))
        // return pegsame && prefsame
        return pegsame;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
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
            (0, err_1.descErr)(val, ctx);
            if (ctx) {
                // ctx.err.push(val)
                ctx.adderr(val);
            }
            else {
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
        return new val_1.ScalarTypeVal({ peg: Number });
    }
    else if (v instanceof val_1.IntegerVal) {
        return new val_1.ScalarTypeVal({ peg: val_1.Integer });
    }
    else if (v instanceof val_1.StringVal) {
        return new val_1.ScalarTypeVal({ peg: String });
    }
    else if (v instanceof val_1.BooleanVal) {
        return new val_1.ScalarTypeVal({ peg: Boolean });
    }
    else {
        return new Nil_1.Nil();
    }
}
//# sourceMappingURL=PrefVal.js.map