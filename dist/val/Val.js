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
exports.SPREAD = exports.DONE = exports.Val = void 0;
exports.empty = empty;
const node_util_1 = require("node:util");
const site_1 = require("../site");
const DONE = -1;
exports.DONE = DONE;
const SPREAD = Symbol('spread');
exports.SPREAD = SPREAD;
let ID = 1000;
class Val {
    // TODO: Site needed in ctor
    constructor(spec, ctx) {
        this.isVal = true;
        this.isTop = false;
        this.isNil = false;
        this.isMap = false;
        this.isList = false;
        this.isScalar = false;
        this.isScalarKind = false;
        this.isRef = false;
        this.isPref = false;
        this.isVar = false;
        this.isBag = false;
        this.isNumber = false;
        this.isInteger = false;
        this.isString = false;
        this.isBoolean = false;
        this.isConjunct = false;
        this.isDisjunct = false;
        this.isJunction = false;
        this.isOp = false;
        this.isPlusOp = false;
        this.isFunc = false;
        this.isCloseFunc = false;
        this.isCopyFunc = false;
        this.isHideFunc = false;
        this.isMoveFunc = false;
        this.isKeyFunc = false;
        this.isLowerFunc = false;
        this.isOpenFunc = false;
        this.isPathFunc = false;
        this.isPrefFunc = false;
        this.isSuperFunc = false;
        this.isTypeFunc = false;
        this.isUpperFunc = false;
        this.isGenable = false;
        this.dc = 0;
        this.path = [];
        this.site = new site_1.Site();
        // Map of boolean flags.
        this.mark = {
            type: false,
            hide: false,
        };
        // Actual native value.
        this.peg = undefined;
        // TODO: used for top level result - not great
        // err: Omit<any[], "push"> = []
        this.err = [];
        this.explain = null;
        _Val_ctx.set(this, void 0);
        __classPrivateFieldSet(this, _Val_ctx, ctx, "f");
        this.peg = spec?.peg;
        if (Array.isArray(this.peg)) {
            let spread = this.peg[SPREAD];
            this.peg = this.peg.filter(n => undefined !== n);
            this.peg[SPREAD] = spread;
        }
        this.path = ctx?.path || [];
        // TODO: make this work
        // this.id = spec?.id ?? (ctx ? ++ctx.vc : ++ID)
        this.id = ++ID;
        this.uh = [];
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
        let cloneCtx;
        let path = spec?.path;
        if (null == path) {
            let cut = this.path.indexOf('&');
            cut = -1 < cut ? cut + 1 : ctx.path.length;
            path = ctx.path.concat(this.path.slice(cut));
        }
        // console.log('CLONE', path, this.canon)
        // console.trace()
        cloneCtx = ctx.clone({ path });
        let fullspec = {
            peg: this.peg,
            mark: { type: this.mark.type, hide: this.mark.hide },
            ...(spec ?? {})
        };
        let out = new this
            .constructor(fullspec, cloneCtx);
        out.dc = this.done ? DONE : out.dc;
        out.site.row = spec?.row ?? this.site.row ?? -1;
        out.site.col = spec?.col ?? this.site.col ?? -1;
        out.site.url = spec?.url ?? this.site.url ?? '';
        out.mark = Object.assign({}, this.mark, fullspec.mark ?? {});
        out.mark.type = this.mark.type && (fullspec.mark?.type ?? true);
        out.mark.hide = this.mark.hide && (fullspec.mark?.hide ?? true);
        return out;
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