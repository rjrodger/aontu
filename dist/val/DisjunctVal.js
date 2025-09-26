"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisjunctVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
// import { TOP } from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
const PrefVal_1 = require("../val/PrefVal");
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase_1.ValBase {
    // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
    constructor(spec, ctx, _sites) {
        super(spec, ctx);
        this.isDisjunctVal = true;
        this.isBinaryOp = true;
        this.prefsRanked = false;
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        this.prefsRanked = false;
        return this;
    }
    unify(peer, ctx) {
        // const sc = this.canon
        // const pc = peer?.canon
        if (!this.prefsRanked) {
            this.rankPrefs(ctx);
        }
        let done = true;
        let oval = [];
        // Conjunction (&) distributes over disjunction (|)
        for (let vI = 0; vI < this.peg.length; vI++) {
            const v = this.peg[vI];
            const cloneCtx = ctx?.clone({ err: [] });
            // console.log('DJ-DIST-A', this.peg[vI].canon, peer.canon)
            oval[vI] = (0, op_1.unite)(cloneCtx, v, peer);
            // console.log('DJ-DIST-B', oval[vI].canon, cloneCtx?.err)
            if (0 < cloneCtx?.err.length) {
                oval[vI] = Nil_1.Nil.make(cloneCtx, '|:empty-dist', this);
            }
            done = done && type_1.DONE === oval[vI].done;
        }
        // Remove duplicates, and normalize
        if (1 < oval.length) {
            for (let vI = 0; vI < oval.length; vI++) {
                if (oval[vI] instanceof DisjunctVal) {
                    oval.splice(vI, 1, ...oval[vI].peg);
                }
            }
            // TODO: not an error Nil!
            let remove = new Nil_1.Nil();
            for (let vI = 0; vI < oval.length; vI++) {
                for (let kI = vI + 1; kI < oval.length; kI++) {
                    if (oval[kI].same(oval[vI])) {
                        oval[kI] = remove;
                    }
                }
            }
            oval = oval.filter(v => !(v instanceof Nil_1.Nil));
        }
        let out;
        if (1 == oval.length) {
            out = oval[0];
        }
        else if (0 == oval.length) {
            return Nil_1.Nil.make(ctx, '|:empty', this, peer);
        }
        else {
            out = new DisjunctVal({ peg: oval }, ctx);
        }
        out.done = done ? type_1.DONE : this.done + 1;
        // console.log('DISJUNCT-unify',
        //  this.id, sc, pc, '->', out.canon, 'D=' + out.done, 'E=', this.err)
        return out;
    }
    rankPrefs(ctx) {
        let lastpref = undefined;
        let lastprefI = -1;
        // console.log('RP-A', this.peg.map((p: Val) => p.canon))
        for (let vI = 0; vI < this.peg.length; vI++) {
            const v = this.peg[vI];
            if (v instanceof PrefVal_1.PrefVal) {
                if (null != lastpref) {
                    if (v.rank === lastpref.rank) {
                        return Nil_1.Nil.make(ctx, '|:prefs', lastpref, v, 'associate');
                    }
                    else if (v.rank < lastpref.rank) {
                        this.peg[lastprefI] = null;
                        lastpref = v;
                        lastprefI = vI;
                    }
                    else {
                        this.peg[vI] = null;
                    }
                }
                else {
                    lastpref = v;
                    lastprefI = vI;
                }
            }
            else if (v instanceof DisjunctVal) {
                let subrank = v.rankPrefs(ctx);
                if (subrank instanceof PrefVal_1.PrefVal) {
                    this.peg[vI] = subrank;
                    lastpref = subrank;
                    lastprefI = vI;
                }
            }
        }
        this.peg = this.peg.filter((p) => null != p);
        this.prefsRanked = true;
        // console.log('RP-Z', this.peg.map((p: Val) => p.canon))
        if (1 === this.peg.length && this.peg[0] instanceof PrefVal_1.PrefVal) {
            return this.peg[0];
        }
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
        return out;
    }
    get canon() {
        return this.peg.map((v) => {
            return v.isBinaryOp && Array.isArray(v.peg) && 1 < v.peg.length ?
                '(' + v.canon + ')' : v.canon;
        }).join('|');
    }
    gen(ctx) {
        // if (0 < this.peg.length) {
        //   let vals = this.peg.filter((v: Val) => v instanceof PrefVal)
        //   vals = 0 === vals.length ? this.peg : vals
        //   let val = vals[0]
        //   for (let vI = 1; vI < this.peg.length; vI++) {
        //     let valnext = val.unify(this.peg[vI], ctx)
        //     val = valnext
        //   }
        //   return val.gen(ctx)
        // }
        // console.log('DJ-GEN', this.peg)
        if (1 === this.peg.length) {
            return this.peg[0].gen(ctx);
        }
        else if (1 < this.peg.length) {
            let peg = this.peg.filter((v) => v instanceof PrefVal_1.PrefVal);
            if (1 === peg.length) {
                return peg[0].gen(ctx);
            }
            else {
                let nil = Nil_1.Nil.make(ctx, 'disjunct', this, undefined);
                // TODO: refactor to use Site
                nil.path = this.path;
                nil.url = this.url;
                nil.row = this.row;
                nil.col = this.col;
                // descErr(nil, ctx)
                if (null == ctx) {
                    throw new Error(nil.msg);
                }
            }
            return undefined;
        }
    }
}
exports.DisjunctVal = DisjunctVal;
//# sourceMappingURL=DisjunctVal.js.map