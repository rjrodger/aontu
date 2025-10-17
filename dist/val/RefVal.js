"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = void 0;
/* TODO
   Rename ot PathVal
   
   $SELF.a - path starting at self
   $PARENT.b === .b - sibling

   implement $ as a prefix operator
   this allows "$AString" to be used for literal part names
*/
const utility_1 = require("../utility");
const type_1 = require("../type");
const unify_1 = require("../unify");
const TopVal_1 = require("./TopVal");
const StringVal_1 = require("./StringVal");
const ConjunctVal_1 = require("./ConjunctVal");
const MapVal_1 = require("./MapVal");
const ListVal_1 = require("./ListVal");
const NilVal_1 = require("./NilVal");
const VarVal_1 = require("./VarVal");
const FeatureVal_1 = require("./FeatureVal");
class RefVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isRef = true;
        this.absolute = false;
        this.prefix = false;
        this.peg = [];
        this.absolute = true === this.absolute ? true : // absolute sticks
            true === spec.absolute ? true : false;
        this.prefix = true === spec.prefix;
        for (let pI = 0; pI < spec.peg.length; pI++) {
            this.append(spec.peg[pI]);
        }
        // // // console.log('RefVal', this.id, this.peg)
    }
    append(part) {
        let partval;
        if ('string' === typeof part) {
            partval = part;
            this.peg.push(partval);
        }
        else if (part instanceof StringVal_1.StringVal) {
            partval = part.peg;
            this.peg.push(partval);
        }
        else if (part instanceof VarVal_1.VarVal) {
            partval = part;
            this.peg.push(partval);
        }
        else if (part instanceof RefVal) {
            if (part.absolute) {
                this.absolute = true;
            }
            if (this.prefix) {
                if (part.prefix) {
                    this.peg.push('.');
                }
            }
            else {
                if (part.prefix) {
                    if (0 === this.peg.length) {
                        this.prefix = true;
                    }
                    else if (0 < this.peg.length) {
                        this.peg.push('.');
                    }
                }
            }
            this.peg.push(...part.peg);
        }
        // // // console.log('RefVal-append', this.id, this.peg)
    }
    unify(peer, ctx) {
        let out = this;
        // let why = 'id'
        if (this.id !== peer.id) {
            // TODO: not resolved when all Vals in path are done is an error
            // as path cannot be found
            // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
            let found = null == ctx ? this : this.find(ctx);
            const resolved = found ?? this;
            // const resolved = found ? found.clone(null, ctx) : this
            // // // console.log('REF', this.id, this.peg, '->',
            //  found?.id, found?.canon, 'C=', resolved?.id, resolved?.canon)
            if (null == resolved && this.canon === peer.canon) {
                out = this;
            }
            else if (resolved instanceof RefVal) {
                if (TopVal_1.TOP === peer) {
                    out = this;
                    // why = 'pt'
                }
                else if (peer.isNil) {
                    out = NilVal_1.NilVal.make(ctx, 'ref[' + this.peg + ']', this, peer);
                    // why = 'pn'
                }
                // same path
                // else if (this.peg === peer.peg) {
                else if (this.canon === peer.canon) {
                    out = this;
                    // why = 'pp'
                }
                else {
                    // Ensure RefVal done is incremented
                    this.dc = type_1.DONE === this.dc ? type_1.DONE : this.dc + 1;
                    out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
                    // why = 'cj'
                }
            }
            else {
                out = (0, unify_1.unite)(ctx, resolved, peer, 'ref');
                // why = 'u'
            }
            out.dc = type_1.DONE === out.dc ? type_1.DONE : this.dc + 1;
        }
        // // // console.log('REF:', this.peg, '->', out.canon)
        return out;
    }
    find(ctx) {
        let out = undefined;
        // NOTE: path *to* the ref, not the ref itself!
        let fullpath = this.path;
        let parts = [];
        let modes = [];
        for (let pI = 0; pI < this.peg.length; pI++) {
            let part = this.peg[pI];
            if (part instanceof VarVal_1.VarVal) {
                let strval = part.peg;
                let name = strval ? '' + strval.peg : '';
                if ('KEY' === name) {
                    if (pI === this.peg.length - 1) {
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
                    part = part.unify(TopVal_1.TOP, ctx);
                    if (part.isNil) {
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
        if (this.absolute) {
            fullpath = parts;
        }
        else {
            fullpath = fullpath.slice(0, (modes.includes('SELF') ? 0 :
                modes.includes('PARENT') ? -1 :
                    -1 // siblings
            )).concat(parts);
        }
        let sep = '.';
        fullpath = fullpath
            .reduce(((a, p) => (p === sep ? a.length = a.length - 1 : a.push(p), a)), []);
        if (modes.includes('KEY')) {
            let key = this.path[this.path.length - 2];
            let sv = new StringVal_1.StringVal({ peg: null == key ? '' : key }, ctx);
            // TODO: other props?
            sv.dc = type_1.DONE;
            sv.path = this.path;
            return sv;
        }
        let node = ctx.root;
        let pI = 0;
        for (; pI < fullpath.length; pI++) {
            let part = fullpath[pI];
            if (node instanceof MapVal_1.MapVal) {
                node = node.peg[part];
            }
            else if (node instanceof ListVal_1.ListVal) {
                node = node.peg[part];
            }
            else {
                break;
            }
        }
        if (pI === fullpath.length) {
            out = node;
            // Types are cloned and made concrete
            if (null != out && out.type) {
                out = out.clone(ctx);
                (0, utility_1.walk)(out, (_key, val) => {
                    val.type = false;
                    return val;
                });
            }
        }
        return out;
    }
    same(peer) {
        return null == peer ? false : this.peg === peer.peg;
    }
    clone(ctx, spec) {
        let out = super.clone(ctx, {
            peg: this.peg,
            absolute: this.absolute,
            ...(spec || {})
        });
        return out;
    }
    get canon() {
        let str = (this.absolute ? '$' : '') +
            (0 < this.peg.length ? '.' : '') +
            // this.peg.join(this.sep)
            this.peg.map((p) => '.' === p ? '' :
                (p.isVal ? p.canon : '' + p))
                .join('.');
        return str;
    }
    gen(ctx) {
        // Unresolved ref cannot be generated, so always an error.
        let nil = NilVal_1.NilVal.make(ctx, 'ref', this, // (formatPath(this.peg, this.absolute) as any),
        undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        // descErr(nil, ctx)
        if (null == ctx) {
            //   // ctx.err.push(nil)
            //   ctx.adderr(nil)
            // }
            // else {
            throw new Error(nil.msg ?? 'RefVal: unknown error');
        }
        return undefined;
    }
}
exports.RefVal = RefVal;
//# sourceMappingURL=RefVal.js.map