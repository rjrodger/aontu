"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyFuncVal = void 0;
const StringVal_1 = require("../val/StringVal");
const ConjunctVal_1 = require("../val/ConjunctVal");
const FuncBaseVal_1 = require("./FuncBaseVal");
const err_1 = require("../err");
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
    resolve(ctx, _args) {
        let out = this;
        // if (!this.mark.type && !this.mark.hide) {
        //
        // THE LEVEL MUST BE AN INTEGER, OR ABSENT.
        //
        // A level is an index into the path (0 the own key, the default 1 the
        // parent), so the argument is an integer or it is a mistake. Both
        // exact integer leaves qualify -- `integer` and `biginteger` -- and
        // everything else is refused rather than silently meaning "parent",
        // which is what made a mistyped level undetectable.
        //
        // This also removes a crash. The test used to be
        // `isNaN(move) ? 1 : +move` with the COERCING global isNaN, which is
        // ToNumber, and ToNumber THROWS for a bigint (a biginteger's peg) and
        // for the null-prototype object a map's peg is -- neither has a
        // toString or valueOf to call. The exception escaped into unify's
        // catch-all and surfaced as an opaque [aontu/internal].
        const argval = this.peg?.[0];
        let move = 1;
        if (null != argval) {
            if (argval.isInteger) {
                move = argval.peg;
            }
            else if (argval.isBigInteger) {
                // A level far outside the path simply misses, exactly as an
                // out-of-range plain integer already does, so Number() here needs
                // no bound of its own.
                move = Number(argval.peg);
            }
            else {
                return (0, err_1.makeNilErr)(ctx, 'key_level', this);
            }
        }
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