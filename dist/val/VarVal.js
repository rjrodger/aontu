"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const StringVal_1 = require("./StringVal");
const NilVal_1 = require("./NilVal");
const FeatureVal_1 = require("./FeatureVal");
const NullVal_1 = require("./NullVal");
const BooleanVal_1 = require("./BooleanVal");
const NumberVal_1 = require("./NumberVal");
const IntegerVal_1 = require("./IntegerVal");
const utility_1 = require("../utility");
// TODO: KEY, SELF, PARENT are reserved names - error
class VarVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isVar = true;
    }
    unify(peer, ctx, explain) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, explain, 'Var', this, peer);
        let out;
        let nameVal;
        if (this.peg.isVal) {
            // $.a.b.c - convert path to absolute
            // if (this.peg instanceof RefVal) {
            if (this.peg.isRef) {
                this.peg.absolute = true;
                nameVal = this.peg;
            }
            else {
                nameVal = this.peg.unify(peer, ctx, (0, utility_1.ec)(te, 'PEG'));
            }
        }
        else {
            // TODO: how to pass row+col?
            nameVal = new StringVal_1.StringVal({ peg: '' + this.peg }, ctx);
        }
        // if (!(nameVal instanceof RefVal) && DONE === nameVal.dc) {
        if (!(nameVal.isRef) && type_1.DONE === nameVal.dc) {
            if (nameVal instanceof StringVal_1.StringVal) {
                let found = ctx.vars[nameVal.peg];
                if (undefined === found) {
                    out = NilVal_1.NilVal.make(ctx, 'unknown_var', this, peer);
                }
                // TODO: support complex values
                const ft = typeof found;
                if (null === found) {
                    out = this.place(new NullVal_1.NullVal({ peg: null }));
                }
                else if ('string' === ft) {
                    out = new StringVal_1.StringVal({ peg: found });
                }
                else if ('boolean' === ft) {
                    out = new BooleanVal_1.BooleanVal({ peg: found });
                }
                else if ('number' === ft) {
                    out = Number.isInteger(found) ?
                        new IntegerVal_1.IntegerVal({ peg: found }) :
                        new NumberVal_1.NumberVal({ peg: found });
                }
                else if ('object' === ft && found.isVal) {
                    out = found;
                }
                else {
                    out = NilVal_1.NilVal.make(ctx, 'invalid_var_kind', this, peer);
                }
            }
            else {
                out = NilVal_1.NilVal.make(ctx, 'var[' + typeof nameVal + ']', this, peer);
            }
        }
        else {
            out = nameVal;
        }
        (0, utility_1.explainClose)(te, out);
        return out;
    }
    same(peer) {
        return null == peer ? false : peer instanceof VarVal && this.peg === peer.peg;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, spec);
        return out;
    }
    get canon() {
        return '$' + (this.peg?.isVal ? this.peg.canon : '' + this.peg);
    }
    gen(ctx) {
        // Unresolved var cannot be generated, so always an error.
        let nil = NilVal_1.NilVal.make(ctx, 'var', this, undefined);
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
exports.VarVal = VarVal;
//# sourceMappingURL=VarVal.js.map