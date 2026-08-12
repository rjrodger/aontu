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
const numkind_1 = require("./numkind");
const BigIntegerVal_1 = require("./BigIntegerVal");
const BigDecimalVal_1 = require("./BigDecimalVal");
// A path segment no spelling can produce, used when append meets a Val
// class it has no rule for. A key cannot contain a NUL, so this can never
// match, which turns a silent path-shortening bug into a visible miss.
const UNSPELLABLE_SEGMENT = '\u0000unspellable';
class RefVal extends FeatureVal_1.FeatureVal {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isRef = true;
        this.isGenable = true;
        this.cjo = 32500;
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
        // THE EXACT LEAVES ARE PATH TEXT LIKE ANY OTHER SPELLING. `0d1` as a
        // segment addresses the key literally spelled `0d1` -- the same key
        // `a:{0d1:7}` creates -- and is NOT the number 1, so it neither
        // indexes a list nor reaches a key spelled `1`.
        //
        // Without these branches the part fell off the end of the chain and
        // was SILENTLY DROPPED, so `$.a.0d0` resolved to `$.a` and handed back
        // the CONTAINER. That is a wrong value, not a miss -- strictly worse
        // than an error -- and it made `$.a.0d0` and `$.a.0d1` denote the same
        // location.
        else if (part instanceof BigIntegerVal_1.BigIntegerVal || part instanceof BigDecimalVal_1.BigDecimalVal) {
            // A bigdecimal splits on its point exactly as a float does, so
            // `$.x.0d1.5` addresses two levels.
            this.peg.push(...part.src.split('.'));
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
        // A closed chain, deliberately. Every branch above ends in a push, so
        // an unhandled Val class used to fall through in SILENCE and shorten
        // the path by one segment -- which is how the two exact leaves, added
        // by the number tower, made references resolve to their own container.
        // A segment that cannot be spelled is pushed as one that cannot match,
        // so the reference misses loudly instead of succeeding wrongly.
        else {
            this.peg.push(UNSPELLABLE_SEGMENT);
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
                out = (0, unify_1.unite)(te ? ctx.clone({ explain: (0, utility_1.ec)(te, 'RES') }) : ctx, resolved, peer, 'ref');
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
                            // The resolved variable IS a path segment: $seg.r with
                            // seg="x" reads ...x.r (previously the coerced value was
                            // dropped, silently reading the path without it).
                            //
                            // Integer kind renders its EXACT digits -- the FOURTH site
                            // to get this wrong (see integerDigits and #21). `'' + peg`
                            // on a JS number gives the shortest round-tripping form, so
                            // a variable bound to 2^60 addressed the key
                            // "1152921504606847000" and missed the real one. Go's
                            // ref.go dispatches on kind here and was already correct.
                            //
                            // Every other kind is already right under `'' +`: a bigint
                            // and a Decimal stringify to exact digits, and a float must
                            // keep JS parity.
                            parts.push(part.isInteger ?
                                (0, numkind_1.integerDigits)(part.peg) : '' + part.peg);
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
                // STRINGIFY. A LIST index arrives here as a JS NUMBER (jsonic puts
                // it in the path as one, and lang.ts copies the path wholesale),
                // so `.$KEY` inside a list built a StringVal whose peg was the
                // number 0 -- an ill-formed value, not a design choice: it canoned
                // as a bare 0, generated a JSON number, satisfied `number` and
                // failed `string`. Go stringifies, and key() already agreed with
                // Go, so this port disagreed with itself.
                //
                // Coerced HERE, at the consumption site, rather than by
                // normalising Val.path: the numeric segment originates in jsonic's
                // own r.k.path and every other path consumer (find's descent,
                // key(), the clone/spread machinery) already handles it.
                let key = this.path[this.path.length - 2];
                let sv = new StringVal_1.StringVal({ peg: null == key ? '' : '' + key }, ctx);
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
                // A reference landing on another reference may be a PROVEN
                // mutual cycle (a: $.b, b: $.a) -- follow the plain-ref chain
                // and, if it revisits a node, report path_cycle now instead of
                // deferring every pass and dying later as a generic ref error.
                // No proof (chain leaves plain refs, or ends) defers as before.
                if (null != out && out.isRef && this.detectRefCycle(ctx)) {
                    out = (0, err_1.makeNilErr)(ctx, 'path_cycle', this);
                }
                // Types and hidden values are cloned and made concrete
                else if (null != out) { //  && (out.mark.type || out.mark.hide)) {
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
    // Follow the chain of plain references from this node; true iff the
    // chain revisits a node -- a PROVEN reference cycle, distinct from a
    // merely unresolved reference. Detection is only on the resolution
    // chain revisiting a node, never on syntactic shape: a chain that
    // passes through a variable segment, a conjunct, a function, or any
    // non-ref value yields no proof and the ref defers as before.
    detectRefCycle(ctx) {
        const seen = new Set();
        let cur = this;
        // No hop cap: every iteration either returns or adds a NEW ref to
        // `seen`, and the tree holds finitely many refs, so the chase
        // terminates at the first repetition or the first non-ref — a cap
        // would just make cycles longer than it invisible.
        for (;;) {
            if (seen.has(cur.id)) {
                return true;
            }
            seen.add(cur.id);
            const rp = cur.plainRefPath();
            if (null == rp) {
                return false;
            }
            let node = ctx.root;
            for (let i = 0; i < rp.length && null != node; i++) {
                node = (node.isMap || node.isList) ? node.peg[rp[i]] : undefined;
            }
            if (null == node || !node.isRef) {
                return false;
            }
            cur = node;
        }
    }
    // The resolved absolute path of a reference whose segments are all
    // plain strings; undefined when the ref has variable segments (no
    // cycle proof is attempted for those). Mirrors find's refpath
    // computation for the plain case, including the `.` prefix reduction.
    plainRefPath() {
        const parts = [];
        for (const p of this.peg) {
            if ('string' !== typeof p) {
                return undefined;
            }
            parts.push(p);
        }
        const refpath = this.absolute ? parts :
            this.path.slice(0, -1).concat(parts);
        const reduced = [];
        for (const p of refpath) {
            if ('.' === p) {
                // A parent step off the top of the path proves nothing.
                if (0 === reduced.length) {
                    return undefined;
                }
                reduced.length = reduced.length - 1;
            }
            else {
                reduced.push(p);
            }
        }
        return reduced;
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
} /* node:coverage ignore next 6 */
exports.RefVal = RefVal;
//# sourceMappingURL=RefVal.js.map