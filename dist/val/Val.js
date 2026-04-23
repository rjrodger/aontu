"use strict";
/* Copyright (c) 2022-2025 Richard Rodger, MIT License */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Val_ctx;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_ERR = exports.SPREAD = exports.DONE = exports.Val = void 0;
exports.empty = empty;
const node_util_1 = require("node:util");
const site_1 = require("../site");
const DONE = -1;
exports.DONE = DONE;
const SPREAD = Symbol('spread');
exports.SPREAD = SPREAD;
// Shared frozen empty array for lazy err initialization.
// Most Vals never accumulate errors, so this avoids one allocation per Val.
// Frozen to catch accidental mutation (e.g. push) - callers that need a
// mutable error array must create their own.
const EMPTY_ERR = Object.freeze([]);
exports.EMPTY_ERR = EMPTY_ERR;
let ID = 1000;
class Val {
    get site() {
        return this._site ??= new site_1.Site();
    }
    set site(s) {
        this._site = s;
    }
    // TODO: Site needed in ctor
    constructor(spec, ctx) {
        this.dc = 0;
        this.path = [];
        // Map of boolean flags.
        this.mark = {
            type: false,
            hide: false,
        };
        // Actual native value.
        this.peg = undefined;
        // Lazy err: shared empty array avoids allocation per Val.
        // Most Vals never accumulate errors. Only NilVal and top-level
        // results assign a real error array.
        this.err = EMPTY_ERR;
        this.explain = null;
        _Val_ctx.set(this, void 0);
        __classPrivateFieldSet(this, _Val_ctx, ctx, "f");
        this.peg = spec?.peg;
        if (Array.isArray(this.peg)) {
            let spread = this.peg[SPREAD];
            if (this.peg.includes(undefined)) {
                this.peg = this.peg.filter(n => undefined !== n);
            }
            ;
            this.peg[SPREAD] = spread;
        }
        // spec.path takes precedence over ctx.path: lets callers (notably
        // Val.clone) specify the target path without paying for a full
        // ctx.clone just to carry it.
        this.path = spec?.path ?? ctx?.path ?? [];
        // TODO: make this work
        // this.id = spec?.id ?? (ctx ? ++ctx.vc : ++ID)
        this.id = ++ID;
        this.mark.type = !!spec.mark?.type;
        this.mark.hide = !!spec.mark?.hide;
        // console.log('BV', this.id, this.constructor.name, this.peg?.canon)
    }
    ctx() {
        return __classPrivateFieldGet(this, _Val_ctx, "f");
    }
    get done() {
        return this.dc === DONE;
    }
    same(peer) {
        return null == peer ? false : this.id === peer.id;
    }
    clone(ctx, spec) {
        let path = spec?.path;
        if (null == path) {
            let cut = this.path.indexOf('&');
            cut = -1 < cut ? cut + 1 : ctx.path.length;
            path = ctx.path.concat(this.path.slice(cut));
        }
        // Carry the target path via the spec instead of cloning ctx just
        // to hold it: the Val constructor now reads spec.path first. This
        // saves ~120k ctx.clone calls (two Object.create each) on a
        // foo-sdk-sized model.
        let fullspec = {
            peg: this.peg,
            mark: { type: this.mark.type, hide: this.mark.hide },
            ...(spec ?? {}),
            path,
        };
        let out = new this
            .constructor(fullspec, ctx);
        out.dc = this.done ? DONE : out.dc;
        out.site.row = spec?.row ?? this.site.row ?? -1;
        out.site.col = spec?.col ?? this.site.col ?? -1;
        out.site.url = spec?.url ?? this.site.url ?? '';
        out.mark = Object.assign({}, this.mark, fullspec.mark ?? {});
        out.mark.type = this.mark.type && (fullspec.mark?.type ?? true);
        out.mark.hide = this.mark.hide && (fullspec.mark?.hide ?? true);
        return out;
    }
    // Shallow clone for spread constraints: creates a new Val with the
    // correct path context but shares non-path-dependent children.
    // Override in MapVal/ListVal to avoid deep-cloning simple children.
    spreadClone(ctx) {
        return this.clone(ctx);
    }
    get isPathDependent() {
        if (this._isPathDependent !== undefined)
            return this._isPathDependent;
        let dep = this.isRef || this.isKeyFunc || this.isPathFunc ||
            this.isMoveFunc || this.isSuperFunc;
        if (!dep) {
            const peg = this.peg;
            if (Array.isArray(peg)) {
                for (let i = 0; i < peg.length; i++) {
                    const c = peg[i];
                    if (c && c.isVal && c.isPathDependent) {
                        dep = true;
                        break;
                    }
                }
            }
            else if (peg != null && typeof peg === 'object') {
                for (const k in peg) {
                    const c = peg[k];
                    if (c && c.isVal && c.isPathDependent) {
                        dep = true;
                        break;
                    }
                }
            }
            if (!dep) {
                const spreadCj = this.spread?.cj;
                if (spreadCj && spreadCj.isPathDependent)
                    dep = true;
            }
        }
        this._isPathDependent = dep;
        return dep;
    }
    place(v) {
        v.site.row = this.site.row;
        v.site.col = this.site.col;
        v.site.url = this.site.url;
        return v;
    }
    // NOTE: MUST not mutate! Val immutability is a critical assumption.
    unify(_peer, _ctx) { return this; }
    // TODO: indicate marks in some way that is ignored by reparse.
    // Need an annotation/taggins syntax? a:{}/type ?
    get canon() { return ''; }
    errcanon() {
        return 0 === this.err.length ? '' : `<ERRS:${this.err.length}>`;
    }
    gen(_ctx) {
        return undefined;
    }
    notdone() {
        this.dc = DONE === this.dc ? DONE : this.dc + 1;
    }
    [(_Val_ctx = new WeakMap(), node_util_1.inspect.custom)](d, _opts, _inspect) {
        return this.inspect(d);
    }
    inspect(d) {
        d = null == d ? -1 : d;
        let s = ['<' + this.constructor.name.replace(/Val$/, '') + '/' + this.id];
        s.push('/@' + this.site?.row + ',' + this.site?.col);
        s.push('/' + this.path.join('.') + '/');
        s.push([
            DONE === this.dc ? 'D' : 'd' + this.dc,
            ...Object.entries(this.mark).filter(n => n[1]).map(n => n[0]).sort()
        ].filter(n => null != n).join(','));
        // let insp = this.inspection(inspect)
        let insp = this.inspection(1 + d);
        if (null != insp && '' != insp) {
            s.push('/' + insp);
        }
        s.push('/');
        if (this.peg?.isVal) {
            s.push(this.peg.inspect(1 + d));
        }
        else if (null != this.peg && 'object' === typeof this.peg &&
            Object.entries(this.peg)[0]?.[1]?.isVal) {
            s.push(inspectpeg(this.peg, 1 + d));
        }
        else if ('function' === typeof this.peg) {
            s.push(this.peg.name);
        }
        else {
            s.push(this.peg?.toString?.() ?? '');
        }
        s.push('>');
        const out = s.join('');
        return out;
    }
    inspection(_d) {
        return '';
    }
}
exports.Val = Val;
// Prototype-level defaults for Val's type-discriminator flags.
// Keeping these on the prototype (instead of per-instance class-field
// initializers) removes ~35 property writes from every Val construction
// and eliminates the corresponding hidden-class transitions. Subclasses
// override only the flags that differ, via their own class-field
// initializers (e.g. `MapVal.isMap = true`).
Object.assign(Val.prototype, {
    isVal: true,
    isTop: false,
    isNil: false,
    isMap: false,
    isList: false,
    isScalar: false,
    isScalarKind: false,
    isRef: false,
    isPref: false,
    isVar: false,
    isBag: false,
    isSpread: false,
    isNumber: false,
    isInteger: false,
    isString: false,
    isBoolean: false,
    isConjunct: false,
    isDisjunct: false,
    isJunction: false,
    cjo: 99999,
    isOp: false,
    isPlusOp: false,
    isFunc: false,
    isCloseFunc: false,
    isCopyFunc: false,
    isHideFunc: false,
    isMoveFunc: false,
    isKeyFunc: false,
    isLowerFunc: false,
    isOpenFunc: false,
    isPathFunc: false,
    isPrefFunc: false,
    isSuperFunc: false,
    isTypeFunc: false,
    isUpperFunc: false,
    isGenable: false,
});
function inspectpeg(peg, d) {
    const indent = '  '.repeat(d);
    return pretty(Array.isArray(peg) ?
        ('[' + peg.map(n => '\n  ' + indent + (n.inspect?.(d) ?? n)).join(',') +
            '\n' + indent + ']') :
        ('{' +
            Object.entries(peg).map((n) => '\n  ' + indent + n[0] + ': ' + // n[1].inspect(d)
                (n[1].inspect(d) ?? '' + n[1])).join(',') +
            '\n' + indent + '}'));
}
function pretty(s) {
    return ((String(s))
        .replace(/\[Object: null prototype\]/g, '')
    // .replace(/([^\n]) +/g, '$1')
    );
}
function empty(o) {
    return ((Array.isArray(o) && 0 === o.length)
        || (null != o && 'object' === typeof o && 0 === Object.keys(o).length)
        || false);
}
//# sourceMappingURL=Val.js.map