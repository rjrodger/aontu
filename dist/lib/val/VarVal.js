"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const val_1 = require("../val");
const Nil_1 = require("../val/Nil");
const RefVal_1 = require("../val/RefVal");
const ValBase_1 = require("../val/ValBase");
// TODO: KEY, SELF, PARENT are reserved names - error
class VarVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
    }
    unify(peer, ctx) {
        let out;
        let nameVal;
        if (this.peg.isVal) {
            // $.a.b.c - convert path to absolute
            if (this.peg instanceof RefVal_1.RefVal) {
                this.peg.absolute = true;
                nameVal = this.peg;
            }
            else {
                nameVal = this.peg.unify(peer);
            }
        }
        else {
            // TODO: how to pass row+col?
            nameVal = new val_1.StringVal({ peg: '' + this.peg }, ctx);
        }
        if (!(nameVal instanceof RefVal_1.RefVal) && type_1.DONE === nameVal.done) {
            if (nameVal instanceof val_1.StringVal) {
                out = ctx.var[nameVal.peg];
                if (null == out) {
                    out = Nil_1.Nil.make(ctx, 'var[' + nameVal.peg + ']', this, peer);
                }
            }
            else {
                out = Nil_1.Nil.make(ctx, 'var[' + typeof nameVal + ']', this, peer);
            }
        }
        else {
            out = nameVal;
        }
        return out;
    }
    same(peer) {
        return null == peer ? false : peer instanceof VarVal && this.peg === peer.peg;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        return out;
    }
    get canon() {
        var _a;
        return '$' + (((_a = this.peg) === null || _a === void 0 ? void 0 : _a.isVal) ? this.peg.canon : '' + this.peg);
    }
    gen(ctx) {
        // Unresolved var cannot be generated, so always an error.
        let nil = Nil_1.Nil.make(ctx, 'var', this, undefined);
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
exports.VarVal = VarVal;
//# sourceMappingURL=VarVal.js.map