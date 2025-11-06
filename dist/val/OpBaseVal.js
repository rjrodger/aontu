"use strict";
/* Copyright (c) 2024 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpBaseVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const top_1 = require("./top");
const ConjunctVal_1 = require("./ConjunctVal");
const NilVal_1 = require("./NilVal");
const FeatureVal_1 = require("./FeatureVal");
class OpBaseVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPlusOp = true;
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
    unify(peer, ctx, trace) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, trace, 'Op:' + this.opname(), this, peer);
        let out = this;
        if (this.id == peer.id) {
            return this;
        }
        let pegdone = true;
        let newpeg = [];
        for (let arg of this.peg) {
            if (!arg.done) {
                arg = arg.unify((0, top_1.top)(), ctx, (0, utility_1.ec)(te, 'ARG'));
            }
            pegdone &&= arg.done;
            newpeg.push(arg);
        }
        // console.log('OPVAL', this.id, this.opname(), pegdone, newpeg.map(p => p.canon))
        if (pegdone) {
            let result = null == ctx ? this : this.operate(ctx, newpeg);
            result = result || this;
            if (null == result && this.canon === peer.canon) {
                out = this;
            }
            // TODO: should be result.isOp
            else if (result instanceof OpBaseVal) {
                if (peer.isTop) {
                    out = this;
                }
                // TODO: should peer.isNil
                else if (peer.isNil) {
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
                out = result.done && peer.isTop ? result :
                    (0, unify_1.unite)(ctx, result, peer, 'op', (0, utility_1.ec)(te, 'RES'));
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
        (0, utility_1.explainClose)(te, out);
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
    primatize(v) {
        const t = typeof v;
        if (null == v || 'string' === t || 'number' === t || 'boolean' === t) {
            return v;
        }
        else if (v?.isVal) {
            return this.primatize(v.peg);
        }
        else if (v?.toString) {
            return '' + v;
        }
        else {
            return undefined;
        }
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