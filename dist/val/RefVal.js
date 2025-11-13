"use strict";
/* Copyright (c) 2021-2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = void 0;
const utility_1 = require("../utility");
const type_1 = require("../type");
const err_1 = require("../err");
const unify_1 = require("../unify");
const top_1 = require("./top");
const StringVal_1 = require("./StringVal");
const IntegerVal_1 = require("./IntegerVal");
const NumberVal_1 = require("./NumberVal");
const ConjunctVal_1 = require("./ConjunctVal");
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
        //console.log('RefVal', this.id, this.peg)
    }
    append(part) {
        let partval;
        // console.log('APPEND', part)
        if ('string' === typeof part) {
            partval = part;
            this.peg.push(partval);
        }
        else if (part instanceof StringVal_1.StringVal) {
            partval = part.peg;
            this.peg.push(partval);
        }
        else if (part instanceof IntegerVal_1.IntegerVal) {
            // partval = '' + part.peg
            partval = part.src;
            this.peg.push(partval);
        }
        // TODO: this is a bit of a hack, review
        // Seems like a fundamental ambiguity?
        // Resolved by path function
        else if (part instanceof NumberVal_1.NumberVal) {
            // let partvals: string[] = part.peg.toFixed(11).replace(/(\.0)?0+$/, '$1').split('.')
            let partvals = part.src.split('.');
            this.peg.push(...partvals);
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
    }
    unify(peer, ctx) {
        peer = peer ?? (0, top_1.top)();
        const te = ctx.explain && (0, utility_1.explainOpen)(ctx, ctx.explain, 'Ref', this, peer);
        let out = this;
        let why = 'id';
        if (this.id !== peer.id) {
            // TODO: not resolved when all Vals in path are done is an error
            // as path cannot be found
            // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
            let found = null == ctx ? this : this.find(ctx);
            const resolved = found ?? this;
            if (null == resolved && this.canon === peer.canon) {
                out = this;
            }
            else if (resolved instanceof RefVal) {
                if (peer.isTop) {
                    out = this;
                    why = 'pt';
                }
                else if (peer.isNil) {
                    out = (0, err_1.makeNilErr)(ctx, 'ref[' + this.peg + ']', this, peer);
                    why = 'pn';
                }
                // same path
                else if (this.canon === peer.canon) {
                    out = this;
                    why = 'pp';
                }
                else {
                    // Ensure RefVal done is incremented
                    this.dc = type_1.DONE === this.dc ? type_1.DONE : this.dc + 1;
                    out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
                    why = 'cj';
                }
            }
            else {
                out = (0, unify_1.unite)(ctx.clone({ explain: (0, utility_1.ec)(te, 'RES') }), resolved, peer, 'ref');
                why = 'u';
            }
            out.dc = type_1.DONE === out.dc ? type_1.DONE : this.dc + 1;
        }
        // console.log('REFVAL-UNIFY-OUT', ctx.cc, this.id, this.canon, this.done, 'P=', peer.id, peer.canon, peer.done, '->', out.id, out.canon, out.done)
        (0, utility_1.explainClose)(te, out);
        return out;
    }
    find(ctx) {
        let out = undefined;
        const selfpath = this.path.join('.');
        const pegpath = this.peg.join('.');
        const isprefixpath = selfpath.startsWith(pegpath);
        let refpath = [];
        let pI = 0;
        // let descent = ''
        if (isprefixpath) {
            out = (0, err_1.makeNilErr)(ctx, 'path_cycle', this);
        }
        else {
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
                        part = part.unify((0, top_1.top)(), ctx);
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
                refpath = parts;
            }
            else {
                // TODO: deprecate $KEY, etc
                refpath = this.path.slice(0, (modes.includes('SELF') ? 0 :
                    modes.includes('PARENT') ? -1 :
                        -1 // siblings
                )).concat(parts);
            }
            let sep = '.';
            refpath = refpath
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
            let nopath = false;
            if (null != node) {
                for (; pI < refpath.length; pI++) {
                    let part = refpath[pI];
                    // console.log('PART', pI, part, node)
                    // descent += (' | ' + pI + '=' + node.canon) // Util.inspect(node))
                    if (node.isMap) {
                        node = node.peg[part];
                    }
                    else if (node.isList) {
                        node = node.peg[part];
                    }
                    else if (node.done) {
                        nopath = true;
                        break;
                    }
                    else {
                        break;
                    }
                    if (null == node) {
                        nopath = true;
                        break;
                    }
                }
            }
            // console.log('REFPATH', ctx.cc, pI, refpath, nopath, ctx.root, node)
            if (nopath) {
                out = (0, err_1.makeNilErr)(ctx, 'no_path', this);
            }
            else if (pI === refpath.length) {
                out = node;
                // Types and hidden values are cloned and made concrete
                if (null != out) { //  && (out.mark.type || out.mark.hide)) {
                    // console.log('FOUND-A', out)
                    if (this.mark.type || this.mark.hide) {
                        out.mark.type = this.mark.type;
                        out.mark.hide = this.mark.hide;
                        // walk(out, (_key: string | number | undefined, val: Val) => {
                        //   val.mark.type = this.mark.type
                        //   val.mark.hide = this.mark.hide
                        //   return val
                        // })
                    }
                    if (this.mark._hide_found) {
                        out.mark.hide = true;
                    }
                    // console.log('FOUND-B', out)
                    out = out.clone(ctx);
                    // if (this.mark.type || this.mark.hide) {
                    (0, utility_1.walk)(out, (_key, val) => {
                        val.mark.type = false;
                        val.mark.hide = false;
                        return val;
                    });
                    //}
                    // onsole.log('FOUND-C', out)
                }
            }
        }
        // console.log('REF-FIND', ctx.cc, this.id, selfpath, 'PEG=', pegpath, 'RP', pI, refpath.join('.'), descent, 'O=', out?.id, out?.canon, out?.done)
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
        let nil = (0, err_1.makeNilErr)(ctx, 'ref', this, // (formatPath(this.peg, this.absolute) as any),
        undefined);
        // TODO: refactor to use Site pointer
        nil.path = this.path;
        nil.site.url = this.site.url;
        nil.site.row = this.site.row;
        nil.site.col = this.site.col;
        return undefined;
    }
    inspection() {
        return [
            this.absolute ? 'absolute' : '',
            this.prefix ? 'prefix' : '',
        ].filter(p => '' != p).join(',');
    }
}
exports.RefVal = RefVal;
//# sourceMappingURL=RefVal.js.map