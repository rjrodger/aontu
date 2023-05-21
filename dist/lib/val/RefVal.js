"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const Nil_1 = require("../val/Nil");
const MapVal_1 = require("./MapVal");
const ValBase_1 = require("../val/ValBase");
const ConjunctVal_1 = require("../val/ConjunctVal");
const val_1 = require("../val");
class RefVal extends ValBase_1.ValBase {
    constructor(peg, ctx) {
        var _a;
        super('', ctx);
        this.sep = '.';
        this.root = '$';
        // TODO this.peg is a string! breaks clone - refactor
        if ('string' === typeof peg) {
            this.parts = [];
            this.absolute = false;
            return;
        }
        this.absolute =
            this.root === peg[0] ||
                this.root === ((_a = peg[0]) === null || _a === void 0 ? void 0 : _a.peg);
        if (this.absolute) {
            this.peg = this.root;
        }
        else if (1 === peg.length && peg[0] instanceof RefVal) {
            peg.unshift(this.sep);
        }
        this.parts = [];
        let pI = this.absolute ? 1 : 0;
        for (; pI < peg.length; pI++) {
            this.append(peg[pI]);
        }
    }
    append(part) {
        let partstr;
        if ('string' === typeof part) {
            // this.parts.push(part)
            partstr = part;
        }
        else if (part instanceof val_1.StringVal) {
            // this.parts.push(part.peg)
            partstr = part.peg;
        }
        else if (part instanceof RefVal) {
            this.attr = part.attr;
            this.parts.push(...part.parts);
            if (0 < this.parts.length) {
                partstr = this.parts[this.parts.length - 1];
                this.parts.length = this.parts.length - 1;
            }
            // if (part.absolute) {
            //   this.absolute = true
            // }
        }
        if (null != partstr) {
            let m = partstr.match(/^(.*)\$([^$]+)$/);
            if (m) {
                partstr = m[1];
                this.attr = { kind: m[2], part: partstr };
            }
            if ('' != partstr) {
                this.parts.push(partstr);
            }
        }
        this.peg =
            (this.absolute ? this.root : '') +
                (0 < this.parts.length ? this.sep : '') +
                // this.parts.join(this.sep)
                this.parts.map(p => this.sep === p ? '' : p).join(this.sep) +
                (null == this.attr ? '' : '$' + this.attr.kind);
    }
    unify(peer, ctx) {
        if (this.id === peer.id) {
            return this;
        }
        // TODO: not resolved when all Vals in path are done is an error
        // as path cannot be found
        // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
        let resolved = null == ctx ? this : this.find(ctx);
        resolved = resolved || this;
        let out;
        if (resolved instanceof RefVal) {
            if (type_1.TOP === peer) {
                out = this;
            }
            else if (peer instanceof Nil_1.Nil) {
                out = Nil_1.Nil.make(ctx, 'ref[' + this.peg + ']', this, peer);
            }
            // same path
            else if (this.peg === peer.peg) {
                out = this;
            }
            else {
                // Ensure RefVal done is incremented
                this.done = type_1.DONE === this.done ? type_1.DONE : this.done + 1;
                out = new ConjunctVal_1.ConjunctVal([this, peer], ctx);
            }
        }
        else {
            out = (0, op_1.unite)(ctx, resolved, peer);
        }
        out.done = type_1.DONE === out.done ? type_1.DONE : this.done + 1;
        return out;
    }
    find(ctx) {
        // TODO: relative paths
        // if (this.root instanceof MapVal && ref.absolute) {
        // NOTE: path *to* the ref, not the ref itself!
        let fullpath = this.path;
        if (this.absolute) {
            fullpath = this.parts; // ignore '$' at start
        }
        else {
            fullpath = fullpath.slice(0, -1).concat(this.parts);
        }
        let sep = this.sep;
        fullpath = fullpath
            .reduce(((a, p) => (p === sep ? a.length = a.length - 1 : a.push(p), a)), []);
        let node = ctx.root;
        let pI = 0;
        for (; pI < fullpath.length; pI++) {
            let part = fullpath[pI];
            if (node instanceof MapVal_1.MapVal) {
                node = node.peg[part];
            }
            else {
                break;
            }
        }
        if (pI === fullpath.length) {
            if (this.attr && 'KEY' === this.attr.kind) {
                let key = fullpath[fullpath.length - ('' === this.attr.part ? 1 : 2)];
                let sv = new val_1.StringVal(null == key ? '' : key, ctx);
                // TODO: other props?
                sv.done = type_1.DONE;
                sv.path = this.path;
                return sv;
            }
            else {
                return node;
            }
        }
    }
    same(peer) {
        return null == peer ? false : this.peg === peer.peg;
    }
    clone(ctx) {
        let out = super.clone(ctx);
        out.absolute = this.absolute;
        out.peg = this.peg;
        out.parts = this.parts.slice(0);
        out.attr = this.attr;
        return out;
    }
    get canon() {
        return this.peg;
    }
    gen(ctx) {
        if (ctx) {
            ctx.err.push(Nil_1.Nil.make(ctx, 'ref', this.peg, undefined));
        }
        throw new Error('REF-gen ' + this.peg);
        return undefined;
    }
}
exports.RefVal = RefVal;
//# sourceMappingURL=RefVal.js.map