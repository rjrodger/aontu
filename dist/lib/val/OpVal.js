"use strict";
/* Copyright (c) 2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
const Nil_1 = require("../val/Nil");
const ValBase_1 = require("../val/ValBase");
class OpVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isOpVal = true;
        this.peg = [];
        for (let pI = 0; pI < spec.peg.length; pI++) {
            this.append(spec.peg[pI]);
        }
    }
    append(part) {
        this.peg.push(part);
    }
    unify(peer, ctx) {
        let out = this;
        if (this.id !== peer.id) {
            let result = null == ctx ? this : this.operate(ctx);
            result = result || this;
            if (null == result && this.canon === peer.canon) {
                out = this;
            }
            else if (result instanceof OpVal) {
                if (val_1.TOP === peer) {
                    out = this;
                }
                else if (peer instanceof Nil_1.Nil) {
                    out = Nil_1.Nil.make(ctx, 'op[' + this.peg + ']', this, peer);
                }
                else if (this.canon === peer.canon) {
                    out = this;
                }
                else {
                    this.done = type_1.DONE === this.done ? type_1.DONE : this.done + 1;
                    out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
                }
            }
            else {
                out = (0, op_1.unite)(ctx, result, peer, 'op');
            }
            out.done = type_1.DONE === out.done ? type_1.DONE : this.done + 1;
        }
        return out;
    }
    same(peer) {
        return null == peer ? false : this.peg === peer.peg;
    }
    clone(_spec, ctx) {
        let out = super.clone({
            peg: this.peg,
        }, ctx);
        return out;
    }
    operate(ctx) {
        this.peg = this.peg.map((v) => v.isRefVal ? v.unify(val_1.TOP, ctx) : v);
        return undefined;
    }
    get canon() {
        return '';
    }
    gen(ctx) {
        // Unresolved op cannot be generated, so always an error.
        let nil = Nil_1.Nil.make(ctx, 'op', this, undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        (0, err_1.descErr)(nil);
        if (ctx) {
            ctx.err.push(nil);
        }
        else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.OpVal = OpVal;
//# sourceMappingURL=OpVal.js.map