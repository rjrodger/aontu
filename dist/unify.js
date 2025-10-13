"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
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
var _Context_errlist;
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = exports.Unify = exports.Context = void 0;
const type_1 = require("./type");
const val_1 = require("./val");
const lang_1 = require("./lang");
const err_1 = require("./err");
// TODO: relation to unify loops?
const MAXCYCLE = 9;
let uc = 0;
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
    const ac = a?.canon;
    const bc = b?.canon;
    let out = a;
    let why = 'u';
    const saw = (a ? a.id + (a.done ? '' : '*') : '') + '~' + (b ? b.id + (b.done ? '' : '*') : '');
    // console.log('SAW', saw)
    if (MAXCYCLE < ctx.seen[saw]) {
        out = val_1.Nil.make(ctx, 'cycle', a, b);
    }
    else {
        ctx.seen[saw] = 1 + (ctx.seen[saw] ?? 0);
        try {
            let unified = false;
            if (b && (val_1.TOP === a || !a)) {
                out = b;
                why = 'b';
            }
            else if (a && (val_1.TOP === b || !b)) {
                out = a;
                why = 'a';
            }
            else if (a && b && val_1.TOP !== b) {
                if (a.isNil) {
                    out = update(a, b);
                    why = 'an';
                }
                else if (b.isNil) {
                    out = update(b, a);
                    why = 'bn';
                }
                else if (a.isConjunctVal) {
                    out = a.unify(b, ctx);
                    unified = true;
                    why = 'acj';
                }
                else if (b.isConjunctVal
                    || b.isDisjunctVal
                    || b.isRefVal
                    || b.isPrefVal
                    || b.isFuncVal) {
                    out = b.unify(a, ctx);
                    unified = true;
                    why = 'bv';
                }
                // Exactly equal scalars.
                else if (a.constructor === b.constructor && a.peg === b.peg) {
                    out = update(a, b);
                    why = 'up';
                }
                else {
                    out = a.unify(b, ctx);
                    unified = true;
                    why = 'ab';
                }
            }
            if (!out || !out.unify) {
                out = val_1.Nil.make(ctx, 'unite', a, b, whence + '/nil');
                why += 'N';
            }
            if (type_1.DONE !== out.dc && !unified) {
                let nout = out.unify(val_1.TOP, ctx);
                // console.log('UNITE-NOTDONE', out.canon, '->', nout.canon)
                out = nout;
                why += 'T';
            }
            uc++;
            // TODO: KEEP THIS! print in debug mode! push to ctx.log?
            /*
            // console.log(
              'U',
              ('' + ctx.cc).padStart(2),
              ('' + uc).padStart(4),
              (whence || '').substring(0, 16).padEnd(16),
              why.padEnd(6),
              ctx.path.join('.').padEnd(16),
              (a || '').constructor.name.substring(0, 3),
              '&',
              (b || '').constructor.name.substring(0, 3),
              '|',
              '  '.repeat(ctx.path.length),
              a?.canon, '&', b?.canon, '->', out.canon)
            */
        }
        catch (err) {
            // console.log(err)
            out = val_1.Nil.make(ctx, 'internal', a, b);
        }
    }
    // console.log('UNITE', ctx.cc, whence, a?.id + '=' + ac, b?.id + '=' + bc, '->', out?.canon, 'W=' + why, 'E=', out?.err)
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}
class Context {
    constructor(cfg) {
        this.cc = -1;
        this.var = {};
        _Context_errlist.set(this, void 0); // Nil error log of current unify.
        this.root = cfg.root;
        this.path = cfg.path || [];
        // this.err = cfg.err || []
        this.src = cfg.src;
        __classPrivateFieldSet(this, _Context_errlist, cfg.err || [], "f");
        // Multiple unify passes will keep incrementing Val counter.
        this.vc = null == cfg.vc ? 1_000_000_000 : cfg.vc;
        this.cc = null == cfg.cc ? this.cc : cfg.cc;
        this.var = cfg.var || this.var;
        this.seenI = cfg.seenI ?? 0;
        this.seen = cfg.seen ?? {};
    }
    clone(cfg) {
        return new Context({
            root: cfg.root || this.root,
            path: cfg.path,
            err: cfg.err || __classPrivateFieldGet(this, _Context_errlist, "f"),
            vc: this.vc,
            cc: this.cc,
            var: { ...this.var },
            src: this.src,
            seenI: this.seenI,
            seen: this.seen,
        });
    }
    descend(key) {
        return this.clone({
            root: this.root,
            path: this.path.concat(key),
        });
    }
    get err() {
        let a = [...__classPrivateFieldGet(this, _Context_errlist, "f")];
        a.push = () => {
            throw new Error('ERR-PUSH');
        };
        return a;
    }
    adderr(err, whence) {
        // console.log('ADDERR', whence, err?.why)
        ;
        __classPrivateFieldGet(this, _Context_errlist, "f").push(err);
        if (null == err.msg || '' == err.msg) {
            (0, err_1.descErr)(err, this);
        }
    }
    find(path) {
        let node = this.root;
        let pI = 0;
        for (; pI < path.length; pI++) {
            let part = path[pI];
            if (node instanceof val_1.MapVal) {
                node = node.peg[part];
            }
            else if (node instanceof val_1.ListVal) {
                node = node.peg[part];
            }
            else {
                break;
            }
        }
        if (pI < path.length) {
            node = undefined;
        }
        return node;
    }
}
exports.Context = Context;
_Context_errlist = new WeakMap();
class Unify {
    constructor(root, lang, ctx, src) {
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        this.cc = 0;
        this.root = root;
        this.res = root;
        this.err = root.err || [];
        let res = root;
        let uctx = ctx;
        // Only unify if no syntax errors
        if (!root.nil) {
            uctx = uctx ?? new Context({
                root: res,
                err: this.err,
                src,
            });
            let maxcc = 9; // 99
            for (; this.cc < maxcc && type_1.DONE !== res.dc; this.cc++) {
                // console.log('CC', this.cc, res.canon)
                uctx.cc = this.cc;
                res = unite(uctx, res, val_1.TOP, 'unify');
                uctx = uctx.clone({ root: res });
            }
        }
        // console.log('CC-END', uctx?.cc, uctx?.err)
        this.res = res;
    }
}
exports.Unify = Unify;
//# sourceMappingURL=unify.js.map