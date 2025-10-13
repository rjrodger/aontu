"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyFuncVal = void 0;
const unify_1 = require("../unify");
const val_1 = require("../val");
const utility_1 = require("../utility");
const FuncBaseVal_1 = require("./FuncBaseVal");
class CopyFuncVal extends FuncBaseVal_1.FuncBaseVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isCopyFuncVal = true;
        this.type = false;
    }
    make(_ctx, spec) {
        return new CopyFuncVal(spec);
    }
    funcname() {
        return 'copy';
    }
    unify(peer, ctx) {
        let out = this.resolved;
        // console.log('COPY-UNIFY-START', this.canon, peer.canon, '->', out?.canon)
        if (null == out) {
            let oldpeg = this.peg[0];
            // console.log('COPY-UNITE-PEG-A', oldpeg.canon)
            let newpeg = (0, unify_1.unite)(ctx, oldpeg, val_1.TOP, 'copy');
            this.peg = [newpeg];
            if (newpeg.done) {
                out = this.resolve(ctx, this.peg);
            }
            else {
                out = this;
            }
        }
        // console.log('COPY-UNIFY-OUT', this.canon, peer.canon, '->', out.canon)
        return out;
    }
    resolve(ctx, args) {
        const val = args?.[0];
        const out = null == val || null == ctx ?
            new val_1.Nil({ msg: 'Invalid copy argument' }) :
            val.clone(ctx, { type: false });
        (0, utility_1.walk)(out, (_key, val) => {
            val.type = false;
            return val;
        });
        // console.log('COPY-RESOLVE', this.canon, '->', out.canon)
        return out;
    }
}
exports.CopyFuncVal = CopyFuncVal;
//# sourceMappingURL=CopyFuncVal.js.map