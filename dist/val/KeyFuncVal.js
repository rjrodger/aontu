"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyFuncVal = void 0;
const StringVal_1 = require("../val/StringVal");
const ConjunctVal_1 = require("../val/ConjunctVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
class KeyFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isKeyFunc = true;
        // this.dc = DONE
    }
    make(_ctx, spec) {
        return new KeyFuncVal(spec);
    }
    funcname() {
        return 'key';
    }
    unify(peer, ctx) {
        // TODO: this delay makes keys in spreads and refs work, but it is a hack - find a better way.
        let out = this;
        if (ctx.cc < 3) {
            this.notdone();
            if (peer.isTop || (peer.id === this.id)) {
                // TODO: clone needed to avoid triggering unify_cycle - find a better way
                out = this.clone(ctx);
            }
            else if (peer.isNil) {
                out = peer;
            }
            else {
                if (peer.isKeyFunc
                    && peer.path.join('.') === this.path.join('.')
                    && peer.peg?.[0]?.peg === this.peg?.[0]?.peg) {
                    out = this;
                }
                else {
                    out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
                }
            }
        }
        else {
            out = super.unify(peer, ctx);
        }
        return out;
    }
    resolve(_ctx, _args) {
        let out = this;
        // if (!this.mark.type && !this.mark.hide) {
        let move = this.peg?.[0]?.peg;
        move = isNaN(move) ? 1 : +move;
        const key = this.path[this.path.length - (1 + move)] ?? '';
        // console.log('KEY', this.path, move, key)
        out = new StringVal_1.StringVal({ peg: key });
        // }
        return out;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.KeyFuncVal = KeyFuncVal;
//# sourceMappingURL=KeyFuncVal.js.map