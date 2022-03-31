"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = exports.RefVal = exports.DisjunctVal = exports.ConjunctVal = exports.MapVal = exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Nil = exports.TOP = exports.Val = exports.Integer = exports.DONE = void 0;
// TODO: infinite recursion protection
// NOTES
// - Vals are immutable
// - each Val must handle all parent and child unifications explicitly
// - performance is not considered yet
/*

TOP -> Scalar/Boolean -> BooleanVal
    -> Scalar/String  -> StringVal
    -> Scalar/Number  -> NumberVal -> IntegerVal
         -> Scalar/Integer
    -> Scalar/Integer -> IntegerVal

*/
const unify_1 = require("./unify");
const lang_1 = require("./lang");
const op_1 = require("./op/op");
const DONE = -1;
exports.DONE = DONE;
// There can be only one.
const TOP = {
    id: 0,
    top: true,
    peg: undefined,
    done: DONE,
    path: [],
    row: -1,
    col: -1,
    url: '',
    unify(peer, _ctx) {
        return peer;
        /*
        if (peer instanceof DisjunctVal) {
          return peer.unify(this, ctx)
        }
        else if (peer instanceof ConjunctVal) {
          return peer.unify(this, ctx)
        }
        else if (peer instanceof RefVal) {
          return peer.unify(this, ctx)
        }
        else {
          return peer
        }
        */
    },
    get canon() { return 'top'; },
    get site() { return new lang_1.Site(this); },
    same(peer) {
        return TOP === peer;
    },
    gen: (_ctx) => {
        return undefined;
    },
};
exports.TOP = TOP;
class Val {
    constructor(peg, ctx) {
        this.done = 0;
        this.row = -1;
        this.col = -1;
        this.url = '';
        this.peg = peg;
        this.path = (ctx && ctx.path) || [];
        this.id = (ctx && ctx.vc++) || (9e9 + Math.floor(Math.random() * (1e9)));
    }
    same(peer) {
        return this === peer;
    }
    get site() {
        return new lang_1.Site(this);
    }
}
exports.Val = Val;
class Nil extends Val {
    constructor(why, ctx) {
        super(null, ctx);
        this.nil = true;
        this.why = why;
        // Nil is always DONE, by definition.
        this.done = DONE;
    }
    unify(_peer, _ctx) {
        return this;
    }
    get canon() {
        return 'nil';
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.Nil = Nil;
// TODO: include Val generating nil, thus capture type
Nil.make = (ctx, why, av, bv) => {
    let nil = new Nil(why, ctx);
    // TODO: this should be done lazily, for multiple terms
    // Terms later in same file are considered the primary error location.
    if (null != av) {
        nil.row = av.row;
        nil.col = av.col;
        nil.url = av.url;
        nil.primary = av;
        if (null != bv) {
            nil.secondary = bv;
            let bv_loc_wins = (nil.url === bv.url) && ((nil.row < bv.row) ||
                (nil.row === bv.row && nil.col < bv.col));
            if (bv_loc_wins) {
                nil.row = bv.row;
                nil.col = bv.col;
                nil.url = bv.url;
                nil.primary = bv;
                nil.secondary = av;
            }
        }
    }
    if (ctx) {
        ctx.err.push(nil);
    }
    return nil;
};
// A ScalarType for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends Val {
    constructor(peg, ctx) {
        super(peg, ctx);
        this.done = DONE;
    }
    unify(peer, ctx) {
        if (peer instanceof ScalarVal) {
            if (peer.type === this.peg) {
                return peer;
            }
            else if (Number === this.peg && Integer === peer.type) {
                return peer;
            }
            return Nil.make(ctx, 'no-scalar-unify', this, peer);
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
            return Nil.make(ctx, 'scalar-type', this, peer);
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
class ScalarVal extends Val {
    constructor(peg, type, ctx) {
        super(peg, ctx);
        this.type = type;
        this.done = DONE;
    }
    unify(peer, ctx) {
        if (peer instanceof ScalarTypeVal) {
            return peer.unify(this, ctx);
        }
        return Nil.make(ctx, 'scalar', this, peer);
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
BooleanVal.TRUE = new BooleanVal(true, new unify_1.Context({ vc: 1, root: TOP }));
BooleanVal.FALSE = new BooleanVal(false, new unify_1.Context({ vc: 2, root: TOP }));
class MapVal extends Val {
    constructor(peg, ctx) {
        super(peg, ctx);
        this.spread = {
            cj: undefined,
        };
        let spread = this.peg[MapVal.SPREAD];
        delete this.peg[MapVal.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                this.spread.cj =
                    new ConjunctVal(Array.isArray(spread.v) ? spread.v : [spread.v], ctx);
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        let done = true;
        let out = TOP === peer ? this : new MapVal({}, ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof MapVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj = new ConjunctVal([out.spread.cj, peer.spread.cj], ctx)));
        }
        out.done = this.done + 1;
        if (this.spread.cj) {
            //out.spread.cj =
            //  DONE !== this.spread.cj.done ? this.spread.cj.unify(TOP, ctx) :
            //    this.spread.cj
            out.spread.cj =
                DONE !== this.spread.cj.done ? (0, op_1.unite)(ctx, this.spread.cj) :
                    this.spread.cj;
        }
        // console.log(
        //   ('  '.repeat(ctx.path.length)),
        //   'MV spread', this.id, peer.id, out.id, '|',
        //   this.canon, peer.canon, out.canon, '|',
        //   (this.spread.cj || {}).done,
        //   (this.spread.cj || {}).canon, (out.spread.cj || {}).canon)
        let spread_cj = out.spread.cj || TOP;
        // Always unify children first
        for (let key in this.peg) {
            //let oval = out.peg[key] = this.peg[key].unify(spread_cj, ctx.descend(key))
            //let oval =
            out.peg[key] =
                (0, op_1.unite)(ctx.descend(key), this.peg[key], spread_cj);
            done = (done && DONE === out.peg[key].done);
            //if (oval instanceof Nil) {
            // ctx.err.push(oval)
            //}
        }
        // console.log(
        //   ('  '.repeat(ctx.path.length)),
        //   'MV child ', this.id, peer.id, out.id, '|',
        //   this.canon, peer.canon, out.canon, '|',
        //   this.constructor.name,
        //   peer.constructor.name,
        //   out.constructor.name,
        // )
        if (peer instanceof MapVal) {
            //let upeer: MapVal = (peer.unify(TOP, ctx) as MapVal)
            let upeer = (0, op_1.unite)(ctx, peer);
            // console.log(
            //   ('  '.repeat(ctx.path.length)),
            //   'MV peer A', this.id, peer.id, out.id, '|',
            //   Object.keys(this.peg), Object.keys(upeer.peg), Object.keys(out.peg))
            for (let peerkey in upeer.peg) {
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil ? child :
                            peerchild instanceof Nil ? peerchild :
                                //child.unify(peerchild, ctx.descend(peerkey))
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild);
                if (this.spread.cj) {
                    //out.peg[peerkey] = out.peg[peerkey].unify(spread_cj, ctx)
                    out.peg[peerkey] = (0, op_1.unite)(ctx, out.peg[peerkey], spread_cj);
                }
                done = (done && DONE === oval.done);
                if (oval instanceof Nil) {
                    // ctx.err.push(oval)
                }
            }
            // console.log(
            //   ('  '.repeat(ctx.path.length)),
            //   'MV peer B', this.id, peer.id, out.id, '|',
            //   Object.keys(this.peg), Object.keys(upeer.peg), Object.keys(out.peg))
            //out.done = done ? DONE : out.done
            // console.log(' '.repeat(W) + 'MV OUT A', this.id, out.done, out.id, out.canon)//this.spread.cj, out.spread.cj)
            // console.log(
            //   ('  '.repeat(ctx.path.length)),
            //   'MV out ', this.id, peer.id, out.id, '|',
            //   this.canon, peer.canon, out.canon, '|',
            //   this.constructor.name,
            //   peer.constructor.name,
            //   out.constructor.name,
            // )
        }
        else if (TOP !== peer) {
            //out.done = done ? DONE : out.done
            //return (UNIFIER(out, peer, ctx) as MapVal)
            return Nil.make(ctx, 'map', this, peer);
        }
        out.done = done ? DONE : out.done;
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return '{' +
            (this.spread.cj ? '&=' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
            '}';
    }
    gen(ctx) {
        let out = {};
        for (let p in this.peg) {
            out[p] = this.peg[p].gen(ctx);
        }
        return out;
    }
}
exports.MapVal = MapVal;
MapVal.SPREAD = Symbol('spread');
// TODO: move main logic to op/conjunct
class ConjunctVal extends Val {
    constructor(peg, ctx) {
        super(peg, ctx);
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        let done = true;
        // Unify each term of conjunct against peer
        let upeer = [];
        for (let vI = 0; vI < this.peg.length; vI++) {
            // upeer[vI] = this.peg[vI].unify(peer, ctx)
            upeer[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer);
            done = done && DONE === upeer[vI].done;
            // // console.log('Ca', vI, this.peg[vI].canon, peer.canon, upeer[vI].canon)
            if (upeer[vI] instanceof Nil) {
                return Nil.make(ctx, '&peer[' + upeer[vI].canon + ',' + peer.canon + ']', this.peg[vI], peer);
            }
        }
        // // console.log('Cb', upeer.map(x => x.canon))
        // TODO: FIX: conjuncts get replicated inside each other
        // 1&/x => CV[CV[1&/x]]
        // Unify each term of conjunct against following sibling,
        // reducing to smallest conjunct or single val
        let outvals = 0 < upeer.length ? [upeer[0]] : [];
        let oI = 0;
        for (let uI = 1; uI < upeer.length; uI++) {
            // // console.log('Cu', oI, uI, outvals.map(x => x.canon))
            if (outvals[oI] instanceof ConjunctVal) {
                outvals.splice(oI, 0, ...outvals[oI].peg);
                oI += outvals[oI].peg.length;
                done = false;
            }
            else {
                outvals[oI] = null == outvals[oI] ? upeer[uI] :
                    //outvals[oI].unify(upeer[uI], ctx)
                    (0, op_1.unite)(ctx, outvals[oI], upeer[uI]);
                done = done && DONE === outvals[oI].done;
                // Conjuct fails
                if (outvals[oI] instanceof Nil) {
                    return outvals[oI];
                    /*
                    return Nil.make(
                      ctx,
                      '&reduce[' + outvals[oI].canon + ',' + upeer[uI].canon + ']',
                      outvals[oI],
                      upeer[uI]
                    )
                    */
                }
            }
        }
        // // console.log('Cc', outvals.map(x => x.canon), outvals)
        let out;
        //let why = ''
        if (0 === outvals.length) {
            //out = Nil.make(ctx, '&empty', this)
            // Empty conjuncts evaporate.
            out = TOP;
            //why += 'A'
        }
        // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
        else if (1 === outvals.length) {
            out = outvals[0];
            //why += 'B'
        }
        else {
            out = new ConjunctVal(outvals, ctx);
            //why += 'C'
        }
        // // console.log('Cd', why, out.peg)
        out.done = done ? DONE : this.done + 1;
        return out;
    }
    // TODO: need a well-defined val order so conjunt canon is always the same
    get canon() {
        return this.peg.map((v) => v.canon).join('&');
    }
    gen(ctx) {
        if (0 < this.peg.length) {
            // Default is just the first term - does this work?
            // TODO: maybe use a PrefVal() ?
            let v = this.peg[0];
            let out = undefined;
            if (undefined !== v && !(v instanceof Nil)) {
                out = v.gen(ctx);
            }
            return out;
        }
        return undefined;
    }
}
exports.ConjunctVal = ConjunctVal;
// TODO: move main logic to op/disjunct
class DisjunctVal extends Val {
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
        //console.log('oval', this.canon, peer.canon)
        // Conjunction (&) distributes over disjunction (|)
        for (let vI = 0; vI < this.peg.length; vI++) {
            //oval[vI] = this.peg[vI].unify(peer, ctx)
            oval[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer);
            //console.log('ovalA', vI, this.peg[vI].canon, peer.canon, oval[vI].canon)
            done = done && DONE === oval[vI].done;
        }
        //console.log('ovalB', oval.map(v => v.canon))
        // Remove duplicates, and normalize
        if (1 < oval.length) {
            for (let vI = 0; vI < oval.length; vI++) {
                if (oval[vI] instanceof DisjunctVal) {
                    oval.splice(vI, 1, ...oval[vI].peg);
                }
            }
            //console.log('ovalC', oval.map(v => v.canon))
            // TODO: not an error Nil!
            let remove = new Nil();
            for (let vI = 0; vI < oval.length; vI++) {
                for (let kI = vI + 1; kI < oval.length; kI++) {
                    if (oval[kI].same(oval[vI])) {
                        oval[kI] = remove;
                    }
                }
            }
            //console.log('ovalD', oval.map(v => v.canon))
            oval = oval.filter(v => !(v instanceof Nil));
        }
        let out;
        if (1 == oval.length) {
            out = oval[0];
        }
        else if (0 == oval.length) {
            return Nil.make(ctx, '|:empty', this);
        }
        else {
            out = new DisjunctVal(oval, ctx);
        }
        out.done = done ? DONE : this.done + 1;
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
class RefVal extends Val {
    // constructor(peg: string | string[], ctx?: Context) {
    //   super(peg, ctx)
    //   this.parts = 'string' === typeof peg ? peg.split(this.sep) : peg
    //   this.parts = this.parts.filter(p => '' != p)
    //   // this.absolute = peg.startsWith(this.sep)
    // }
    constructor(peg, abs) {
        super('');
        this.sep = '.'; // was '/'
        this.absolute = true === abs;
        this.parts = [];
        console.log('RV', peg);
        for (let part of peg) {
            this.append(part);
        }
    }
    append(part) {
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
            Nil.make(ctx, 'no-path', this, peer) : (resolved || this);
        let out;
        // console.log('RV', this.id, this.done, this.canon, peer.canon, !!resolved, resolved instanceof RefVal, resolved && resolved.canon)
        if (resolved instanceof RefVal) {
            if (TOP === peer) {
                out = this;
                //out = new RefVal(this.peg, ctx)
            }
            else if (peer instanceof Nil) {
                out = Nil.make(ctx, 'ref[' + this.peg + ']', this, peer);
            }
            else {
                // Ensure RefVal done is incremented
                this.done = DONE === this.done ? DONE : this.done + 1;
                out = new ConjunctVal([this, peer], ctx);
            }
        }
        else {
            //console.log('RVr', resolved.canon, peer.canon)
            //out = resolved.unify(peer, ctx)
            out = (0, op_1.unite)(ctx, resolved, peer);
        }
        out.done = DONE === out.done ? DONE : this.done + 1;
        return out;
    }
    get canon() {
        return this.peg;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.RefVal = RefVal;
class PrefVal extends Val {
    constructor(peg, pref, ctx) {
        super(peg, ctx);
        this.pref = pref || peg;
    }
    // PrefVal unify always returns a PrefVal
    // PrevVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        let done = true;
        //let peer_peg = peer instanceof PrefVal ? peer.peg : peer
        //let peer_pref = peer instanceof PrefVal ? peer.pref : peer
        let out;
        /*
              = new PrefVal(
              this.peg.unify(peer_peg, ctx),
              this.pref.unify(peer_pref, ctx),
              ctx
            )
        */
        if (peer instanceof PrefVal) {
            out = new PrefVal(
            //this.peg.unify(peer.peg, ctx),
            //this.pref.unify(peer.pref, ctx),
            (0, op_1.unite)(ctx, this.peg, peer.peg), (0, op_1.unite)(ctx, this.pref, peer.pref), ctx);
        }
        else {
            out = new PrefVal(
            //this.peg.unify(peer, ctx),
            //this.pref.unify(peer, ctx),
            (0, op_1.unite)(ctx, this.peg, peer), (0, op_1.unite)(ctx, this.pref, peer), ctx);
        }
        done = done && DONE === out.peg.done &&
            (null != out.pref ? DONE === out.pref.done : true);
        if (out.peg instanceof Nil) {
            out = out.pref;
        }
        else if (out.pref instanceof Nil) {
            out = out.peg;
        }
        out.done = done ? DONE : this.done + 1;
        return out;
    }
    get canon() {
        return this.pref instanceof Nil ? this.peg.canon : '*' + this.pref.canon;
    }
    gen(ctx) {
        let val = !(this.pref instanceof Nil) ? this.pref :
            !(this.peg instanceof Nil) ? this.peg :
                undefined;
        return undefined === val ? undefined : val.gen(ctx);
    }
}
exports.PrefVal = PrefVal;
//# sourceMappingURL=val.js.map