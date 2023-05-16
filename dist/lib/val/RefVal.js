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
    constructor(peg) {
        var _a;
        super('');
        this.sep = '.';
        this.root = '$';
        // console.log('RC', peg)
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
        //console.log('APPEND 0', part)
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
        // console.log('PARTSTR', partstr)
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
        // console.log('PEG', this.peg)
    }
    unify(peer, ctx) {
        if (this.id === peer.id) {
            return this;
        }
        // TODO: not resolved when all Vals in path are done is an error
        // as path cannot be found
        // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
        let resolved = null == ctx ? this : this.find(ctx);
        // console.log('REF', resolved, this.peg, peer.canon)
        // if (null == resolved && peer instanceof RefVal && this.peg === peer.peg) {
        //   console.log('SAMEREF', this.peg, this.id, this.done, peer.canon, peer.id)
        // }
        // if (null == resolved && 0 < this.done) {
        //   console.log('UREF', this.peg, this.done, peer.canon)
        // }
        // Don't try to resolve paths forever.
        // TODO: large amount of reruns needed? why?
        // resolved =
        //   null == resolved &&
        //     9999 < this.done
        //     ?
        //     Nil.make(ctx, 'no-path', this, peer)
        //     : (resolved || this)
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
            // console.log('WWW', out, resolved, peer)
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
        // console.log('FP', this.absolute, this.parts, fullpath)
        let node = ctx.root;
        let pI = 0;
        for (; pI < fullpath.length; pI++) {
            let part = fullpath[pI];
            if (node instanceof MapVal_1.MapVal) {
                node = node.peg[part];
            }
            else {
                // console.log(
                //   'FIND', ref.parts, pI, node.constructor.name,
                //   node.peg.map(
                //     (n: any) =>
                //       n.constructor.name + ':' + n.done +
                //       ' {' + Object.keys(n.peg) + '}'
                //   )
                // )
                break;
            }
        }
        // console.log('FIND', pI, fullpath, this.attr)
        if (pI === fullpath.length) {
            if (this.attr && 'KEY' === this.attr.kind) {
                let key = fullpath[fullpath.length - ('' === this.attr.part ? 1 : 2)];
                // console.log('FIND KEY', key, fullpath)
                let sv = new val_1.StringVal(null == key ? '' : key, ctx);
                // TODO: other props?
                sv.done = type_1.DONE;
                sv.path = this.path;
                // console.log('SV', sv)
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