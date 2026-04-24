"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathVal = void 0;
const type_1 = require("../type");
const utility_1 = require("../utility");
const unify_1 = require("../unify");
const err_1 = require("../err");
const top_1 = require("./top");
const StringVal_1 = require("./StringVal");
const IntegerVal_1 = require("./IntegerVal");
const NumberVal_1 = require("./NumberVal");
const VarVal_1 = require("./VarVal");
const ConjunctVal_1 = require("./ConjunctVal");
const DisjunctVal_1 = require("./DisjunctVal");
const FeatureVal_1 = require("./FeatureVal");
class PathVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPath = true;
        this.isGenable = true;
        this.cjo = 32500;
        this.absolute = false;
        this.prefix = false;
        this._resolved = undefined;
        this.peg = [];
        this.absolute = true === this.absolute ? true : // absolute sticks
            true === spec.absolute ? true : false;
        this.prefix = true === spec.prefix;
        for (let pI = 0; pI < spec.peg.length; pI++) {
            this.append(spec.peg[pI]);
        }
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
        else if (part instanceof IntegerVal_1.IntegerVal) {
            partval = part.src;
            this.peg.push(partval);
        }
        else if (part instanceof NumberVal_1.NumberVal) {
            let partvals = part.src.split('.');
            this.peg.push(...partvals);
        }
        else if (part instanceof VarVal_1.VarVal) {
            partval = part;
            this.peg.push(partval);
        }
        else if (part instanceof PathVal) {
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
        // Already resolved (e.g. path value from path() function) — skip find
        if (this.done)
            return this;
        let out = this;
        const found = this.find(ctx);
        if (found != null && !found.isNil) {
            out = (0, unify_1.unite)(ctx, found, peer, 'path');
        }
        else if (found?.isNil) {
            out = found;
        }
        else {
            // Not yet resolvable — increment dc to signal not done
            this.dc = type_1.DONE === this.dc ? type_1.DONE : this.dc + 1;
        }
        return out;
    }
    find(ctx) {
        let out = undefined;
        // Check if self.path starts with peg (cycle detection).
        // Element-by-element comparison avoids string join+startsWith allocations.
        let isprefixpath = this.peg.length <= this.path.length;
        if (isprefixpath) {
            for (let i = 0; i < this.peg.length; i++) {
                if (this.peg[i] !== this.path[i]) {
                    isprefixpath = false;
                    break;
                }
            }
        }
        // Degenerate case: peg is all empty strings (e.g. path("")) and path is empty.
        if (!isprefixpath && this.peg.length > 0 && this.path.length === 0) {
            let allEmpty = true;
            for (let i = 0; i < this.peg.length; i++) {
                if ('' !== this.peg[i]) {
                    allEmpty = false;
                    break;
                }
            }
            isprefixpath = allEmpty;
        }
        let refpath = [];
        let pI = 0;
        // let descent = ''
        if (isprefixpath) {
            // console.log('SELFPATH', selfpath, 'PEGPATH', pegpath)
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
                    else if (node.isConjunct || node.isDisjunct) {
                        // Collect matching children from all junction terms,
                        // flattening nested conjuncts and disjuncts.
                        // Spreads match any key — their peg is always included.
                        const matches = [];
                        const stack = [...node.peg];
                        while (stack.length > 0) {
                            const term = stack.pop();
                            if (term.isConjunct || term.isDisjunct) {
                                stack.push(...term.peg);
                            }
                            else if (term.isSpread) {
                                matches.push(term.peg);
                            }
                            else if ((term.isMap || term.isList) && term.peg[part] != null) {
                                matches.push(term.peg[part]);
                            }
                        }
                        if (matches.length === 1) {
                            node = matches[0];
                        }
                        else if (matches.length > 1) {
                            node = node.isConjunct
                                ? new ConjunctVal_1.ConjunctVal({ peg: matches })
                                : new DisjunctVal_1.DisjunctVal({ peg: matches });
                        }
                        else {
                            node = null;
                        }
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
            else if (pI === refpath.length && node != null) {
                out = node;
                // Types and hidden values are cloned and made concrete
                if (null != out) { //  && (out.mark.type || out.mark.hide)) {
                    // console.log('FOUND-A', out)
                    if (this.mark.type || this.mark.hide) {
                        out.mark.type = this.mark.type;
                        out.mark.hide = this.mark.hide;
                    }
                    if (this.mark._hide_found) {
                        out.mark.hide = true;
                    }
                    // Cache clone+walk results per (ref, target) per iteration.
                    const cacheKey = this.id + '|' + out.id;
                    const cache = ctx._refCloneCache;
                    const cached = cache?.get(cacheKey);
                    if (cached !== undefined) {
                        out = cached;
                    }
                    else {
                        out = out.clone(ctx);
                        out.mark.type = false;
                        out.mark.hide = false;
                        (0, utility_1.walk)(out, (_key, val) => {
                            val.mark.type = false;
                            val.mark.hide = false;
                            return val;
                        });
                        cache?.set(cacheKey, out);
                    }
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
            this.peg.map((p) => '.' === p ? '' :
                (p.isVal ? p.canon : '' + p))
                .join('.');
        return str;
    }
    gen(ctx) {
        let nil = (0, err_1.makeNilErr)(ctx, 'ref', this, undefined);
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
exports.PathVal = PathVal;
//# sourceMappingURL=PathVal.js.map