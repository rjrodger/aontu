"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncBaseVal = void 0;
const type_1 = require("../type");
const unify_1 = require("../unify");
const utility_1 = require("../utility");
const valutil_1 = require("./valutil");
const NilVal_1 = require("../val/NilVal");
const ConjunctVal_1 = require("../val/ConjunctVal");
const FeatureVal_1 = require("../val/FeatureVal");
class FuncBaseVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isFunc = true;
        // console.log('FBV', this.id, this.constructor.name, this.peg?.[0]?.canon)
    }
    validateArgs(args, min) {
        if (min < args.length) {
            // TODO: this is an error as as a parse error, needs to be handled same way
            throw new Error('The ' + this.funcname() + ' function needs at least ' +
                min + ' argument' + (1 === min ? '' : 's') + '.');
        }
    }
    make(ctx, _spec) {
        return NilVal_1.NilVal.make(ctx, 'func:' + this.funcname(), this, undefined, 'make');
    }
    unify(peer, ctx, explain) {
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, explain, 'Func:' + this.funcname(), this, peer);
        // const sc = this.id + '=' + this.canon
        // const pc = peer.id + '=' + peer.canon
        let why = '';
        let out = this;
        // console.log('FBV', this.id, this.constructor.name, this.mark.type, this.peg?.canon, 'PEER', peer.id, peer.canon)
        if (this.id !== peer.id) {
            if (peer.isTop && (this.mark.type || this.mark.hide)) {
                this.dc = type_1.DONE;
            }
            else {
                let pegdone = true;
                let newpeg = [];
                let newtype = this.mark.type;
                let newhide = this.mark.hide;
                this.peg = this.prepare(ctx, this.peg);
                for (let arg of this.peg) {
                    // console.log('FUNCBASE-UNIFY-PEG-A', arg.canon)
                    let newarg = arg;
                    if (!arg.done) {
                        newarg = arg.unify((0, valutil_1.top)(), ctx, (0, utility_1.ec)(te, 'ARG'));
                        newtype = newtype || newarg.mark.type;
                        newhide = newhide || newarg.mark.hide;
                        // console.log('FUNCBASE-UNIFY-PEG-B', arg.canon, '->', newarg.canon)
                    }
                    pegdone &&= arg.done;
                    newpeg.push(newarg);
                }
                // console.log('FUNCBASE-PEG', this.id, pegdone, this.peg.map((p: any) => p?.canon))
                if (pegdone) {
                    const resolved = this.resolve(ctx, newpeg);
                    // console.log('FUNC-RESOLVED', ctx.cc, resolved?.canon)
                    out = resolved.done && peer.isTop ? resolved :
                        (0, unify_1.unite)(ctx, resolved, peer, 'func-' + this.funcname() + '/' + this.id, (0, utility_1.ec)(te, 'PEG'));
                    (0, utility_1.propagateMarks)(this, out);
                    // const unified =
                    //   unite(ctx, resolved, peer, 'func-' + this.funcname() + '/' + this.id)
                    // out = unified
                    // propagateMarks(unified, out)
                    // propagateMarks(this, out)
                    // TODO: make should handle this using ctx?
                    out.row = this.row;
                    out.col = this.col;
                    out.url = this.url;
                    out.path = this.path;
                    why += 'pegdone';
                }
                else if (peer.isTop) {
                    this.notdone();
                    out = this.make(ctx, { peg: newpeg, mark: { type: newtype, hide: newhide } });
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
                    this.notdone();
                    out = new ConjunctVal_1.ConjunctVal({
                        peg: [this, peer], mark: { type: newtype, hide: newhide }
                    }, ctx);
                    // TODO: make should handle this using ctx?
                    out.row = this.row;
                    out.col = this.col;
                    out.url = this.url;
                    out.path = this.path;
                    why += 'defer';
                }
            }
        }
        // console.log('FUNC-UNIFY-OUT', this.funcname(), this.id, this.canon, 'W=', why, peer.id, peer.canon, 'O=', out.dc, out.id, out.canon)
        (0, utility_1.explainClose)(te, out);
        return out;
    }
    get canon() {
        return '' +
            // (this.type ? '<type>' : '') +
            // (this.done ? '<done>' : '') +
            // (this.id + '=') +
            this.funcname() + '(' + (this.peg.map((p) => p.canon).join(',')) + ')';
    }
    funcname() {
        return 'func';
    }
    prepare(_ctx, args) {
        return args;
    }
    resolve(ctx, _args) {
        return NilVal_1.NilVal.make(ctx, 'func:' + this.funcname(), this, undefined, 'resolve');
    }
}
exports.FuncBaseVal = FuncBaseVal;
//# sourceMappingURL=FuncBaseVal.js.map