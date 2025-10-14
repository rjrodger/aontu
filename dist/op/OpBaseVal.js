"use strict";
/* Copyright (c) 2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpBaseVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const unify_1 = require("../unify");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
const NilVal_1 = require("../val/NilVal");
const FeatureVal_1 = require("../val/FeatureVal");
class OpBaseVal extends FeatureVal_1.FeatureVal {
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
        return NilVal_1.NilVal.make(ctx, 'op:' + this.opname(), this, undefined, 'make');
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
            // TODO: should result.isOp
            else if (result instanceof OpBaseVal) {
                // if (TOP === peer) {
                if (peer.isTop) {
                    out = this;
                }
                // TODO: should peer.isNil
                else if (peer instanceof NilVal_1.NilVal) {
                    out = NilVal_1.NilVal.make(ctx, 'op[' + this.peg + ']', this, peer);
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
                out = (0, unify_1.unite)(ctx, result, peer, 'op');
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
        return NilVal_1.NilVal.make(ctx, 'op:' + this.opname(), this, undefined, 'operate');
    }
    get canon() {
        return 'op';
    }
    gen(ctx) {
        // Unresolved op cannot be generated, so always an error.
        let nil = NilVal_1.NilVal.make(ctx, 'op', this, undefined);
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
exports.OpBaseVal = OpBaseVal;
//# sourceMappingURL=OpBaseVal.js.map