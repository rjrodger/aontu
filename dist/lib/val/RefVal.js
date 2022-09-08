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
//# sourceMappingURL=RefVal.js.map