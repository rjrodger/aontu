"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncBaseVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const val_1 = require("../val");
const BaseVal_1 = require("../val/BaseVal");
class FuncBaseVal extends BaseVal_1.BaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFuncVal = true;
        // console.log('FBV', this.id, this.constructor.name, this.peg?.[0]?.canon)
    }
    make(ctx, _spec) {
        return val_1.Nil.make(ctx, 'func:' + this.funcname(), this, undefined, 'make');
    }
    unify(peer, ctx) {
        let why = '';
        console.log('FBV', this.id, peer.id, this.constructor.name, this.type, this.peg?.canon);
        if (this.id === peer.id) {
            return this;
        }
        let out;
        let pegdone = true;
        let newpeg = [];
        let newtype = this.type;
        if (this.type && peer.isTop) {
            this.dc = type_1.DONE;
            return this;
        }
        for (let arg of this.peg) {
            // console.log('FUNCBASE-UNIFY-PEG-A', arg.canon)
            let newarg = arg;
            if (!arg.done) {
                newarg = arg.unify(val_1.TOP, ctx);
                newtype = newtype || newarg.type;
                // console.log('FUNCBASE-UNIFY-PEG-B', arg.canon, '->', newarg.canon)
            }
            pegdone &&= arg.done;
            newpeg.push(newarg);
        }
        if (pegdone) {
            const resolved = this.resolve(ctx, newpeg);
            // console.log('RESOLVED:', resolved?.canon)
            const unified = (0, unify_1.unite)(ctx, resolved, peer, 'func-' + this.funcname() + '/' + this.id);
            out = unified;
            out.type = this.type || unified.type;
            // TODO: make should handle this using ctx?
            out.row = this.row;
            out.col = this.col;
            out.url = this.url;
            out.path = this.path;
            why += 'pegdone';
        }
        else if (peer.isTop) {
            this.notdone();
            out = this.make(ctx, { peg: newpeg, type: newtype });
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
            out = new val_1.ConjunctVal({ peg: [this, peer], type: newtype }, ctx);
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
        return (this.type ? '<type>' : '') +
            (this.done ? '<done>' : '') +
            (this.id + '=') +
            this.funcname() + '(' + (this.peg.map((p) => p.canon).join(',')) + ')';
    }
    funcname() {
        return 'func';
    }
    resolve(ctx, _args) {
        return val_1.Nil.make(ctx, 'func:' + this.funcname(), this, undefined, 'resolve');
    }
}
exports.FuncBaseVal = FuncBaseVal;
//# sourceMappingURL=FuncBaseVal.js.map