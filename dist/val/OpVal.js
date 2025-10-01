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
    make(ctx, _spec) {
        return Nil_1.Nil.make(ctx, 'op:' + this.opname(), this, undefined, 'make');
    }
    opname() {
        return 'op';
    }
    unify(peer, ctx) {
        let out = this;
        if (this.id == peer.id) {
            return this;
        }
        let pegdone = true;
        let newpeg = [];
        for (let arg of this.peg) {
            if (!arg.done) {
                arg = arg.unify(val_1.TOP, ctx);
            }
            pegdone &&= arg.done;
            newpeg.push(arg);
        }
        // console.log('OPVAL', pegdone, newpeg)
        if (pegdone) {
            let result = null == ctx ? this : this.operate(ctx, newpeg);
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
                    this.dc = type_1.DONE === this.dc ? type_1.DONE : this.dc + 1;
                    out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
                }
            }
            else {
                out = (0, op_1.unite)(ctx, result, peer, 'op');
            }
            out.dc = type_1.DONE === out.dc ? type_1.DONE : this.dc + 1;
        }
        else if (peer.isTop) {
            this.notdone();
            out = this.make(ctx, { peg: newpeg });
            // TODO: make should handle this using ctx?
            out.row = this.row;
            out.col = this.col;
            out.url = this.url;
            out.path = this.path;
            // why += 'top'
        }
        else if (peer.isNil) {
            this.notdone();
            out = peer;
            //why += 'nil'
        }
        else {
            this.notdone();
            out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
            // TODO: make should handle this using ctx?
            out.row = this.row;
            out.col = this.col;
            out.url = this.url;
            out.path = this.path;
        }
        return out;
    }
    same(peer) {
        return null == peer ? false : this.peg === peer.peg;
    }
    clone(ctx, _spec) {
        let out = super.clone(ctx, {
            peg: this.peg,
        });
        return out;
    }
    operate(ctx, _args) {
        return Nil_1.Nil.make(ctx, 'op:' + this.opname(), this, undefined, 'operate');
    }
    get canon() {
        return 'op';
    }
    gen(ctx) {
        // Unresolved op cannot be generated, so always an error.
        let nil = Nil_1.Nil.make(ctx, 'op', this, undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        (0, err_1.descErr)(nil, ctx);
        if (ctx) {
            // ctx.err.push(nil)
            ctx.adderr(nil);
        }
        else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.OpVal = OpVal;
//# sourceMappingURL=OpVal.js.map