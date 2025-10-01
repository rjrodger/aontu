"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncValBase = void 0;
const op_1 = require("../op/op");
const val_1 = require("../val");
const ValBase_1 = require("../val/ValBase");
class FuncValBase extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFuncVal = true;
    }
    make(ctx, _spec) {
        return val_1.Nil.make(ctx, 'func:' + this.funcname(), this, undefined, 'make');
    }
    unify(peer, ctx) {
        let why = '';
        if (this.id === peer.id) {
            return this;
        }
        let out;
        let pegdone = true;
        let newpeg = [];
        for (let arg of this.peg) {
            if (!arg.done) {
                arg = arg.unify(val_1.TOP, ctx);
            }
            pegdone &&= arg.done;
            newpeg.push(arg);
        }
        if (pegdone) {
            const resolved = this.resolve(ctx, newpeg);
            const unified = (0, op_1.unite)(ctx, resolved, peer, 'func-floor/' + this.id);
            out = unified;
            // TODO: make should handle this using ctx?
            out.row = this.row;
            out.col = this.col;
            out.url = this.url;
            out.path = this.path;
            why += 'pegdone';
        }
        else if (peer.isTop) {
            this.notdone();
            out = this.make(ctx, { peg: newpeg });
            // TODO: make should handle this using ctx?
            out.row = this.row;
            out.col = this.col;
            out.url = this.url;
            out.path = this.path;
            why += 'top';
        }
        else if (peer.isNil) {
            this.notdone();
            out = peer;
            why += 'nil';
        }
        else {
            // this.dc = DONE === this.dc ? DONE : this.dc + 1
            this.notdone();
            out = new val_1.ConjunctVal({ peg: [this, peer] }, ctx);
            // TODO: make should handle this using ctx?
            out.row = this.row;
            out.col = this.col;
            out.url = this.url;
            out.path = this.path;
            why += 'defer';
        }
        // console.log('FUNC-OUT', this.funcname(), why, out.dc, out.canon, out.id)
        return out;
    }
    get canon() {
        return this.funcname() + '(' + (this.peg.map((p) => p.canon).join(',')) + ')';
    }
    funcname() {
        return 'func';
    }
    resolve(ctx, _args) {
        return val_1.Nil.make(ctx, 'func:' + this.funcname(), this, undefined, 'resolve');
    }
}
exports.FuncValBase = FuncValBase;
//# sourceMappingURL=FuncValBase.js.map