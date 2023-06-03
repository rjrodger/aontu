"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
const MapVal_1 = require("../val/MapVal");
const Nil_1 = require("../val/Nil");
const VarVal_1 = require("../val/VarVal");
const ValBase_1 = require("../val/ValBase");
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
        // console.log('APPEND', part)
        let partstr;
        if ('string' === typeof part) {
            // this.parts.push(part)
            partstr = part;
        }
        else if (part instanceof val_1.StringVal) {
            // this.parts.push(part.peg)
            partstr = part.peg;
        }
        else if (part instanceof VarVal_1.VarVal) {
            if (part.peg instanceof RefVal) {
                this.absolute = true;
                part = part.peg;
            }
            else {
                partstr = part;
            }
        }
        if (part instanceof RefVal) {
            this.attr = part.attr;
            this.parts.push(...part.parts);
            if (0 < this.parts.length) {
                partstr = this.parts[this.parts.length - 1];
                this.parts.length = this.parts.length - 1;
            }
            if (part.absolute) {
                this.absolute = true;
            }
        }
        if (null != partstr) {
            // let m = partstr.match(/^(.*)\$([^$]+)$/)
            // if (m) {
            //   partstr = m[1]
            //   this.attr = { kind: m[2], part: partstr }
            // }
            if ('' != partstr) {
                this.parts.push(partstr);
            }
        }
        this.peg =
            (this.absolute ? this.root : '') +
                (0 < this.parts.length ? this.sep : '') +
                // this.parts.join(this.sep)
                this.parts.map((p) => this.sep === p ? '' :
                    (p.isVal ? p.canon : '' + p))
                    .join(this.sep) +
                (null == this.attr ? '' : '$' + this.attr.kind);
        // console.log('APPEND PEG', this.peg, this.absolute)
    }
    unify(peer, ctx) {
        let out = this;
        let why = 'id';
        if (this.id !== peer.id) {
            // TODO: not resolved when all Vals in path are done is an error
            // as path cannot be found
            // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
            let resolved = null == ctx ? this : this.find(ctx);
            resolved = resolved || this;
            if (resolved instanceof RefVal) {
                if (val_1.TOP === peer) {
                    out = this;
                    why = 'pt';
                }
                else if (peer instanceof Nil_1.Nil) {
                    out = Nil_1.Nil.make(ctx, 'ref[' + this.peg + ']', this, peer);
                    why = 'pn';
                }
                // same path
                else if (this.peg === peer.peg) {
                    out = this;
                    why = 'pp';
                }
                else {
                    // Ensure RefVal done is incremented
                    this.done = type_1.DONE === this.done ? type_1.DONE : this.done + 1;
                    out = new ConjunctVal_1.ConjunctVal([this, peer], ctx);
                    why = 'cj';
                }
            }
            else {
                out = (0, op_1.unite)(ctx, resolved, peer, 'ref');
                why = 'u';
            }
            out.done = type_1.DONE === out.done ? type_1.DONE : this.done + 1;
        }
        // console.log('RV', why, this.id, this.canon, '&', peer.canon, '->', out.canon)
        return out;
    }
    find(ctx) {
        // TODO: relative paths
        // if (this.root instanceof MapVal && ref.absolute) {
        // NOTE: path *to* the ref, not the ref itself!
        let fullpath = this.path;
        let parts = [];
        let modes = [];
        // console.log('PARTS', this.parts)
        for (let pI = 0; pI < this.parts.length; pI++) {
            let part = this.parts[pI];
            if (part instanceof VarVal_1.VarVal) {
                let strval = part.peg;
                let name = strval ? '' + strval.peg : '';
                // console.log('QQQ name', name, pI, this.parts.length)
                if ('KEY' === name) {
                    if (pI === this.parts.length - 1) {
                        modes.push(name);
                    }
                    else {
                        // TODO: return a Nil explaining error
                        return;
                    }
                }
                if ('SELF' === name) {
                    if (pI === 0) {
                        modes.push(name);
                    }
                    else {
                        // TODO: return a Nil explaining error
                        return;
                    }
                }
                else if ('PARENT' === name) {
                    if (pI === 0) {
                        modes.push(name);
                    }
                    else {
                        // TODO: return a Nil explaining error
                        return;
                    }
                }
                else if (0 === modes.length) {
                    part = part.unify(val_1.TOP, ctx);
                    if (part instanceof Nil_1.Nil) {
                        // TODO: var not found, so can't find path
                        return;
                    }
                    else {
                        part = '' + part.peg;
                    }
                }
            }
            else {
                parts.push(part);
            }
        }
        // console.log('modes', modes)
        if (this.absolute) {
            fullpath = parts;
        }
        else {
            fullpath = fullpath.slice(0, (modes.includes('SELF') ? 0 :
                modes.includes('PARENT') ? -1 :
                    -1 // siblings
            )).concat(parts);
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
            // if (this.attr && 'KEY' === this.attr.kind) {
            if (modes.includes('KEY')) {
                // let key = fullpath[fullpath.length - ('' === this.attr.part ? 1 : 2)]
                let key = fullpath[fullpath.length - 1];
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
        let str = (this.absolute ? this.root : '') +
            (0 < this.parts.length ? this.sep : '') +
            // this.parts.join(this.sep)
            this.parts.map((p) => this.sep === p ? '' :
                (p.isVal ? p.canon : '' + p))
                .join(this.sep) +
            (null == this.attr ? '' : '$' + this.attr.kind);
        return str;
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