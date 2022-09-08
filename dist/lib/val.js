"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = exports.RefVal = exports.DisjunctVal = exports.ListVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.TOP = exports.Integer = void 0;
const type_1 = require("./type");
Object.defineProperty(exports, "TOP", { enumerable: true, get: function () { return type_1.TOP; } });
const unify_1 = require("./unify");
const op_1 = require("./op/op");
const Nil_1 = require("./val/Nil");
const ValBase_1 = require("./val/ValBase");
const ConjunctVal_1 = require("./val/ConjunctVal");
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
class ListVal extends ValBase_1.ValBase {
    constructor(peg, ctx) {
        super(peg, ctx);
        this.spread = {
            cj: undefined,
        };
        let spread = this.peg[ListVal.SPREAD];
        delete this.peg[ListVal.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    new ConjunctVal_1.ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx);
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        let done = true;
        let out = type_1.TOP === peer ? this : new ListVal([], ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof ListVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj = new ConjunctVal_1.ConjunctVal([out.spread.cj, peer.spread.cj], ctx)));
        }
        out.done = this.done + 1;
        if (this.spread.cj) {
            out.spread.cj =
                type_1.DONE !== this.spread.cj.done ? (0, op_1.unite)(ctx, this.spread.cj) :
                    this.spread.cj;
        }
        let spread_cj = out.spread.cj || type_1.TOP;
        // Always unify children first
        for (let key in this.peg) {
            out.peg[key] =
                (0, op_1.unite)(ctx.descend(key), this.peg[key], spread_cj);
            done = (done && type_1.DONE === out.peg[key].done);
        }
        if (peer instanceof ListVal) {
            let upeer = (0, op_1.unite)(ctx, peer);
            for (let peerkey in upeer.peg) {
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil_1.Nil ? child :
                            peerchild instanceof Nil_1.Nil ? peerchild :
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild);
                if (this.spread.cj) {
                    out.peg[peerkey] = (0, op_1.unite)(ctx, out.peg[peerkey], spread_cj);
                }
                done = (done && type_1.DONE === oval.done);
            }
        }
        else if (type_1.TOP !== peer) {
            return Nil_1.Nil.make(ctx, 'map', this, peer);
        }
        out.done = done ? type_1.DONE : out.done;
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return '[' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                // NOTE: handle array non-index key vals
                // .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
                .map(k => [this.peg[k].canon]).join(',') +
            ']';
    }
    gen(ctx) {
        let out = this.peg.map((v) => v.gen(ctx));
        // for (let p in this.peg) {
        //   out[p] = this.peg[p].gen(ctx)
        // }
        return out;
    }
}
exports.ListVal = ListVal;
ListVal.SPREAD = Symbol('spread');
// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase_1.ValBase {
    // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
    constructor(peg, ctx, _sites) {
        super(peg, ctx);
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        let done = true;
        let oval = [];
        // console.log('oval', this.canon, peer.canon)
        // Conjunction (&) distributes over disjunction (|)
        for (let vI = 0; vI < this.peg.length; vI++) {
            //oval[vI] = this.peg[vI].unify(peer, ctx)
            oval[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer);
            // console.log('ovalA', vI, this.peg[vI].canon, peer.canon, oval[vI].canon)
            done = done && type_1.DONE === oval[vI].done;
        }
        // console.log('ovalB', oval.map(v => v.canon))
        // Remove duplicates, and normalize
        if (1 < oval.length) {
            for (let vI = 0; vI < oval.length; vI++) {
                if (oval[vI] instanceof DisjunctVal) {
                    oval.splice(vI, 1, ...oval[vI].peg);
                }
            }
            //console.log('ovalC', oval.map(v => v.canon))
            // TODO: not an error Nil!
            let remove = new Nil_1.Nil();
            for (let vI = 0; vI < oval.length; vI++) {
                for (let kI = vI + 1; kI < oval.length; kI++) {
                    if (oval[kI].same(oval[vI])) {
                        oval[kI] = remove;
                    }
                }
            }
            //console.log('ovalD', oval.map(v => v.canon))
            oval = oval.filter(v => !(v instanceof Nil_1.Nil));
        }
        let out;
        if (1 == oval.length) {
            out = oval[0];
        }
        else if (0 == oval.length) {
            return Nil_1.Nil.make(ctx, '|:empty', this);
        }
        else {
            out = new DisjunctVal(oval, ctx);
        }
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    get canon() {
        return this.peg.map((v) => v.canon).join('|');
    }
    gen(ctx) {
        if (0 < this.peg.length) {
            let vals = this.peg.filter((v) => v instanceof PrefVal);
            vals = 0 === vals.length ? this.peg : vals;
            let val = vals[0];
            for (let vI = 1; vI < this.peg.length; vI++) {
                val = val.unify(this.peg[vI]);
            }
            return val.gen(ctx);
        }
        return undefined;
    }
}
exports.DisjunctVal = DisjunctVal;
class RefVal extends ValBase_1.ValBase {
    constructor(peg, abs) {
        super('');
        this.sep = '.';
        this.absolute = true === abs;
        this.parts = [];
        for (let part of peg) {
            this.append(part);
        }
    }
    append(part) {
        //console.log('APPEND 0', part)
        if ('string' === typeof part) {
            this.parts.push(part);
        }
        else if (part instanceof StringVal) {
            this.parts.push(part.peg);
        }
        else if (part instanceof RefVal) {
            this.parts.push(...part.parts);
            if (part.absolute) {
                this.absolute = true;
            }
        }
        this.peg = (this.absolute ? this.sep : '') + this.parts.join(this.sep);
    }
    unify(peer, ctx) {
        let resolved = null == ctx ? this : ctx.find(this);
        // TODO: large amount of reruns needed? why?
        resolved = null == resolved && 999 < this.done ?
            Nil_1.Nil.make(ctx, 'no-path', this, peer) : (resolved || this);
        let out;
        if (resolved instanceof RefVal) {
            if (type_1.TOP === peer) {
                out = this;
            }
            else if (peer instanceof Nil_1.Nil) {
                out = Nil_1.Nil.make(ctx, 'ref[' + this.peg + ']', this, peer);
            }
            else {
                // Ensure RefVal done is incremented
                this.done = type_1.DONE === this.done ? type_1.DONE : this.done + 1;
                out = new ConjunctVal_1.ConjunctVal([this, peer], ctx);
            }
        }
        else {
            out = (0, op_1.unite)(ctx, resolved, peer);
        }
        out.done = type_1.DONE === out.done ? type_1.DONE : this.done + 1;
        return out;
    }
    same(peer) {
        return null == peer ? false : this.peg === peer.peg;
    }
    get canon() {
        return this.peg;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.RefVal = RefVal;
class PrefVal extends ValBase_1.ValBase {
    constructor(peg, pref, ctx) {
        super(peg, ctx);
        this.pref = pref || peg;
    }
    // PrefVal unify always returns a PrefVal
    // PrefVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        let done = true;
        let out;
        if (peer instanceof PrefVal) {
            out = new PrefVal((0, op_1.unite)(ctx, this.peg, peer.peg, 'Pref000'), (0, op_1.unite)(ctx, this.pref, peer.pref, 'Pref010'), ctx);
        }
        else {
            out = new PrefVal(
            // TODO: find a better way to drop Nil non-errors
            (0, op_1.unite)(ctx === null || ctx === void 0 ? void 0 : ctx.clone({ err: [] }), this.peg, peer, 'Pref020'), (0, op_1.unite)(ctx === null || ctx === void 0 ? void 0 : ctx.clone({ err: [] }), this.pref, peer, 'Pref030'), ctx);
        }
        done = done && type_1.DONE === out.peg.done &&
            (null != out.pref ? type_1.DONE === out.pref.done : true);
        if (out.peg instanceof Nil_1.Nil) {
            out = out.pref;
        }
        else if (out.pref instanceof Nil_1.Nil) {
            out = out.peg;
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
        let prefsame = peer instanceof PrefVal &&
            ((this.pref === peer.pref) ||
                (this.pref instanceof ValBase_1.ValBase && this.pref.same(peer.pref)));
        return pegsame && prefsame;
    }
    get canon() {
        return this.pref instanceof Nil_1.Nil ? this.peg.canon : '*' + this.pref.canon;
    }
    gen(ctx) {
        let val = !(this.pref instanceof Nil_1.Nil) ? this.pref :
            !(this.peg instanceof Nil_1.Nil) ? this.peg :
                undefined;
        return undefined === val ? undefined : val.gen(ctx);
    }
}
exports.PrefVal = PrefVal;
//# sourceMappingURL=val.js.map