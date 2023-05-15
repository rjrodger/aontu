"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const Nil_1 = require("../val/Nil");
const ValBase_1 = require("../val/ValBase");
const ConjunctVal_1 = require("../val/ConjunctVal");
const val_1 = require("../val");
class RefVal extends ValBase_1.ValBase {
    constructor(peg, abs) {
        super('');
        this.sep = '.';
        this.absolute = true === abs;
        this.parts = [];
        if ('string' === typeof peg) {
            peg = peg.split('.');
        }
        for (let part of peg) {
            this.append(part);
        }
    }
    append(part) {
        //console.log('APPEND 0', part)
        if ('string' === typeof part) {
            this.parts.push(part);
        }
        else if (part instanceof val_1.StringVal) {
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
        if (this.id === peer.id) {
            return this;
        }
        // TODO: not resolved when all Vals in path are done is an error
        // as path cannot be found
        let resolved = null == ctx ? this : ctx.find(this);
        // console.log('REF', resolved, this.peg, peer.canon)
        // if (null == resolved && peer instanceof RefVal && this.peg === peer.peg) {
        //   console.log('SAMEREF', this.peg, this.id, this.done, peer.canon, peer.id)
        // }
        // if (null == resolved && 0 < this.done) {
        //   console.log('UREF', this.peg, this.done, peer.canon)
        // }
        // Don't try to resolve paths forever.
        // TODO: large amount of reruns needed? why?
        // resolved =
        //   null == resolved &&
        //     9999 < this.done
        //     ?
        //     Nil.make(ctx, 'no-path', this, peer)
        //     : (resolved || this)
        resolved = resolved || this;
        let out;
        if (resolved instanceof RefVal) {
            if (type_1.TOP === peer) {
                out = this;
            }
            else if (peer instanceof Nil_1.Nil) {
                out = Nil_1.Nil.make(ctx, 'ref[' + this.peg + ']', this, peer);
            }
            // same path
            else if (this.peg === peer.peg) {
                out = this;
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
    gen(ctx) {
        if (ctx) {
            ctx.err.push(Nil_1.Nil.make(ctx, 'ref', this.peg, undefined));
        }
        throw new Error('REF-gen ' + this.peg);
        return undefined;
    }
}
exports.RefVal = RefVal;
//# sourceMappingURL=RefVal.js.map